"""CRUD for .feature files within an entity folder."""

from __future__ import annotations

import re

from fastapi import HTTPException
from github import GithubException

from app.core.github_client import GitHubClient
from app.gherkin.parser import ParsedFeature, ParsedScenario, parse_feature
from app.gherkin.serializer import serialize_feature
from app.schemas.feature import FeatureBrief, FeatureCreate, FeatureResponse, FeatureUpdate
from app.schemas.story import GherkinStep, StoryResponse


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


def _feature_path(initiative_slug: str, entity_slug: str, feature_slug: str) -> str:
    return f"{initiative_slug}/{entity_slug}/{feature_slug}.feature"


def _to_story_response(index: int, scenario: ParsedScenario) -> StoryResponse:
    return StoryResponse(
        index=index,
        title=scenario.title,
        status=scenario.tags.get("status", "draft"),
        steps=[GherkinStep(keyword=s.keyword, text=s.text) for s in scenario.steps],
    )


def _to_feature_response(
    slug: str, initiative_slug: str, entity_slug: str, parsed: ParsedFeature
) -> FeatureResponse:
    stories = [_to_story_response(i, s) for i, s in enumerate(parsed.scenarios)]
    return FeatureResponse(
        slug=slug,
        initiative_slug=initiative_slug,
        entity_slug=entity_slug,
        title=parsed.title,
        description=parsed.description,
        status=parsed.tags.get("status", "draft"),
        entry=parsed.tags.get("entry"),
        usecase=parsed.tags.get("usecase"),
        initiative_tag=parsed.tags.get("initiative"),
        integration=parsed.tags.get("integration"),
        stories=stories,
    )


def list_features(
    initiative_slug: str, entity_slug: str, client: GitHubClient
) -> list[FeatureBrief]:
    path = f"{initiative_slug}/{entity_slug}"
    contents = client.list_contents(path)
    features: list[FeatureBrief] = []
    for item in contents:
        if item.type != "file" or not item.name.endswith(".feature"):
            continue
        slug = item.name.removesuffix(".feature")
        try:
            content, _sha = client.get_file_content(f"{path}/{item.name}")
            parsed = parse_feature(content)
            features.append(
                FeatureBrief(
                    slug=slug,
                    title=parsed.title,
                    status=parsed.tags.get("status", "draft"),
                    story_count=len(parsed.scenarios),
                    entry=parsed.tags.get("entry"),
                    usecase=parsed.tags.get("usecase"),
                )
            )
        except Exception:
            features.append(FeatureBrief(slug=slug, title=slug, status="draft", story_count=0))
    return features


def get_feature(
    initiative_slug: str, entity_slug: str, feature_slug: str, client: GitHubClient
) -> FeatureResponse:
    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    try:
        content, _sha = client.get_file_content(path)
    except GithubException as exc:
        if exc.status == 404:
            raise HTTPException(status_code=404, detail=f"Feature '{feature_slug}' not found")
        raise
    parsed = parse_feature(content)
    return _to_feature_response(feature_slug, initiative_slug, entity_slug, parsed)


def create_feature(
    initiative_slug: str,
    entity_slug: str,
    data: FeatureCreate,
    client: GitHubClient,
) -> FeatureResponse:
    slug = _slugify(data.title)
    path = _feature_path(initiative_slug, entity_slug, slug)

    tags: dict[str, str] = {"status": data.status}
    if data.entry:
        tags["entry"] = data.entry
    if data.usecase:
        tags["usecase"] = data.usecase
    if data.initiative_tag:
        tags["initiative"] = data.initiative_tag
    if data.integration:
        tags["integration"] = data.integration

    parsed = ParsedFeature(
        tags=tags,
        title=data.title,
        description=data.description,
        scenarios=[],
    )
    content = serialize_feature(parsed)
    client.create_file(path, content, f"feat: create feature {slug}")
    return _to_feature_response(slug, initiative_slug, entity_slug, parsed)


def update_feature(
    initiative_slug: str,
    entity_slug: str,
    feature_slug: str,
    data: FeatureUpdate,
    client: GitHubClient,
) -> FeatureResponse:
    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    try:
        content, sha = client.get_file_content(path)
    except GithubException as exc:
        if exc.status == 404:
            raise HTTPException(status_code=404, detail=f"Feature '{feature_slug}' not found")
        raise

    parsed = parse_feature(content)

    if data.title is not None:
        parsed.title = data.title
    if data.description is not None:
        parsed.description = data.description
    if data.status is not None:
        parsed.tags["status"] = data.status
    if data.entry is not None:
        parsed.tags["entry"] = data.entry
    if data.usecase is not None:
        parsed.tags["usecase"] = data.usecase
    if data.initiative_tag is not None:
        parsed.tags["initiative"] = data.initiative_tag
    if data.integration is not None:
        parsed.tags["integration"] = data.integration

    new_content = serialize_feature(parsed)
    client.update_file(path, new_content, sha, f"update: modify {feature_slug}.feature")
    return _to_feature_response(feature_slug, initiative_slug, entity_slug, parsed)


def delete_feature(
    initiative_slug: str,
    entity_slug: str,
    feature_slug: str,
    client: GitHubClient,
) -> None:
    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    try:
        _content, sha = client.get_file_content(path)
    except GithubException as exc:
        if exc.status == 404:
            raise HTTPException(status_code=404, detail=f"Feature '{feature_slug}' not found")
        raise
    client.delete_file(path, sha, f"delete: remove {feature_slug}.feature")
