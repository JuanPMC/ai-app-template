"""Serialize domain objects back to Gherkin .feature file content."""

from __future__ import annotations

from app.gherkin.parser import ParsedFeature, ParsedScenario, ParsedStep


# Tags that use colon separator (@entry:bos.clients)
_COLON_TAGS = {"entry", "usecase", "initiative", "integration"}


def serialize_tags(metadata: dict[str, str]) -> str:
    """Convert ``{'status': 'active', 'entry': 'bos.clients'}`` → ``@status-active @entry:bos.clients``."""
    parts: list[str] = []
    for key, value in metadata.items():
        if key in _COLON_TAGS:
            parts.append(f"@{key}:{value}")
        else:
            parts.append(f"@{key}-{value}")
    return " ".join(parts)


def serialize_step(step: ParsedStep) -> str:
    return f"    {step.keyword} {step.text}"


def serialize_scenario(scenario: ParsedScenario) -> str:
    lines: list[str] = []
    tag_str = serialize_tags(scenario.tags)
    if tag_str:
        lines.append(f"  {tag_str}")
    lines.append(f"  Scenario: {scenario.title}")
    for step in scenario.steps:
        lines.append(serialize_step(step))
    return "\n".join(lines)


def serialize_feature(feature: ParsedFeature) -> str:
    """Produce a complete ``.feature`` file string."""
    lines: list[str] = []

    tag_str = serialize_tags(feature.tags)
    if tag_str:
        lines.append(tag_str)

    lines.append(f"Feature: {feature.title}")

    if feature.description:
        for desc_line in feature.description.splitlines():
            lines.append(f"  {desc_line}" if desc_line else "")

    for scenario in feature.scenarios:
        lines.append("")  # blank line before each scenario
        lines.append(serialize_scenario(scenario))

    # Ensure trailing newline
    return "\n".join(lines) + "\n"
