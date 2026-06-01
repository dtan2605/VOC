from __future__ import annotations

from typing import Literal

from deep_translator import GoogleTranslator
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


MODEL_NAME = "deep-translator"


class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)
    source_language: Literal["auto", "en", "vi"] = "auto"
    target_language: Literal["en", "vi"]


class TranslationResponse(BaseModel):
    original_text: str
    translated_text: str
    source_language: Literal["en", "vi"]
    target_language: Literal["en", "vi"]
    model: str


def normalize_source_language(text: str, source_language: str) -> str:
    if source_language != "auto":
        return source_language

    vietnamese_chars = [
        "ă", "â", "đ", "ê", "ô", "ơ", "ư"
    ]

    normalized = text.lower()

    if any(char in normalized for char in vietnamese_chars):
        return "vi"

    return "en"


app = FastAPI(
    title="Translation Service",
    version="2.0.0"
)


@app.get("/")
async def root():
    return {
        "message": "Translation Service Running",
        "model": MODEL_NAME
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "translation-service",
        "model": MODEL_NAME
    }


@app.post(
    "/api/translation/translate",
    response_model=TranslationResponse
)
async def translate_text(request: TranslationRequest):
    original_text = request.text.strip()

    source_language = normalize_source_language(
        original_text,
        request.source_language
    )

    if source_language == request.target_language:
        return TranslationResponse(
            original_text=original_text,
            translated_text=original_text,
            source_language=source_language,
            target_language=request.target_language,
            model="identity"
        )

    try:
        translated_text = GoogleTranslator(
            source=source_language,
            target=request.target_language
        ).translate(original_text)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Translation failed: {str(exc)}"
        )

    return TranslationResponse(
        original_text=original_text,
        translated_text=translated_text,
        source_language=source_language,
        target_language=request.target_language,
        model=MODEL_NAME
    )