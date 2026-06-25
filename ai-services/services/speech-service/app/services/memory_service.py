from __future__ import annotations

import logging
from typing import Any

from app.models.state import SessionState, TurnState
from app.services.llm_service import llm_service
from app.utils.helpers import clean, split_memory_items, truncate_words

logger = logging.getLogger("voc.speech-service.memory")


class MemoryService:
    def __init__(self) -> None:
        self._max_memory_length = 1000
        self._max_items = 20

    def build_memory_prompt(self, session: SessionState) -> str:
        if not session.memory_summary:
            return "(no memory yet)"
        items = split_memory_items(session.memory_summary)
        if not items:
            return "(no memory yet)"
        return "; ".join(items[:self._max_items])

    async def extract_memory_from_turn(
        self,
        session: SessionState,
        transcript: str,
        assistant_reply: str,
    ) -> str:
        system_prompt = (
            "You extract stable facts and preferences from conversations for long-term memory. "
            "Return JSON with a single key 'memoryNote' containing a concise fact or preference. "
            "Focus on: personal details, preferences, habits, relationships, goals, experiences. "
            "Do NOT include: questions, requests, greetings, filler words, or temporary states. "
            "If there's nothing worth remembering, return an empty string."
        )

        user_prompt = (
            f"Current memory: {session.memory_summary or '(empty)'}\n\n"
            f"User said: {transcript}\n\n"
            f"Assistant replied: {assistant_reply}\n\n"
            "Extract a stable fact or preference worth remembering. "
            "Return JSON: {\"memoryNote\": \"...\"}"
        )

        result = await llm_service.call_with_timeout(
            system_prompt,
            user_prompt,
            timeout_seconds=15.0,
            temperature=0.3,
            context="Memory extraction",
        )

        if not result:
            return self._fallback_memory_extract(transcript, session.memory_summary)

        memory_note = clean(result.get("memoryNote", ""))
        if not memory_note:
            return session.memory_summary

        return self._merge_memory(session.memory_summary, memory_note)

    def _fallback_memory_extract(self, transcript: str, current_memory: str) -> str:
        words = clean(transcript).split()
        if len(words) < 6:
            return current_memory

        if any(word in transcript.lower() for word in ["i like", "i love", "i enjoy", "i prefer", "my favorite"]):
            note = truncate_words(f"User preference: {transcript}", 20)
            return self._merge_memory(current_memory, note)

        if any(word in transcript.lower() for word in ["i work", "i study", "i live", "i'm from", "i have"]):
            note = truncate_words(f"User fact: {transcript}", 20)
            return self._merge_memory(current_memory, note)

        return current_memory

    def _merge_memory(self, current: str, new_item: str) -> str:
        items = split_memory_items(current)
        new_item_clean = clean(new_item).rstrip(".")

        existing_keys = {item.lower() for item in items}
        if new_item_clean.lower() in existing_keys:
            return current

        items.append(new_item_clean)

        if len(items) > self._max_items:
            items = items[-self._max_items:]

        merged = "; ".join(items)
        return merged[:self._max_memory_length]

    def update_session_memory(self, session: SessionState, new_memory: str) -> None:
        session.memory_summary = new_memory[:self._max_memory_length]


memory_service = MemoryService()
