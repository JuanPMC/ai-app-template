import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.word import Word
from app.models.word_list import WordListItem
from app.schemas.word_list import WordListResponse
from app.services.word_list_service import (
    create_word_list,
    delete_word_list,
    get_all_word_lists,
)


async def test_create_word_list_succeeds_with_valid_word_ids(db_session: AsyncSession):
    word1 = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    word2 = Word(text="The", ipa=["ð", "ə"])
    db_session.add_all([word1, word2])
    await db_session.commit()
    await db_session.refresh(word1)
    await db_session.refresh(word2)

    result = await create_word_list("Th-Sounds", [word1.id, word2.id], db_session)

    assert isinstance(result, WordListResponse)
    assert result.name == "Th-Sounds"
    assert set(result.word_ids) == {word1.id, word2.id}


async def test_create_word_list_raises_404_for_invalid_word_id(db_session: AsyncSession):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    with pytest.raises(HTTPException) as exc_info:
        await create_word_list("Bad List", [word.id, 9999], db_session)
    assert exc_info.value.status_code == 404


async def test_get_all_word_lists_returns_list_of_responses(db_session: AsyncSession):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    await create_word_list("List A", [word.id], db_session)
    await create_word_list("List B", [word.id], db_session)

    result = await get_all_word_lists(db_session)

    assert len(result) == 2
    assert all(isinstance(wl, WordListResponse) for wl in result)


async def test_delete_word_list_cascades_to_items(db_session: AsyncSession):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    created = await create_word_list("To Delete", [word.id], db_session)

    await delete_word_list(created.id, db_session)

    items = await db_session.execute(
        select(WordListItem).where(WordListItem.list_id == created.id)
    )
    assert items.scalars().all() == []
