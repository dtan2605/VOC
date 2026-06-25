from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class SpeakingCreateRequest(BaseModel):
    part: Literal["part_1", "part_2", "part_3"] = "part_1"
    topic: str = ""
    autoSpeak: bool = True
    userGoal: str | None = None


class SpeakingScoreBreakdown(BaseModel):
    fluencyAndCoherence: float
    lexicalResource: float
    grammaticalRangeAccuracy: float
    pronunciation: float
    overall: float


class SpeakingErrorItem(BaseModel):
    issue: str
    correction: str
    example: str


class SpeakingTurnResponse(BaseModel):
    turnId: str
    question: str
    userTranscript: str
    assistantReply: str
    followUpQuestion: str
    speakingSummary: str
    pronunciationSummary: str
    memorySummary: str
    source: Literal["audio", "text"]
    scores: SpeakingScoreBreakdown
    errors: list[SpeakingErrorItem]
    rephrasing: str
    wordCount: int
    ttsAudioBase64: str | None = None
    ttsMimeType: str | None = None
    createdAtUtc: str


class SpeakingSessionResponse(BaseModel):
    sessionId: str
    part: Literal["part_1", "part_2", "part_3"]
    topic: str
    autoSpeak: bool
    status: Literal["active", "completed"]
    currentQuestion: str
    memorySummary: str
    turns: list[SpeakingTurnResponse] = Field(default_factory=list)
    createdAtUtc: str
    updatedAtUtc: str


class SpeakingTurnResult(BaseModel):
    session: SpeakingSessionResponse
    turn: SpeakingTurnResponse


class HealthResponse(BaseModel):
    status: str
    stt: str
    llm: str
    tts: str
    memoryStore: str | None = None
    whisperModel: str | None = None
    groqModel: str | None = None
    ollamaModel: str | None = None
    voice: str | None = None


class ErrorResponse(BaseModel):
    error: str
    detail: str | None = None
