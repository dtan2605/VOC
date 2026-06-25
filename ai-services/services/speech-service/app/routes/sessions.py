from __future__ import annotations

import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models.schemas import (
    SpeakingCreateRequest,
    SpeakingSessionResponse,
    SpeakingTurnResponse,
    SpeakingTurnResult,
)
from app.models.state import SessionState
from app.repositories import cache_session, load_session, persist_session
from app.services.conversation_service import conversation_service
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service
from app.utils.helpers import clean, fmt_utc, mime_type_to_suffix, utc_now

router = APIRouter()


def to_response_turn(turn) -> SpeakingTurnResponse:
    return SpeakingTurnResponse(
        turnId=turn.turn_id,
        question=turn.question,
        userTranscript=turn.user_transcript,
        assistantReply=turn.assistant_reply,
        followUpQuestion=turn.follow_up_question,
        speakingSummary=turn.speaking_summary,
        pronunciationSummary=turn.pronunciation_summary,
        memorySummary=turn.memory_summary,
        source=turn.source,
        scores=turn.scores,
        errors=turn.errors,
        rephrasing=turn.rephrasing,
        wordCount=turn.word_count,
        ttsAudioBase64=turn.tts_audio_base64,
        ttsMimeType=turn.tts_mime_type,
        createdAtUtc=fmt_utc(turn.created_at_utc),
    )


def to_response_session(session: SessionState) -> SpeakingSessionResponse:
    return SpeakingSessionResponse(
        sessionId=session.session_id,
        part=session.part,
        topic=session.topic,
        autoSpeak=session.auto_speak,
        status=session.status,
        currentQuestion=session.current_question,
        memorySummary=session.memory_summary,
        turns=[to_response_turn(turn) for turn in session.turns],
        createdAtUtc=fmt_utc(session.created_at_utc),
        updatedAtUtc=fmt_utc(session.updated_at_utc),
    )


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


@router.post("/api/speaking/sessions", response_model=SpeakingSessionResponse, status_code=201)
async def create_session(request: SpeakingCreateRequest) -> SpeakingSessionResponse:
    session = await create_session_state(request)
    return to_response_session(session)


@router.get("/api/speaking/sessions/{session_id}", response_model=SpeakingSessionResponse)
async def get_session(session_id: str) -> SpeakingSessionResponse:
    session = load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Speaking session not found.")
    return to_response_session(session)


@router.post("/api/speaking/sessions/{session_id}/turns", response_model=SpeakingTurnResult)
async def submit_turn(
    session_id: str,
    text: str | None = Form(default=None),
    audio: UploadFile | None = File(default=None),
) -> SpeakingTurnResult:
    session = load_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Speaking session not found.")

    transcript = clean(text)
    source = "text"

    if audio is not None and not transcript:
        audio_bytes = await audio.read()
        suffix = mime_type_to_suffix(audio.content_type)
        transcript = await stt_service.transcribe(audio_bytes, suffix)
        source = "audio"

    if not transcript:
        raise HTTPException(status_code=400, detail="Provide audio or typed text for the speaking turn.")

    analysis = await conversation_service.evaluate_turn(session, transcript)
    turn = conversation_service.build_turn(session, transcript, source, analysis)

    assistant_text = clean(f"{turn.assistant_reply} {turn.follow_up_question}")
    turn.tts_audio_base64, turn.tts_mime_type = await tts_service.synthesize(assistant_text)

    session.memory_summary = turn.memory_summary
    session.current_question = turn.follow_up_question
    session.updated_at_utc = utc_now()
    session.status = "active"
    session.turns.append(turn)

    cache_session(session)

    from app.repositories import persist_session_with_turn
    persist_session_with_turn(session, turn)

    return SpeakingTurnResult(
        session=to_response_session(session),
        turn=to_response_turn(turn),
    )
