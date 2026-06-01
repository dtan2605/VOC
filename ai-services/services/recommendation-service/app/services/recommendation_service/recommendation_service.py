import os
from typing import List, Tuple

import pandas as pd
import numpy as np

from ..prediction_service.prediction_service import PredictionService

# import ranking util with resilient fallbacks to accommodate different import roots
try:
	from ....utils.ranking_utils import rank_candidates  # type: ignore
except Exception:
	try:
		from ...utils.ranking_utils import rank_candidates  # type: ignore
	except Exception:
		try:
			from utils.ranking_utils import rank_candidates  # type: ignore
		except Exception:
			# fallback local implementation
			def rank_candidates(scores, top_k=10):
				return sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]


class RecommendationService:
	"""Simple rule-based recommendation service that plugs into the repo layout.

	Behavior:
	- Loads `vocabulary_dataset.csv` and `user_learning_history.csv` when available.
	- For each candidate word computes a priority score using a small heuristic
	  (low mastery and long time-since-review increase priority) and returns top-k.
	"""

	def __init__(self):
		base = os.path.dirname(__file__)
		data_dir = os.path.normpath(os.path.join(base, "..", "..", "ml", "datasets"))

		self.vocab_path = os.path.join(data_dir, "vocabulary_dataset.csv")
		self.history_path = os.path.join(data_dir, "user_learning_history.csv")

		self.vocab_df = self._load_csv(self.vocab_path)
		self.history_df = self._load_csv(self.history_path)

		self.pred = PredictionService(self.history_df)

	def _load_csv(self, path: str) -> pd.DataFrame:
		try:
			if os.path.exists(path) and os.path.getsize(path) > 0:
				return pd.read_csv(path)
		except Exception:
			pass
		return pd.DataFrame()

	def recommend(self, user_id: int, top_k: int = 10) -> List[Tuple[int, float]]:
		# if no vocab present, return empty
		if self.vocab_df.empty:
			return []

		# determine id column
		id_col = None
		for c in ["id", "word_id", "vocab_id"]:
			if c in self.vocab_df.columns:
				id_col = c
				break
		if id_col is None:
			# fallback to index
			self.vocab_df = self.vocab_df.reset_index().rename(columns={"index": "word_id"})
			id_col = "word_id"

		candidates = list(self.vocab_df[id_col].dropna().unique())

		# score each candidate using prediction service (lower mastery -> higher priority)
		scores = {}
		for wid in candidates:
			mastery = self.pred.predict_mastery(user_id, wid)
			# heuristic: priority = (1 - mastery) + small random jitter
			score = float((1.0 - mastery) + 1e-6 * np.random.rand())
			scores[int(wid)] = score

		ranked = rank_candidates(scores, top_k=top_k)
		return ranked


__all__ = ["RecommendationService"]
