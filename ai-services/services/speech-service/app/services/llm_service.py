from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger("voc.speech-service.llm")


class LLMService:
    def __init__(self) -> None:
        self._groq_available = bool(settings.groq_api_key)

    async def _make_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=settings.groq_timeout)

    async def close(self) -> None:
        pass

    async def check_ollama_status(self) -> bool:
        try:
            async with await self._make_client() as client:
                response = await client.get(f"{settings.ollama_base_url}/api/tags", timeout=10.0)
                response.raise_for_status()
                payload = response.json()
                models = payload.get("models", [])
                if isinstance(models, list):
                    for item in models:
                        if not isinstance(item, dict):
                            continue
                        name = str(item.get("name", "")).strip()
                        if name == settings.ollama_model or name == f"{settings.ollama_model}:latest":
                            return True
        except Exception as exc:
            logger.debug("Ollama not available: %s", exc)
        return False

    async def call_llm_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.35,
        timeout: float | None = None,
    ) -> dict[str, Any] | None:
        if self._groq_available:
            result = await self._call_groq_json(system_prompt, user_prompt, temperature=temperature)
            if result is not None:
                return result

        result = await self._call_ollama_json(system_prompt, user_prompt, temperature=temperature, timeout=timeout)
        if result is not None:
            return result

        logger.warning("All LLM providers failed")
        return None

    async def _call_groq_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.35,
    ) -> dict[str, Any] | None:
        payload = {
            "model": settings.groq_model,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }

        for attempt in range(settings.groq_max_retries + 1):
            try:
                async with await self._make_client() as client:
                    response = await client.post(
                        f"{settings.groq_base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.groq_api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )

                    if response.status_code == 429:
                        retry_after = int(response.headers.get("Retry-After", "5"))
                        logger.warning("Groq rate limited, waiting %ds (attempt %d/%d)", retry_after, attempt + 1, settings.groq_max_retries + 1)
                        await asyncio.sleep(retry_after)
                        continue

                    response.raise_for_status()
                    result = response.json()
                    content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                    if not content:
                        logger.warning("Groq returned empty content")
                        return None

                    parsed = json.loads(content)
                    if isinstance(parsed, dict):
                        return parsed

                    logger.warning("Groq returned non-dict JSON: %s", type(parsed))
                    return None

            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.warning("Groq call failed (attempt %d/%d): %s", attempt + 1, settings.groq_max_retries + 1, exc)
                if attempt < settings.groq_max_retries:
                    await asyncio.sleep(1.0 * (attempt + 1))

        return None

    async def _call_ollama_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        temperature: float = 0.35,
        timeout: float | None = None,
    ) -> dict[str, Any] | None:
        payload = {
            "model": settings.ollama_model,
            "temperature": temperature,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "format": "json",
        }

        try:
            async with await self._make_client() as client:
                response = await client.post(
                    f"{settings.ollama_base_url}/api/chat",
                    json=payload,
                    timeout=timeout or settings.ollama_timeout,
                )
                response.raise_for_status()
                result = response.json()
                content = result.get("message", {}).get("content", "")

                if not content:
                    return None

                parsed = json.loads(content)
                return parsed if isinstance(parsed, dict) else None

        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.warning("Ollama call failed: %s", exc)
            return None

    async def call_with_timeout(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        timeout_seconds: float = 50.0,
        temperature: float = 0.35,
        context: str = "LLM call",
    ) -> dict[str, Any] | None:
        try:
            return await asyncio.wait_for(
                self.call_llm_json(system_prompt, user_prompt, temperature=temperature, timeout=timeout_seconds),
                timeout=timeout_seconds,
            )
        except asyncio.TimeoutError:
            logger.warning("%s timed out after %.1fs", context, timeout_seconds)
            return None

    async def warmup_ollama(self) -> None:
        try:
            async with await self._make_client() as client:
                await client.post(
                    f"{settings.ollama_base_url}/api/chat",
                    json={
                        "model": settings.ollama_model,
                        "messages": [{"role": "user", "content": "hello"}],
                        "stream": False,
                    },
                    timeout=settings.ollama_timeout,
                )
        except Exception:
            pass

    @property
    def status(self) -> str:
        return "ready"

    @property
    def active_provider(self) -> str:
        return "groq" if self._groq_available else "ollama"


llm_service = LLMService()
