from fastapi import FastAPI

from app.api.v1.dictionary import router as dictionary_router

app = FastAPI()

app.include_router(dictionary_router, prefix="/api/v1")


@app.get("/")
async def read_root():
    return {"message": "Hello, world!"}
