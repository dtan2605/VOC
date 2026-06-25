from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import ensure_schema
from app.routes import health_router, sessions_router, websocket_router
from app.services.llm_service import llm_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("voc.speech-service")

app = FastAPI(title="VOC Speech Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(sessions_router)
app.include_router(websocket_router)


@app.on_event("startup")
async def startup_event() -> None:
    logger.info("Starting VOC Speech Service v2.0.0")
    logger.info("Groq API key configured: %s", bool(settings.groq_api_key))
    logger.info("Database host: %s", settings.db_host)

    asyncio.create_task(_warmup_runtime())


async def _warmup_runtime() -> None:
    logger.info("Warming up runtime...")

    db_ok = await asyncio.to_thread(ensure_schema)
    logger.info("Database schema: %s", "ready" if db_ok else "fallback")

    ollama_ok = await llm_service.check_ollama_status()
    logger.info("Ollama status: %s", "ready" if ollama_ok else "not available")
    logger.info("LLM provider: %s", llm_service.active_provider)

    if ollama_ok:
        logger.info("Warming up Ollama model...")
        await asyncio.wait_for(llm_service.warmup_ollama(), timeout=60.0)
        logger.info("Ollama model ready")
    else:
        logger.warning("Ollama not available, will try on each request")


@app.on_event("shutdown")
async def shutdown_event() -> None:
    logger.info("Shutting down VOC Speech Service")
    await llm_service.close()


@app.get("/")
async def root() -> dict[str, str]:
    return {"service": "VOC Speech Service", "version": "2.0.0", "status": "ready"}
