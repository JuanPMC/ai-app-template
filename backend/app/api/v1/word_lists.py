from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.schemas.word_list import WordListCreate, WordListResponse
from app.services.word_list_service import (
    create_word_list,
    delete_word_list,
    get_all_word_lists,
    get_word_list_by_id,
)

router = APIRouter(prefix="/word-lists", tags=["word-lists"])

DbSession = Annotated[AsyncSession, Depends(get_session)]


@router.post("", response_model=WordListResponse, status_code=201)
async def create_word_list_endpoint(payload: WordListCreate, db: DbSession):
    return await create_word_list(payload.name, payload.word_ids, db)


@router.get("", response_model=list[WordListResponse])
async def list_word_lists(db: DbSession):
    return await get_all_word_lists(db)


@router.get("/{list_id}", response_model=WordListResponse)
async def get_word_list(list_id: int, db: DbSession):
    return await get_word_list_by_id(list_id, db)


@router.delete("/{list_id}", status_code=204)
async def delete_word_list_endpoint(list_id: int, db: DbSession):
    await delete_word_list(list_id, db)
