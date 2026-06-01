import datetime
from typing import Any

import pandas as pd


class PredictionService:
	"""Lightweight prediction service used by RecommendationService.

	This is a placeholder for a real ML model. It uses user history (if provided)
	to estimate a mastery score in [0,1]. If no data exists, returns 0.0.
	"""

	def __init__(self, history_df: pd.DataFrame = None):
		self.history = history_df if history_df is not None else pd.DataFrame()

	def predict_mastery(self, user_id: int, word_id: Any) -> float:
		if self.history is None or self.history.empty:
			return 0.0

		# try to find a row for this user and word
		df = self.history
		mask = (df.get("user_id") == user_id) & ((df.get("word_id") == word_id) | (df.get("vocab_id") == word_id))
		row = df[mask]
		if row.empty:
			return 0.0

		# prefer a 'mastery' or 'score' column
		if "mastery" in row.columns:
			val = float(row.iloc[0]["mastery"])
			return max(0.0, min(1.0, val))

		if "score" in row.columns:
			val = float(row.iloc[0]["score"])
			return max(0.0, min(1.0, val))

		# fallback: compute based on last_seen if available
		if "last_seen" in row.columns:
			try:
				last = pd.to_datetime(row.iloc[0]["last_seen"])
				days = (datetime.datetime.utcnow() - last.to_pydatetime()).days
				# simple decay: mastery = exp(-days/30)
				import math

				return float(math.exp(-float(days) / 30.0))
			except Exception:
				return 0.0

		return 0.0


__all__ = ["PredictionService"]
