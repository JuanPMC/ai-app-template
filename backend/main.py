from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.ext.asyncio import create_async_engine

from app.api.v1.dictionary import router as dictionary_router
from app.api.v1.word_lists import router as word_lists_router
from app.core.config import get_settings
from app.models.base import Base
import app.models.word  # noqa: F401
import app.models.word_list  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_async_engine(get_settings().database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    yield


app = FastAPI(lifespan=lifespan)

app.include_router(dictionary_router, prefix="/api/v1")
app.include_router(word_lists_router, prefix="/api/v1")


@app.get("/")
async def read_root():
    return {"message": "Hello, world!"}
