from typing import Dict, List, Tuple

def rank_candidates(scores: Dict[int, float], top_k: int = 10) -> List[Tuple[int, float]]:
	"""Return top_k candidates sorted by descending score as (id, score) tuples."""
	if not scores:
		return []
	sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)
	return sorted_items[:top_k]

__all__ = ["rank_candidates"]
