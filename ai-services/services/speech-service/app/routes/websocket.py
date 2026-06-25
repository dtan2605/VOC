from __future__ import annotations

import json
import uuid
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder

from app.models.schemas import SpeakingCreateRequest
from app.models.state import SessionState
from app.repositories import cache_session, load_session, persist_session, persist_session_with_turn
from app.services.conversation_service import conversation_service
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service
from app.utils.helpers import clean, fmt_utc, mime_type_to_suffix, utc_now

router = APIRouter()


def to_response_turn(turn) -> dict[str, Any]:
    return {
        "turnId": turn.turn_id,
        "question": turn.question,
        "userTranscript": turn.user_transcript,
        "assistantReply": turn.assistant_reply,
        "followUpQuestion": turn.follow_up_question,
        "speakingSummary": turn.speaking_summary,
        "pronunciationSummary": turn.pronunciation_summary,
        "memorySummary": turn.memory_summary,
        "source": turn.source,
        "scores": turn.scores,
        "errors": turn.errors,
        "rephrasing": turn.rephrasing,
        "wordCount": turn.word_count,
        "ttsAudioBase64": turn.tts_audio_base64,
        "ttsMimeType": turn.tts_mime_type,
        "createdAtUtc": fmt_utc(turn.created_at_utc),
    }


def to_response_session(session: SessionState) -> dict[str, Any]:
    return {
        "sessionId": session.session_id,
        "part": session.part,
        "topic": session.topic,
        "autoSpeak": session.auto_speak,
        "status": session.status,
        "currentQuestion": session.current_question,
        "memorySummary": session.memory_summary,
        "turns": [to_response_turn(turn) for turn in session.turns],
        "createdAtUtc": fmt_utc(session.created_at_utc),
        "updatedAtUtc": fmt_utc(session.updated_at_utc),
    }


async def create_session_state(request: SpeakingCreateRequest) -> SessionState:
    session = SessionState(
        session_id=str(uuid.uuid4()),
        part=request.part,
        topic=clean(request.topic) or "Open conversation",
        user_goal=clean(request.userGoal) or None,
        auto_speak=request.autoSpeak,
        status="active",
        current_question="",
        memory_summary="",
    )

    session.current_question = await conversation_service.generate_opening_question(session)
    cache_session(session)
    persist_session(session)
    return session


async def process_turn(
    session: SessionState,
    transcript: str,
    source: str,
    emit: Any,
) -> None:
    await emit({"type": "turn_started", "source": source, "transcript": transcript})

    analysis = await conversation_service.evaluate_turn(session, transcript)

    if analysis.get("_llmFallback"):
        logger.error("LLM provider failed to generate response for turn")
        await emit({"type": "error", "message": "AI response generation failed. Check LLM provider logs."})

    turn = conversation_service.build_turn(session, transcript, source, analysis)

    assistant_text = clean(f"{turn.assistant_reply} {turn.follow_up_question}")
    turn.tts_audio_base64, turn.tts_mime_type = await tts_service.synthesize(assistant_text)

    session.memory_summary = turn.memory_summary
    session.current_question = turn.follow_up_question
    session.updated_at_utc = utc_now()
    session.status = "active"
    session.turns.append(turn)

    cache_session(session)
    persist_session_with_turn(session, turn)

    await emit({
        "type": "analysis",
        "speakingSummary": turn.speaking_summary,
        "pronunciationSummary": turn.pronunciation_summary,
        "memorySummary": turn.memory_summary,
        "scores": turn.scores,
        "errors": turn.errors,
        "rephrasing": turn.rephrasing,
        "expectedAnswer": turn.follow_up_question,
    })

    await emit({
        "type": "assistant_sentence",
        "text": clean(f"{turn.assistant_reply}\n\n{turn.follow_up_question}"),
        "index": 0,
        "audioBase64": turn.tts_audio_base64,
        "mimeType": turn.tts_mime_type,
        "final": True,
    })

    await emit({
        "type": "turn_complete",
        "session": to_response_session(session),
        "turn": to_response_turn(turn),
    })


@router.websocket("/api/speaking/ws")
async def speaking_websocket(websocket: WebSocket) -> None:
    await websocket.accept()
    session: SessionState | None = None
    audio_buffer = bytearray()
    recording_active = False
    recording_mime_type: str | None = None

    async def emit(payload: dict[str, Any]) -> None:
        await websocket.send_json(jsonable_encoder(payload))

    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            if message.get("bytes") is not None:
                if recording_active:
                    audio_buffer.extend(message["bytes"])
                continue

            text_message = message.get("text")
            if not text_message:
                continue

            data = json.loads(text_message)
            message_type = data.get("type")

            if message_type == "start":
                request = SpeakingCreateRequest(
                    part=data.get("part", "part_1"),
                    topic=data.get("topic", ""),
                    autoSpeak=bool(data.get("autoSpeak", True)),
                    userGoal=data.get("userGoal"),
                )
                session = await create_session_state(request)
                await emit({"type": "session_started", "session": to_response_session(session)})

                opening_audio_base64, opening_mime_type = await tts_service.synthesize(session.current_question)
                await emit({
                    "type": "assistant_sentence",
                    "text": session.current_question,
                    "index": 0,
                    "audioBase64": opening_audio_base64,
                    "mimeType": opening_mime_type,
                    "final": True,
                })
                continue

            if session is None:
                await emit({"type": "error", "message": "Start a session before sending audio or text."})
                continue

            if message_type == "audio_start":
                audio_buffer = bytearray()
                recording_active = True
                recording_mime_type = clean(data.get("mimeType")) or None
                await emit({"type": "segment_started"})
                continue

            if message_type == "audio_end":
                recording_active = False
                if not audio_buffer:
                    await emit({"type": "segment_empty"})
                    continue

                transcript = await stt_service.transcribe(
                    bytes(audio_buffer),
                    suffix=mime_type_to_suffix(recording_mime_type),
                )
                audio_buffer = bytearray()
                recording_mime_type = None

                if not transcript:
                    await emit({"type": "transcript", "text": ""})
                    await emit({"type": "turn_skipped", "reason": "empty_transcript"})
                    continue

                await emit({"type": "transcript", "text": transcript})
                await process_turn(session, transcript, "audio", emit)
                continue

            if message_type == "text":
                transcript = clean(data.get("text"))
                if not transcript:
                    await emit({"type": "turn_skipped", "reason": "empty_text"})
                    continue
                await emit({"type": "transcript", "text": transcript})
                await process_turn(session, transcript, "text", emit)
                continue

            if message_type == "reset":
                audio_buffer = bytearray()
                recording_active = False
                recording_mime_type = None
                await emit({"type": "reset_ack"})
                continue

            await emit({"type": "error", "message": f"Unknown message type: {message_type}"})

    except WebSocketDisconnect:
        return
    except RuntimeError:
        return
