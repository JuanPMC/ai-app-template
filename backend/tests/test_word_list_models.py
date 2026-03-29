from sqlalchemy import ForeignKey

from app.models.word_list import WordList, WordListItem


def test_word_list_has_required_columns():
    columns = WordList.__table__.columns.keys()
    assert "id" in columns
    assert "name" in columns


def test_word_list_item_has_required_columns():
    columns = WordListItem.__table__.columns.keys()
    assert "list_id" in columns
    assert "word_id" in columns


def test_word_list_item_list_id_is_foreign_key():
    list_id_col = WordListItem.__table__.c["list_id"]
    fk_targets = {fk.target_fullname for fk in list_id_col.foreign_keys}
    assert "word_lists.id" in fk_targets


def test_word_list_item_word_id_is_foreign_key():
    word_id_col = WordListItem.__table__.c["word_id"]
    fk_targets = {fk.target_fullname for fk in word_id_col.foreign_keys}
    assert "words.id" in fk_targets
