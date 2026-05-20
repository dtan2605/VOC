from fastapi import FastAPI

app = FastAPI(
    title="NLP Service",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "NLP Service Running"
    }