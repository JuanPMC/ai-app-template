"""Build the full 4-level hierarchy for sidebar navigation."""

from __future__ import annotations

from app.core.github_client import GitHubClient
from app.gherkin.parser import parse_feature
from app.schemas.tree import EntityTree, FeatureTree, InitiativeTree, StoryBrief


def get_tree(client: GitHubClient) -> list[InitiativeTree]:
    initiatives: list[InitiativeTree] = []

    top_level = client.list_contents("")
    for initiative_item in top_level:
        if initiative_item.type != "dir":
            continue
        i_slug = initiative_item.name

        entities: list[EntityTree] = []
        entity_items = client.list_contents(i_slug)
        for entity_item in entity_items:
            if entity_item.type != "dir":
                continue
            e_slug = entity_item.name

            features: list[FeatureTree] = []
            feature_items = client.list_contents(f"{i_slug}/{e_slug}")
            for feature_item in feature_items:
                if feature_item.type != "file" or not feature_item.name.endswith(".feature"):
                    continue
                f_slug = feature_item.name.removesuffix(".feature")

                try:
                    content, _sha = client.get_file_content(f"{i_slug}/{e_slug}/{feature_item.name}")
                    parsed = parse_feature(content)
                    stories = [
                        StoryBrief(
                            index=idx,
                            title=sc.title,
                            status=sc.tags.get("status", "draft"),
                        )
                        for idx, sc in enumerate(parsed.scenarios)
                    ]
                    features.append(
                        FeatureTree(
                            slug=f_slug,
                            title=parsed.title,
                            status=parsed.tags.get("status", "draft"),
                            entry=parsed.tags.get("entry"),
                            usecase=parsed.tags.get("usecase"),
                            story_count=len(parsed.scenarios),
                            stories=stories,
                        )
                    )
                except Exception:
                    features.append(
                        FeatureTree(
                            slug=f_slug,
                            title=f_slug,
                            status="draft",
                            story_count=0,
                            stories=[],
                        )
                    )

            entities.append(
                EntityTree(
                    slug=e_slug,
                    name=e_slug.replace("-", " ").title(),
                    feature_count=len(features),
                    features=features,
                )
            )

        initiatives.append(
            InitiativeTree(
                slug=i_slug,
                name=i_slug.replace("-", " ").title(),
                entity_count=len(entities),
                entities=entities,
            )
        )

    return initiatives
