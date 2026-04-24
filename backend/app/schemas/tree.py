from pydantic import BaseModel


class StoryBrief(BaseModel):
    index: int
    title: str
    status: str


class FeatureTree(BaseModel):
    slug: str
    title: str
    status: str
    entry: str | None = None
    usecase: str | None = None
    story_count: int
    stories: list[StoryBrief]


class EntityTree(BaseModel):
    slug: str
    name: str
    feature_count: int
    features: list[FeatureTree]


class InitiativeTree(BaseModel):
    slug: str
    name: str
    entity_count: int
    entities: list[EntityTree]
