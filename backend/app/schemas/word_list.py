from pydantic import BaseModel


class WordListCreate(BaseModel):
    name: str
    word_ids: list[int]


class WordListResponse(BaseModel):
    id: int
    name: str
    word_ids: list[int]

    model_config = {"from_attributes": True}
