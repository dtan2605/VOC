from fastapi import FastAPI

app = FastAPI(
    title="Translation Service",
    version="1.0.0"
)

@app.get("/")
async def root():
    return {
        "message": "Translation Service Running"
    }