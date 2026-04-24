from __future__ import annotations

from pydantic import BaseModel

from app.schemas.story import StoryResponse


class FeatureCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "draft"
    entry: str | None = None
    usecase: str | None = None
    initiative_tag: str | None = None
    integration: str | None = None


class FeatureUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    entry: str | None = None
    usecase: str | None = None
    initiative_tag: str | None = None
    integration: str | None = None


class FeatureBrief(BaseModel):
    slug: str
    title: str
    status: str
    story_count: int
    entry: str | None = None
    usecase: str | None = None


class FeatureResponse(BaseModel):
    slug: str
    initiative_slug: str
    entity_slug: str
    title: str
    description: str
    status: str
    entry: str | None = None
    usecase: str | None = None
    initiative_tag: str | None = None
    integration: str | None = None
    stories: list[StoryResponse]
