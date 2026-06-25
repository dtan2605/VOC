from __future__ import annotations

import os
from typing import Any


class Settings:
    def __init__(self) -> None:
        self.db_host = os.getenv("SPEECH_DB_HOST", "localhost")
        self.db_port = int(os.getenv("SPEECH_DB_PORT", "3309"))
        self.db_name = os.getenv("SPEECH_DB_NAME", "voc_speaking")
        self.db_user = os.getenv("SPEECH_DB_USER", "voc_user")
        self.db_password = os.getenv("SPEECH_DB_PASSWORD", "ChangeMe123!")
        self.db_pool_size = int(os.getenv("SPEECH_DB_POOL_SIZE", "10"))
        self.db_pool_recycle = int(os.getenv("SPEECH_DB_POOL_RECYCLE", "3600"))

        self.groq_api_key = os.getenv("GROQ_API_KEY", "")
        self.groq_base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
        self.groq_model = os.getenv("GROQ_MODEL", "llama3-8b-8192")
        self.groq_timeout = float(os.getenv("GROQ_TIMEOUT", "20.0"))
        self.groq_max_retries = int(os.getenv("GROQ_MAX_RETRIES", "2"))

        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", self._default_ollama_url()).rstrip("/")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
        self.ollama_timeout = float(os.getenv("OLLAMA_TIMEOUT", "30.0"))

        self.whisper_model = os.getenv("WHISPER_MODEL", "small.en")
        self.whisper_device = os.getenv("WHISPER_DEVICE", "cpu")
        self.whisper_compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

        self.kokoro_model_path = os.getenv("KOKORO_MODEL_PATH", "D:\Project\Hybrid\VOC\models\tts\kokoro-v1.0.onnx")
        self.kokoro_voices_path = os.getenv("KOKORO_VOICES_PATH", "/app/models/tts/voices-v1.0.bin")
        self.tts_voice = os.getenv("TTS_VOICE", "af_bella")
        self.tts_speed = float(os.getenv("TTS_SPEED", "1.0"))
        self.tts_lang = os.getenv("TTS_LANG", "en-us")
        self.tts_max_words = int(os.getenv("TTS_MAX_WORDS", "80"))

        self.cors_origins = [
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://localhost:5173,http://localhost",
            ).split(",")
            if origin.strip()
        ]

        self.rate_limit_per_minute = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
        self.max_audio_size_mb = int(os.getenv("MAX_AUDIO_SIZE_MB", "10"))
        self.max_transcript_length = int(os.getenv("MAX_TRANSCRIPT_LENGTH", "2000"))

    @staticmethod
    def _default_ollama_url() -> str:
        return "http://host.docker.internal:11434" if os.path.exists("/.dockerenv") else "http://localhost:11434"


settings = Settings()
