from __future__ import annotations

import logging
from typing import Any

from app.services.llm_service import llm_service
from app.utils.helpers import clamp, clean

logger = logging.getLogger("voc.speech-service.scoring")


class ScoringService:
    DEFAULT_SCORES = {
        "fluencyAndCoherence": 5.0,
        "lexicalResource": 5.0,
        "grammaticalRangeAccuracy": 5.0,
        "pronunciation": 5.0,
        "overall": 5.0,
    }

    def normalize_scores(self, raw_scores: Any, transcript: str) -> dict[str, float]:
        if not isinstance(raw_scores, dict):
            logger.warning("Invalid scores format: %s, using defaults", type(raw_scores))
            return self.DEFAULT_SCORES.copy()

        try:
            scores = {
                "fluencyAndCoherence": float(raw_scores.get("fluencyAndCoherence", 5.0)),
                "lexicalResource": float(raw_scores.get("lexicalResource", 5.0)),
                "grammaticalRangeAccuracy": float(raw_scores.get("grammaticalRangeAccuracy", 5.0)),
                "pronunciation": float(raw_scores.get("pronunciation", 5.0)),
                "overall": float(raw_scores.get("overall", 5.0)),
            }
        except (TypeError, ValueError) as exc:
            logger.warning("Failed to parse scores: %s, using defaults", exc)
            return self.DEFAULT_SCORES.copy()

        return {key: round(clamp(value, 1.0, 9.0), 1) for key, value in scores.items()}

    def normalize_errors(self, raw_errors: Any) -> list[dict[str, str]]:
        result: list[dict[str, str]] = []
        if isinstance(raw_errors, list):
            for item in raw_errors[:3]:
                if isinstance(item, dict):
                    result.append({
                        "issue": clean(item.get("issue", "")),
                        "correction": clean(item.get("correction", "")),
                        "example": clean(item.get("example", "")),
                    })
        return result

    async def score_turn(self, transcript: str, part: str, topic: str) -> dict[str, float]:
        system_prompt = (
            "You are an IELTS speaking examiner. Score the user's response on the IELTS speaking scale (1-9). "
            "Return JSON with exactly these keys: "
            "fluencyAndCoherence, lexicalResource, grammaticalRangeAccuracy, pronunciation, overall. "
            "Each score must be a number between 1.0 and 9.0 (can have one decimal place). "
            "Be realistic and fair - don't inflate scores."
        )

        user_prompt = (
            f"Part: {part}\n"
            f"Topic: {topic or 'general conversation'}\n\n"
            f"User's response: {transcript}\n\n"
            "Score this response according to IELTS speaking criteria. "
            "Return JSON: {\"fluencyAndCoherence\": X, \"lexicalResource\": X, \"grammaticalRangeAccuracy\": X, \"pronunciation\": X, \"overall\": X}"
        )

        result = await llm_service.call_with_timeout(
            system_prompt,
            user_prompt,
            timeout_seconds=10.0,
            temperature=0.2,
            context="IELTS scoring",
        )

        if not result:
            return self.DEFAULT_SCORES.copy()

        return self.normalize_scores(result, transcript)


scoring_service = ScoringService()
