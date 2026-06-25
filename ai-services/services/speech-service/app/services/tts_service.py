from __future__ import annotations

import asyncio
import base64
import io
import logging
import wave
from functools import lru_cache
from typing import Any

import numpy as np

from app.config import settings
from app.utils.helpers import clean, truncate_words

logger = logging.getLogger("voc.speech-service.tts")


try:
    from kokoro_onnx import Kokoro
except Exception:
    Kokoro = None


@lru_cache(maxsize=1)
def load_kokoro_model() -> Any | None:
    if Kokoro is None:
        logger.warning("kokoro-onnx not installed, TTS disabled")
        return None
    if not os.path.exists(settings.kokoro_model_path) or not os.path.exists(settings.kokoro_voices_path):
        logger.warning("Kokoro model files not found")
        return None
    try:
        return Kokoro(settings.kokoro_model_path, settings.kokoro_voices_path)
    except Exception as exc:
        logger.warning("Failed to load Kokoro model: %s", exc)
        return None


import os


class TTSService:
    def __init__(self) -> None:
        self._model = None
        self._lock = asyncio.Lock()

    async def _get_model(self) -> Any | None:
        if self._model is None:
            async with self._lock:
                if self._model is None:
                    self._model = await asyncio.to_thread(load_kokoro_model)
        return self._model

    async def synthesize(self, text: str) -> tuple[str | None, str | None]:
        model = await self._get_model()
        if model is None:
            return None, None

        text = clean(text)
        if not text:
            return None, None

        text = truncate_words(text, settings.tts_max_words)

        try:
            audio_data, sample_rate = await asyncio.to_thread(
                model.create,
                text,
                voice=settings.tts_voice,
                speed=settings.tts_speed,
                lang=settings.tts_lang,
            )

            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, "wb") as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                audio_bytes = (audio_data * 32767).astype(np.int16).tobytes()
                wav_file.writeframes(audio_bytes)

            wav_bytes = wav_buffer.getvalue()
            audio_base64 = base64.b64encode(wav_bytes).decode("utf-8")

            return audio_base64, "audio/wav"

        except Exception as exc:
            logger.error("TTS synthesis failed: %s", exc)
            return None, None

    @property
    def status(self) -> str:
        model = load_kokoro_model()
        return "ready" if model is not None else "fallback"


tts_service = TTSService()
