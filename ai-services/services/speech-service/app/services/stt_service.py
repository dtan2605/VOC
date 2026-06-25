from __future__ import annotations

import asyncio
import logging
import os
import tempfile
from functools import lru_cache
from typing import Any

from app.config import settings

logger = logging.getLogger("voc.speech-service.stt")


try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None


@lru_cache(maxsize=1)
def load_whisper_model() -> Any | None:
    if WhisperModel is None:
        logger.warning("faster-whisper not installed, STT disabled")
        return None
    try:
        return WhisperModel(
            settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
        )
    except Exception as exc:
        logger.warning("Failed to load Whisper model: %s", exc)
        return None


class STTService:
    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()

    async def _get_model(self) -> Any | None:
        if self._model is None:
            async with self._lock:
                if self._model is None:
                    self._model = await asyncio.to_thread(load_whisper_model)
        return self._model

    async def transcribe(self, audio_bytes: bytes, suffix: str = ".webm") -> str | None:
        model = await self._get_model()
        if model is None:
            logger.warning("Whisper model not available")
            return None

        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
                temp_file.write(audio_bytes)
                temp_path = temp_file.name

            segments, info = await asyncio.to_thread(
                model.transcribe,
                temp_path,
                beam_size=5,
                language="en",
                vad_filter=True,
            )

            text_parts = []
            for segment in segments:
                text_parts.append(segment.text.strip())

            transcript = " ".join(text_parts).strip()
            if not transcript:
                return None

            return transcript

        except Exception as exc:
            logger.error("Transcription failed: %s", exc)
            return None
        finally:
            if temp_path and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass

    @property
    def status(self) -> str:
        model = load_whisper_model()
        return "ready" if model is not None else "fallback"


stt_service = STTService()
