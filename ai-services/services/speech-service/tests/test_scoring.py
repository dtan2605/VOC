from __future__ import annotations

import pytest

from app.services.scoring_service import scoring_service


class TestScoringService:
    def test_normalize_scores_valid(self):
        raw_scores = {
            "fluencyAndCoherence": 7.5,
            "lexicalResource": 8.0,
            "grammaticalRangeAccuracy": 7.0,
            "pronunciation": 7.5,
            "overall": 7.5,
        }
        result = scoring_service.normalize_scores(raw_scores, "test transcript")
        assert result["fluencyAndCoherence"] == 7.5
        assert result["overall"] == 7.5

    def test_normalize_scores_clamps_values(self):
        raw_scores = {
            "fluencyAndCoherence": 0.5,
            "lexicalResource": 10.0,
            "grammaticalRangeAccuracy": 5.0,
            "pronunciation": 5.0,
            "overall": 5.0,
        }
        result = scoring_service.normalize_scores(raw_scores, "test")
        assert result["fluencyAndCoherence"] == 1.0
        assert result["lexicalResource"] == 9.0

    def test_normalize_scores_invalid_input(self):
        result = scoring_service.normalize_scores("invalid", "test")
        assert result == scoring_service.DEFAULT_SCORES

    def test_normalize_errors_valid(self):
        raw_errors = [
            {"issue": "Grammar", "correction": "Use past tense", "example": "I went"}
        ]
        result = scoring_service.normalize_errors(raw_errors)
        assert len(result) == 1
        assert result[0]["issue"] == "Grammar"

    def test_normalize_errors_limits_to_three(self):
        raw_errors = [
            {"issue": "1", "correction": "1", "example": "1"},
            {"issue": "2", "correction": "2", "example": "2"},
            {"issue": "3", "correction": "3", "example": "3"},
            {"issue": "4", "correction": "4", "example": "4"},
        ]
        result = scoring_service.normalize_errors(raw_errors)
        assert len(result) == 3
