"""Parse Gherkin .feature file content into domain objects."""

from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class ParsedStep:
    keyword: str  # Given, When, Then, And, But
    text: str


@dataclass
class ParsedScenario:
    tags: dict[str, str]
    title: str
    steps: list[ParsedStep] = field(default_factory=list)
    raw_tags: list[str] = field(default_factory=list)


@dataclass
class ParsedFeature:
    tags: dict[str, str]
    title: str
    description: str
    scenarios: list[ParsedScenario] = field(default_factory=list)
    raw_tags: list[str] = field(default_factory=list)


# Recognised tag prefixes → metadata key
_TAG_PREFIXES = ("status", "priority", "points")

_STEP_KEYWORDS = {"Given", "When", "Then", "And", "But"}
_TAG_RE = re.compile(r"@([\w-]+)")


def extract_tags(raw_tags: list[str]) -> dict[str, str]:
    """Convert ``['@status-active', '@priority-high']`` → ``{'status': 'active', 'priority': 'high'}``."""
    result: dict[str, str] = {}
    for tag in raw_tags:
        tag = tag.lstrip("@")
        for prefix in _TAG_PREFIXES:
            if tag.startswith(f"{prefix}-"):
                value = tag[len(prefix) + 1 :]
                result[prefix] = value
                break
    return result


def parse_feature(content: str) -> ParsedFeature:
    """Parse a ``.feature`` file string into a :class:`ParsedFeature`."""
    lines = content.splitlines()

    feature_tags: list[str] = []
    feature_title = ""
    feature_desc_lines: list[str] = []
    scenarios: list[ParsedScenario] = []

    # Parser state
    in_feature_desc = False
    current_scenario: ParsedScenario | None = None
    pending_tags: list[str] = []

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        # Blank line
        if not stripped:
            if in_feature_desc:
                feature_desc_lines.append("")
            continue

        # Comment
        if stripped.startswith("#"):
            continue

        # Tags
        if stripped.startswith("@"):
            tags_on_line = _TAG_RE.findall(stripped)
            pending_tags.extend(f"@{t}" for t in tags_on_line)
            continue

        # Feature keyword
        if stripped.startswith("Feature:"):
            feature_title = stripped[len("Feature:") :].strip()
            feature_tags = pending_tags[:]
            pending_tags = []
            in_feature_desc = True
            continue

        # Scenario keyword
        if stripped.startswith("Scenario:") or stripped.startswith("Scenario Outline:"):
            # Finish previous scenario
            if current_scenario is not None:
                scenarios.append(current_scenario)
            in_feature_desc = False

            keyword = "Scenario Outline:" if stripped.startswith("Scenario Outline:") else "Scenario:"
            title = stripped[len(keyword) :].strip()
            current_scenario = ParsedScenario(
                tags=extract_tags(pending_tags),
                title=title,
                raw_tags=pending_tags[:],
            )
            pending_tags = []
            continue

        # Step keywords
        first_word = stripped.split(None, 1)[0] if stripped else ""
        if first_word in _STEP_KEYWORDS and current_scenario is not None:
            step_text = stripped[len(first_word) :].strip()
            current_scenario.steps.append(ParsedStep(keyword=first_word, text=step_text))
            continue

        # Description lines (under Feature before first Scenario)
        if in_feature_desc:
            feature_desc_lines.append(stripped)
            continue

    # Flush last scenario
    if current_scenario is not None:
        scenarios.append(current_scenario)

    description = "\n".join(feature_desc_lines).strip()

    return ParsedFeature(
        tags=extract_tags(feature_tags),
        title=feature_title,
        description=description,
        scenarios=scenarios,
        raw_tags=feature_tags,
    )
