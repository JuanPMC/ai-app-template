import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml.audio_converter import AudioConversionError
from app.models.word import Word
from app.services.evaluation_service import evaluate_pronunciation


@pytest.fixture
def mock_model():
    model = MagicMock()
    model.predict.return_value = ["θ", "ɪ", "ŋ", "k"]
    return model


async def test_correct_pronunciation(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    result = await evaluate_pronunciation(b"audio", word.id, db_session, mock_model)

    assert result.all_correct is True
    assert all(r.correct for r in result.results)
    assert all(r.hint is None for r in result.results)


async def test_substitution_error(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    mock_model.predict.return_value = ["f", "ɪ", "ŋ", "k"]

    result = await evaluate_pronunciation(b"audio", word.id, db_session, mock_model)

    assert result.all_correct is False
    assert result.results[0].correct is False
    assert result.results[0].phoneme == "θ"
    assert result.results[0].hint is not None  # θ_f is in ERROR_MAP
    assert all(r.correct for r in result.results[1:])


async def test_deletion_error(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    mock_model.predict.return_value = ["θ", "ɪ"]  # missing ŋ and k

    result = await evaluate_pronunciation(b"audio", word.id, db_session, mock_model)

    assert result.all_correct is False
    assert len(result.results) == 4
    assert result.results[2].correct is False
    assert result.results[2].hint is None
    assert result.results[3].correct is False


async def test_insertion_ignored(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    mock_model.predict.return_value = ["θ", "ɪ", "ŋ", "k", "s", "t"]  # extra phonemes

    result = await evaluate_pronunciation(b"audio", word.id, db_session, mock_model)

    assert len(result.results) == 4
    assert result.all_correct is True


async def test_word_not_found(db_session: AsyncSession, mock_model):
    with pytest.raises(HTTPException) as exc_info:
        await evaluate_pronunciation(b"audio", 9999, db_session, mock_model)
    assert exc_info.value.status_code == 404


async def test_audio_processing_failure(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    mock_model.predict.side_effect = ValueError("corrupt audio")

    with pytest.raises(HTTPException) as exc_info:
        await evaluate_pronunciation(b"bad", word.id, db_session, mock_model)
    assert exc_info.value.status_code == 422


async def test_audio_conversion_failure_returns_422(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    mock_model.predict.side_effect = AudioConversionError("bad format")

    with pytest.raises(HTTPException) as exc_info:
        await evaluate_pronunciation(b"bad", word.id, db_session, mock_model)
    assert exc_info.value.status_code == 422
    assert "Audio processing failed" in exc_info.value.detail


async def test_error_map_miss(db_session: AsyncSession, mock_model):
    word = Word(text="Think", ipa=["θ", "ɪ", "ŋ", "k"])
    db_session.add(word)
    await db_session.commit()
    await db_session.refresh(word)

    # "z" substitution for "θ" has no ERROR_MAP entry
    mock_model.predict.return_value = ["z", "ɪ", "ŋ", "k"]

    result = await evaluate_pronunciation(b"audio", word.id, db_session, mock_model)

    assert result.results[0].correct is False
    assert result.results[0].hint is None
