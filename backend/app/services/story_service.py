"""CRUD for Scenario blocks within a .feature file."""

from __future__ import annotations

from fastapi import HTTPException
from github import GithubException

from app.core.github_client import GitHubClient
from app.gherkin.parser import ParsedScenario, ParsedStep, parse_feature
from app.gherkin.serializer import serialize_feature
from app.schemas.story import GherkinStep, StoryCreate, StoryResponse, StoryUpdate


def _feature_path(initiative_slug: str, entity_slug: str, feature_slug: str) -> str:
    return f"{initiative_slug}/{entity_slug}/{feature_slug}.feature"


def _to_response(index: int, scenario: ParsedScenario) -> StoryResponse:
    return StoryResponse(
        index=index,
        title=scenario.title,
        status=scenario.tags.get("status", "draft"),
        steps=[GherkinStep(keyword=s.keyword, text=s.text) for s in scenario.steps],
    )


def _read_and_parse(
    initiative_slug: str, entity_slug: str, feature_slug: str, client: GitHubClient
) -> tuple[str, str, list]:
    """Return (raw_content, sha, parsed_feature) or raise 404."""
    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    try:
        content, sha = client.get_file_content(path)
    except GithubException as exc:
        if exc.status == 404:
            raise HTTPException(status_code=404, detail=f"Feature '{feature_slug}' not found")
        raise
    parsed = parse_feature(content)
    return content, sha, parsed


def list_stories(
    initiative_slug: str,
    entity_slug: str,
    feature_slug: str,
    client: GitHubClient,
) -> list[StoryResponse]:
    _content, _sha, parsed = _read_and_parse(initiative_slug, entity_slug, feature_slug, client)
    return [_to_response(i, s) for i, s in enumerate(parsed.scenarios)]


def create_story(
    initiative_slug: str,
    entity_slug: str,
    feature_slug: str,
    data: StoryCreate,
    client: GitHubClient,
) -> StoryResponse:
    _content, sha, parsed = _read_and_parse(initiative_slug, entity_slug, feature_slug, client)

    new_scenario = ParsedScenario(
        tags={"status": data.status},
        title=data.title,
        steps=[ParsedStep(keyword=s.keyword, text=s.text) for s in data.steps],
    )
    parsed.scenarios.append(new_scenario)
    new_index = len(parsed.scenarios) - 1

    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    new_content = serialize_feature(parsed)
    client.update_file(path, new_content, sha, f"feat: add scenario to {feature_slug}.feature")

    return _to_response(new_index, new_scenario)


def update_story(
    initiative_slug: str,
    entity_slug: str,
    feature_slug: str,
    story_index: int,
    data: StoryUpdate,
    client: GitHubClient,
) -> StoryResponse:
    _content, sha, parsed = _read_and_parse(initiative_slug, entity_slug, feature_slug, client)

    if story_index < 0 or story_index >= len(parsed.scenarios):
        raise HTTPException(status_code=404, detail=f"Story index {story_index} out of bounds")

    scenario = parsed.scenarios[story_index]
    if data.title is not None:
        scenario.title = data.title
    if data.status is not None:
        scenario.tags["status"] = data.status
    if data.steps is not None:
        scenario.steps = [ParsedStep(keyword=s.keyword, text=s.text) for s in data.steps]

    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    new_content = serialize_feature(parsed)
    client.update_file(path, new_content, sha, f"update: modify scenario in {feature_slug}.feature")

    return _to_response(story_index, scenario)


def delete_story(
    initiative_slug: str,
    entity_slug: str,
    feature_slug: str,
    story_index: int,
    client: GitHubClient,
) -> None:
    _content, sha, parsed = _read_and_parse(initiative_slug, entity_slug, feature_slug, client)

    if story_index < 0 or story_index >= len(parsed.scenarios):
        raise HTTPException(status_code=404, detail=f"Story index {story_index} out of bounds")

    parsed.scenarios.pop(story_index)

    path = _feature_path(initiative_slug, entity_slug, feature_slug)
    new_content = serialize_feature(parsed)
    client.update_file(
        path, new_content, sha, f"delete: remove scenario from {feature_slug}.feature"
    )
