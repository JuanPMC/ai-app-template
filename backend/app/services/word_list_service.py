from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.word import Word
from app.models.word_list import WordList, WordListItem
from app.schemas.word_list import WordListResponse


async def create_word_list(
    name: str, word_ids: list[int], db: AsyncSession
) -> WordListResponse:
    result = await db.execute(select(Word.id).where(Word.id.in_(word_ids)))
    found_ids = set(result.scalars().all())
    missing = set(word_ids) - found_ids
    if missing:
        raise HTTPException(
            status_code=404, detail=f"Words not found: {sorted(missing)}"
        )

    word_list = WordList(name=name)
    db.add(word_list)
    await db.flush()

    for word_id in word_ids:
        db.add(WordListItem(list_id=word_list.id, word_id=word_id))

    await db.commit()

    result = await db.execute(
        select(WordList).where(WordList.id == word_list.id).options(selectinload(WordList.items))
    )
    word_list = result.scalar_one()

    return WordListResponse(
        id=word_list.id,
        name=word_list.name,
        word_ids=[item.word_id for item in word_list.items],
    )


async def get_all_word_lists(db: AsyncSession) -> list[WordListResponse]:
    result = await db.execute(
        select(WordList).options(selectinload(WordList.items))
    )
    word_lists = result.scalars().all()
    return [
        WordListResponse(
            id=wl.id,
            name=wl.name,
            word_ids=[item.word_id for item in wl.items],
        )
        for wl in word_lists
    ]


async def get_word_list_by_id(list_id: int, db: AsyncSession) -> WordListResponse:
    result = await db.execute(
        select(WordList)
        .where(WordList.id == list_id)
        .options(selectinload(WordList.items))
    )
    word_list = result.scalar_one_or_none()
    if word_list is None:
        raise HTTPException(status_code=404, detail=f"Word list {list_id} not found")
    return WordListResponse(
        id=word_list.id,
        name=word_list.name,
        word_ids=[item.word_id for item in word_list.items],
    )


async def delete_word_list(list_id: int, db: AsyncSession) -> None:
    result = await db.execute(
        select(WordList)
        .where(WordList.id == list_id)
        .options(selectinload(WordList.items))
    )
    word_list = result.scalar_one_or_none()
    if word_list is None:
        raise HTTPException(status_code=404, detail=f"Word list {list_id} not found")
    await db.delete(word_list)
    await db.commit()
