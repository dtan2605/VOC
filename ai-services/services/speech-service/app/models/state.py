from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

from app.utils.helpers import utc_now


@dataclass
class TurnState:
    turn_id: str
    turn_index: int
    question: str
    user_transcript: str
    assistant_reply: str
    follow_up_question: str
    speaking_summary: str
    pronunciation_summary: str
    memory_summary: str
    source: Literal["audio", "text"]
    scores: dict[str, float]
    errors: list[dict[str, str]]
    rephrasing: str
    word_count: int
    tts_audio_base64: str | None
    tts_mime_type: str | None
    created_at_utc: datetime


@dataclass
class SessionState:
    session_id: str
    part: Literal["part_1", "part_2", "part_3"]
    topic: str
    user_goal: str | None
    auto_speak: bool
    status: Literal["active", "completed"]
    current_question: str
    memory_summary: str
    turns: list[TurnState] = field(default_factory=list)
    created_at_utc: datetime = field(default_factory=lambda: utc_now())
    updated_at_utc: datetime = field(default_factory=lambda: utc_now())
