from fastapi import FastAPI

app = FastAPI(
    title="Recommendation Service",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "Recommendation Service Running"
    }