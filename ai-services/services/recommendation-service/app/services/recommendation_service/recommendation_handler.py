from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException

from .recommendation_service import RecommendationService

router = APIRouter()


class RecommendRequest(BaseModel):
	user_id: int
	top_k: int = 10


class RecommendItem(BaseModel):
	word_id: int
	score: float


class RecommendResponse(BaseModel):
	items: List[RecommendItem]


# instantiate a single service for the router
service = RecommendationService()


@router.post("/", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
	try:
		items = service.recommend(req.user_id, req.top_k)
		return RecommendResponse(items=[RecommendItem(word_id=int(wid), score=float(score)) for wid, score in items])
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))
