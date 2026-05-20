from fastapi import FastAPI

app = FastAPI(
    title="Pronunciation Service",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "Pronunciation Service Running"
    }