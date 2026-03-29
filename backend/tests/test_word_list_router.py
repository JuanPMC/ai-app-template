from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.word import Word


async def test_create_word_list_returns_201(
    async_client: AsyncClient, db_session: AsyncSession
):
    word1 = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    word2 = Word(text="The", ipa=["ð", "ə"])
    db_session.add_all([word1, word2])
    await db_session.commit()
    await db_session.refresh(word1)
    await db_session.refresh(word2)

    response = await async_client.post(
        "/api/v1/word-lists",
        json={"name": "Th-Sounds", "word_ids": [word1.id, word2.id]},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Th-Sounds"
    assert set(data["word_ids"]) == {word1.id, word2.id}


async def test_get_word_list_by_id_returns_200(
    async_client: AsyncClient, db_session: AsyncSession
):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    create_response = await async_client.post(
        "/api/v1/word-lists",
        json={"name": "Th-Sounds", "word_ids": [word.id]},
    )
    list_id = create_response.json()["id"]

    response = await async_client.get(f"/api/v1/word-lists/{list_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == list_id
    assert data["name"] == "Th-Sounds"
    assert data["word_ids"] == [word.id]


async def test_get_word_list_by_id_returns_404_for_unknown_id(async_client: AsyncClient):
    response = await async_client.get("/api/v1/word-lists/9999")
    assert response.status_code == 404


async def test_get_all_word_lists_returns_empty_list_when_none_exist(
    async_client: AsyncClient,
):
    response = await async_client.get("/api/v1/word-lists")
    assert response.status_code == 200
    assert response.json() == []


async def test_delete_word_list_returns_204(
    async_client: AsyncClient, db_session: AsyncSession
):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    create_response = await async_client.post(
        "/api/v1/word-lists",
        json={"name": "Th-Sounds", "word_ids": [word.id]},
    )
    list_id = create_response.json()["id"]

    response = await async_client.delete(f"/api/v1/word-lists/{list_id}")
    assert response.status_code == 204

    get_response = await async_client.get(f"/api/v1/word-lists/{list_id}")
    assert get_response.status_code == 404


async def test_delete_word_list_returns_404_for_unknown_id(async_client: AsyncClient):
    response = await async_client.delete("/api/v1/word-lists/9999")
    assert response.status_code == 404
