from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def fmt_utc(value: datetime) -> str:
    return value.replace(tzinfo=timezone.utc).isoformat()


def clean(text: Any | None) -> str:
    return re.sub(r"\s+", " ", str(text or "")).strip()


def normalize_json_payload(content: Any) -> dict[str, Any] | None:
    if isinstance(content, dict):
        return content
    text = clean(content)
    if not text:
        return None
    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        pass
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def mime_type_to_suffix(mime_type: str | None) -> str:
    normalized = clean(mime_type).lower()
    if "mp4" in normalized or "m4a" in normalized:
        return ".mp4"
    if "ogg" in normalized:
        return ".ogg"
    if "wav" in normalized:
        return ".wav"
    if "webm" in normalized:
        return ".webm"
    return ".webm"


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def truncate_words(text: str, max_words: int) -> str:
    words = clean(text).split()
    if len(words) <= max_words:
        return " ".join(words)
    return " ".join(words[:max_words]).rstrip(",;:") + "..."


def topic_text(topic: str) -> str:
    normalized = clean(topic)
    return "" if normalized.lower() in {"", "open conversation"} else normalized


def split_memory_items(summary: str) -> list[str]:
    items: list[str] = []
    seen: set[str] = set()
    for chunk in re.split(r"(?:\s*\|\s*|\s*•\s*|\s*;\s*|\n+)", clean(summary)):
        normalized = clean(chunk).rstrip(".")
        if not normalized:
            continue
        normalized = re.sub(
            r"^(?:the user mentioned|user mentioned|user said|user thinks|memory note|current conversation focus)\s*:\s*",
            "",
            normalized,
            flags=re.IGNORECASE,
        ).strip()
        key = normalized.lower()
        if not normalized or key in seen:
            continue
        seen.add(key)
        items.append(normalized)
    return items


def strip_speaking_noise(text: str) -> str:
    normalized = clean(text)
    if not normalized:
        return ""
    return re.sub(
        r"^(?:sorry|okay|well|um|uh|so|actually|please|here|first|second|third)\b[,.\s-]*",
        "",
        normalized,
        flags=re.IGNORECASE,
    ).strip()


def is_request_like(text: str) -> bool:
    return bool(
        re.match(
            r"^(?:i want you to|i want to know|can you|could you|please|tell me|what about|how about|what do you think|do you think|would you|should i|let me know|help me)\b",
            clean(text),
            flags=re.IGNORECASE,
        )
    )


def parse_db_datetime(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            pass
    return utc_now()


def json_dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def json_load(value: Any, default: Any) -> Any:
    if value in (None, ""):
        return default
    try:
        return json.loads(value)
    except Exception:
        return default


def build_history_text(turns: list[Any]) -> str:
    """Build conversation history text for LLM context."""
    if not turns:
        return "(no prior turns)"
    return "\n".join(
        f"Q: {turn.question}\nA: {turn.user_transcript}\nCoach: {turn.assistant_reply}"
        for turn in turns[-4:]
    )


def build_recent_assistant_replies(turns: list[Any], limit: int = 3) -> str:
    """Build recent assistant replies for avoiding repetition."""
    replies = [clean(turn.assistant_reply) for turn in turns[-limit:] if clean(turn.assistant_reply)]
    if not replies:
        return "(none yet)"
    return "\n".join(f"- {reply}" for reply in replies)
