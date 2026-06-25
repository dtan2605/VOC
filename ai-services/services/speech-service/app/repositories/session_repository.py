from __future__ import annotations

import logging
import threading
from typing import Any

from app.database import get_connection
from app.models.state import SessionState, TurnState
from app.utils.helpers import (
    clean,
    fmt_utc,
    json_dump,
    json_load,
    parse_db_datetime,
    split_memory_items,
    utc_now,
)

logger = logging.getLogger("voc.speech-service.repository")


session_cache_lock = threading.RLock()
session_cache: dict[str, SessionState] = {}


def cache_session(session: SessionState) -> None:
    with session_cache_lock:
        session_cache[session.session_id] = session


def get_cached_session(session_id: str) -> SessionState | None:
    with session_cache_lock:
        return session_cache.get(session_id)


def remove_cached_session(session_id: str) -> None:
    with session_cache_lock:
        session_cache.pop(session_id, None)


def normalize_scores(raw_scores: Any) -> dict[str, float]:
    base = {
        "fluencyAndCoherence": 5.0,
        "lexicalResource": 5.0,
        "grammaticalRangeAccuracy": 5.0,
        "pronunciation": 5.0,
        "overall": 5.0,
    }
    if not isinstance(raw_scores, dict):
        return base
    try:
        scores = {
            "fluencyAndCoherence": float(raw_scores.get("fluencyAndCoherence", 5.0)),
            "lexicalResource": float(raw_scores.get("lexicalResource", 5.0)),
            "grammaticalRangeAccuracy": float(raw_scores.get("grammaticalRangeAccuracy", 5.0)),
            "pronunciation": float(raw_scores.get("pronunciation", 5.0)),
            "overall": float(raw_scores.get("overall", 5.0)),
        }
    except (TypeError, ValueError):
        return base
    from app.utils.helpers import clamp
    return {key: round(clamp(value, 1.0, 9.0), 1) for key, value in scores.items()}


def normalize_errors(raw_errors: Any) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    if isinstance(raw_errors, list):
        for item in raw_errors[:3]:
            if isinstance(item, dict):
                result.append({
                    "issue": clean(item.get("issue")),
                    "correction": clean(item.get("correction")),
                    "example": clean(item.get("example")),
                })
    return result


def turn_from_row(row: dict[str, Any]) -> TurnState:
    transcript = clean(row.get("user_transcript"))
    return TurnState(
        turn_id=str(row["turn_id"]),
        turn_index=int(row["turn_index"]),
        question=clean(row.get("question")),
        user_transcript=transcript,
        assistant_reply=clean(row.get("assistant_reply")),
        follow_up_question=clean(row.get("follow_up_question")),
        speaking_summary=clean(row.get("speaking_summary")),
        pronunciation_summary=clean(row.get("pronunciation_summary")),
        memory_summary=clean(row.get("memory_summary")),
        source="audio" if str(row.get("source", "text")).lower() == "audio" else "text",
        scores=normalize_scores(json_load(row.get("scores_json"), {})),
        errors=normalize_errors(json_load(row.get("errors_json"), [])),
        rephrasing=clean(row.get("rephrasing")) or transcript,
        word_count=int(row.get("word_count") or 0),
        tts_audio_base64=row.get("tts_audio_base64") or None,
        tts_mime_type=row.get("tts_mime_type") or None,
        created_at_utc=parse_db_datetime(row.get("created_at_utc")),
    )


def session_from_row(row: dict[str, Any], turns: list[TurnState]) -> SessionState:
    return SessionState(
        session_id=str(row["session_id"]),
        part=row.get("part") if row.get("part") in {"part_1", "part_2", "part_3"} else "part_1",
        topic=clean(row.get("topic")) or "Open conversation",
        user_goal=clean(row.get("user_goal")) or None,
        auto_speak=bool(row.get("auto_speak")),
        status="completed" if str(row.get("status")) == "completed" else "active",
        current_question=clean(row.get("current_question")),
        memory_summary="; ".join(split_memory_items(clean(row.get("memory_summary"))))[:1000],
        turns=turns,
        created_at_utc=parse_db_datetime(row.get("created_at_utc")),
        updated_at_utc=parse_db_datetime(row.get("updated_at_utc")),
    )


def persist_session(session: SessionState) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO speaking_sessions (
                        session_id, part, topic, user_goal, auto_speak, status,
                        current_question, memory_summary, created_at_utc, updated_at_utc
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON DUPLICATE KEY UPDATE
                        part=VALUES(part), topic=VALUES(topic), user_goal=VALUES(user_goal),
                        auto_speak=VALUES(auto_speak), status=VALUES(status),
                        current_question=VALUES(current_question), memory_summary=VALUES(memory_summary),
                        updated_at_utc=VALUES(updated_at_utc)
                    """,
                    (
                        session.session_id,
                        session.part,
                        session.topic,
                        session.user_goal,
                        1 if session.auto_speak else 0,
                        session.status,
                        session.current_question,
                        session.memory_summary,
                        session.created_at_utc,
                        session.updated_at_utc,
                    ),
                )
            conn.commit()
        return True
    except Exception as exc:
        logger.warning("Failed to persist session %s: %s", session.session_id, exc)
        return False


def persist_turn(session: SessionState, turn: TurnState) -> bool:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO speaking_turns (
                        turn_id, session_id, turn_index, question, user_transcript,
                        assistant_reply, follow_up_question, speaking_summary,
                        pronunciation_summary, memory_summary, source, scores_json,
                        errors_json, rephrasing, word_count, tts_audio_base64,
                        tts_mime_type, created_at_utc
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        turn.turn_id,
                        session.session_id,
                        turn.turn_index,
                        turn.question,
                        turn.user_transcript,
                        turn.assistant_reply,
                        turn.follow_up_question,
                        turn.speaking_summary,
                        turn.pronunciation_summary,
                        turn.memory_summary,
                        turn.source,
                        json_dump(turn.scores),
                        json_dump(turn.errors),
                        turn.rephrasing,
                        turn.word_count,
                        turn.tts_audio_base64,
                        turn.tts_mime_type,
                        turn.created_at_utc,
                    ),
                )
            conn.commit()
        return True
    except Exception as exc:
        logger.warning("Failed to persist turn %s: %s", turn.turn_id, exc)
        return False


def persist_session_with_turn(session: SessionState, turn: TurnState) -> None:
    persist_session(session)
    persist_turn(session, turn)


def load_session_from_db(session_id: str) -> SessionState | None:
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM speaking_sessions WHERE session_id=%s", (session_id,))
                session_row = cursor.fetchone()
                if not session_row:
                    return None
                cursor.execute("SELECT * FROM speaking_turns WHERE session_id=%s ORDER BY turn_index ASC", (session_id,))
                turn_rows = cursor.fetchall() or []
        turns = [turn_from_row(row) for row in turn_rows]
        session = session_from_row(session_row, turns)
        cache_session(session)
        return session
    except Exception as exc:
        logger.warning("Failed to load session %s: %s", session_id, exc)
        return None


def load_session(session_id: str) -> SessionState | None:
    cached = get_cached_session(session_id)
    if cached:
        return cached
    return load_session_from_db(session_id)
