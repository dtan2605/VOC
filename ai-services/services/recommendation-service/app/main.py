from fastapi import FastAPI

from services.recommendation_service.recommendation_handler import router as recommendation_router

app = FastAPI(
    title="Recommendation Service",
    version="1.0.0"
)


app.include_router(recommendation_router, prefix="/recommendation", tags=["recommendation"])


@app.get("/")
async def root():
    return {"message": "Recommendation Service Running"}