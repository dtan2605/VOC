from __future__ import annotations

import pytest

from app.utils.helpers import (
    clean,
    clamp,
    is_request_like,
    normalize_json_payload,
    split_memory_items,
    strip_speaking_noise,
    topic_text,
    truncate_words,
)


class TestClean:
    def test_clean_removes_extra_whitespace(self):
        assert clean("  hello   world  ") == "hello world"

    def test_clean_handles_none(self):
        assert clean(None) == ""

    def test_clean_handles_empty_string(self):
        assert clean("") == ""


class TestClamp:
    def test_clamp_within_range(self):
        assert clamp(5.0, 1.0, 9.0) == 5.0

    def test_clamp_below_minimum(self):
        assert clamp(0.5, 1.0, 9.0) == 1.0

    def test_clamp_above_maximum(self):
        assert clamp(10.0, 1.0, 9.0) == 9.0


class TestTruncateWords:
    def test_truncate_short_text(self):
        assert truncate_words("hello world", 10) == "hello world"

    def test_truncate_long_text(self):
        result = truncate_words("one two three four five", 3)
        assert result == "one two three..."


class TestTopicText:
    def test_topic_text_normal(self):
        assert topic_text("travel") == "travel"

    def test_topic_text_open_conversation(self):
        assert topic_text("Open conversation") == ""

    def test_topic_text_empty(self):
        assert topic_text("") == ""


class TestSplitMemoryItems:
    def test_split_by_semicolon(self):
        items = split_memory_items("item1; item2; item3")
        assert len(items) == 3

    def test_split_removes_duplicates(self):
        items = split_memory_items("item1; item1; item2")
        assert len(items) == 2


class TestStripSpeakingNoise:
    def test_strip_filler_words(self):
        assert strip_speaking_noise("well, I think that...") == "I think that..."

    def test_strip_empty(self):
        assert strip_speaking_noise("") == ""


class TestIsRequestLike:
    def test_is_request_can_you(self):
        assert is_request_like("can you help me?") is True

    def test_is_request_normal_statement(self):
        assert is_request_like("I like traveling") is False


class TestNormalizeJsonPayload:
    def test_normalize_dict(self):
        result = normalize_json_payload({"key": "value"})
        assert result == {"key": "value"}

    def test_normalize_json_string(self):
        result = normalize_json_payload('{"key": "value"}')
        assert result == {"key": "value"}

    def test_normalize_none(self):
        result = normalize_json_payload(None)
        assert result is None
