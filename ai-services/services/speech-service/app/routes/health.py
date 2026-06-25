from __future__ import annotations

import os

from fastapi import APIRouter

from app.config import settings
from app.models.schemas import HealthResponse
from app.services.llm_service import llm_service
from app.services.stt_service import stt_service
from app.services.tts_service import tts_service
from app.database import ensure_schema

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
@router.get("/api/speaking/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    db_status = "ready" if ensure_schema() else "fallback"

    return HealthResponse(
        status="ok",
        stt=stt_service.status,
        llm=llm_service.status,
        tts=tts_service.status,
        memoryStore=db_status,
        whisperModel=settings.whisper_model,
        groqModel=settings.groq_model if llm_service._groq_available else None,
        ollamaModel=settings.ollama_model,
        voice=settings.tts_voice,
    )
