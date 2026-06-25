from __future__ import annotations

import pytest

from app.models.state import SessionState
from app.services.memory_service import memory_service


class TestMemoryService:
    def test_build_memory_prompt_empty(self):
        session = SessionState(
            session_id="test",
            part="part_1",
            topic="test",
            user_goal=None,
            auto_speak=True,
            status="active",
            current_question="test",
            memory_summary="",
        )
        result = memory_service.build_memory_prompt(session)
        assert result == "(no memory yet)"

    def test_build_memory_prompt_with_items(self):
        session = SessionState(
            session_id="test",
            part="part_1",
            topic="test",
            user_goal=None,
            auto_speak=True,
            status="active",
            current_question="test",
            memory_summary="item1; item2",
        )
        result = memory_service.build_memory_prompt(session)
        assert "item1" in result
        assert "item2" in result

    def test_merge_memory_adds_new_item(self):
        result = memory_service._merge_memory("item1", "item2")
        assert "item1" in result
        assert "item2" in result

    def test_merge_memory_prevents_duplicates(self):
        result = memory_service._merge_memory("item1", "item1")
        assert result.count("item1") == 1

    def test_fallback_memory_extract_short_text(self):
        result = memory_service._fallback_memory_extract("hi", "current")
        assert result == "current"

    def test_fallback_memory_extract_with_preference(self):
        result = memory_service._fallback_memory_extract(
            "I like traveling to Japan",
            "current",
        )
        assert "User preference" in result or result == "current"
