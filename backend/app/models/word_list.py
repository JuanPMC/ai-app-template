from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class WordList(Base):
    __tablename__ = "word_lists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)

    items: Mapped[list["WordListItem"]] = relationship(
        "WordListItem", cascade="all, delete-orphan", back_populates="word_list"
    )


class WordListItem(Base):
    __tablename__ = "word_list_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    list_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("word_lists.id"), nullable=False
    )
    word_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("words.id"), nullable=False
    )

    word_list: Mapped["WordList"] = relationship("WordList", back_populates="items")
