from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine

from app.api.v1.dictionary import router as dictionary_router
from app.api.v1.evaluation import get_phoneme_model
from app.api.v1.evaluation import router as evaluation_router
from app.ml.phoneme_model import load_phoneme_model
from app.api.v1.word_lists import router as word_lists_router
from app.core.config import get_settings
from app.models.base import Base
import app.models.word  # noqa: F401
import app.models.word_list  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    model = load_phoneme_model()
    app.dependency_overrides[get_phoneme_model] = lambda: model
    yield
    app.dependency_overrides.clear()
    engine = create_async_engine(get_settings().database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173","http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dictionary_router, prefix="/api/v1")
app.include_router(evaluation_router, prefix="/api/v1")
app.include_router(word_lists_router, prefix="/api/v1")


@app.get("/")
async def read_root():
    return {"message": "Hello, world!"}
