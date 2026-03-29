import pytest
from pydantic import ValidationError

from app.schemas.word_list import WordListCreate, WordListResponse


def test_word_list_create_valid():
    obj = WordListCreate(name="Th-Sounds", word_ids=[1, 2, 3])
    assert obj.name == "Th-Sounds"
    assert obj.word_ids == [1, 2, 3]


def test_word_list_create_requires_word_ids():
    with pytest.raises(ValidationError):
        WordListCreate(name="Th-Sounds")


def test_word_list_create_word_ids_must_be_list_of_integers():
    with pytest.raises(ValidationError):
        WordListCreate(name="Th-Sounds", word_ids="not-a-list")


def test_word_list_response_valid():
    obj = WordListResponse(id=1, name="Th-Sounds", word_ids=[1, 2, 3])
    assert obj.id == 1
    assert obj.name == "Th-Sounds"
    assert obj.word_ids == [1, 2, 3]


def test_word_list_response_requires_word_ids():
    with pytest.raises(ValidationError):
        WordListResponse(id=1, name="Th-Sounds")
