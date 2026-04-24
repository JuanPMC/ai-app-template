# Implementation Plan: Product Initiative Manager

## Overview

Transform the existing template (Item/Word CRUD with SQLite) into a GitHub-synced Gherkin feature file manager with a 4-level hierarchy: **Initiatives → Entities → Features → User Stories**.

PRD: `docs/specs.md`

---

## Phase 1: Backend Core Infrastructure

### Task 1 — Update backend dependencies
- **Depends on:** none
- **Context:** Replace SQLAlchemy/aiosqlite with GitHub API and Gherkin deps in `backend/pyproject.toml`
- [ ] 1.1 — Remove `sqlalchemy[asyncio]` and `aiosqlite` from `[tool.poetry.dependencies]`
- [ ] 1.2 — Add `PyGithub >= 2.0` to dependencies
- [ ] 1.3 — Add `gherkin-official >= 29.0` to dependencies (Python Gherkin parser from Cucumber)
- [ ] 1.4 — Keep `fastapi`, `uvicorn`, `pydantic-settings`, `python-multipart`, `httpx` as-is
- [ ] 1.5 — Verify `pytest`, `pytest-asyncio`, `httpx` remain in `[tool.poetry.group.test.dependencies]`

### Task 2 — Update backend config (`backend/app/core/config.py`)
- **Depends on:** 1
- **Context:** Current config has only `database_url`. Replace with GitHub settings. Uses `pydantic-settings` with `APP_` env prefix.
- [ ] 2.1 — Remove `database_url` field from `Settings` class
- [ ] 2.2 — Add `github_token: str` (required, no default)
- [ ] 2.3 — Add `github_repo: str` (required, format: `owner/repo`)
- [ ] 2.4 — Add `github_branch: str = "main"`
- [ ] 2.5 — Add `features_base_path: str = "initiatives/"`

### Task 3 — Create GitHub client (`backend/app/core/github_client.py`)
- **Depends on:** 2
- **Context:** Replaces `database.py`. Wraps PyGithub with async-friendly methods. Injected via `Depends(get_github_client)` like the old `get_session()`.
- [ ] 3.1 — Create `GitHubClient` class that takes `Settings` and initializes a PyGithub `Github` instance with the token
- [ ] 3.2 — Store `repo`, `branch`, and `base_path` as instance attributes
- [ ] 3.3 — Implement `list_contents(path: str) -> list[ContentFile]` — lists files/dirs at a path in the repo
- [ ] 3.4 — Implement `get_file_content(path: str) -> tuple[str, str]` — returns `(decoded_content, sha)`
- [ ] 3.5 — Implement `create_file(path: str, content: str, message: str) -> None` — creates file with commit
- [ ] 3.6 — Implement `update_file(path: str, content: str, sha: str, message: str) -> None` — updates file using SHA
- [ ] 3.7 — Implement `delete_file(path: str, sha: str, message: str) -> None` — deletes file
- [ ] 3.8 — Implement `delete_folder(path: str, message: str) -> None` — recursively deletes all files in a folder
- [ ] 3.9 — Implement `create_folder(path: str, message: str) -> None` — creates a `.gitkeep` file to establish folder
- [ ] 3.10 — Create `get_github_client()` dependency function (uses `get_settings()` to construct the client)

### Task 4 — Create Gherkin parser (`backend/app/gherkin/parser.py`)
- **Depends on:** 1
- **Context:** Parses `.feature` file content strings into Python domain objects. Uses `gherkin-official` or regex-based custom parser. Must extract tags, Feature title/description, Scenario blocks with steps.
- [ ] 4.1 — Define internal data classes: `ParsedFeature(tags, title, description, scenarios)`, `ParsedScenario(tags, title, steps)`, `ParsedStep(keyword, text)`
- [ ] 4.2 — Implement `parse_feature(content: str) -> ParsedFeature` — parses a full `.feature` file string
- [ ] 4.3 — Implement `extract_tags(tag_list: list[str]) -> dict` — converts `["@status-active", "@priority-high"]` to `{"status": "active", "priority": "high"}`
- [ ] 4.4 — Handle edge cases: empty files, features with no scenarios, scenarios with no steps, unknown tags (preserve but don't parse)

### Task 5 — Create Gherkin serializer (`backend/app/gherkin/serializer.py`)
- **Depends on:** 4
- **Context:** Converts domain objects back to `.feature` file content strings. Must produce valid Gherkin that round-trips through the parser.
- [ ] 5.1 — Implement `serialize_feature(feature: ParsedFeature) -> str` — full `.feature` file string
- [ ] 5.2 — Implement `serialize_tags(metadata: dict) -> str` — converts `{"status": "active", "priority": "high"}` to `@status-active @priority-high`
- [ ] 5.3 — Implement `serialize_scenario(scenario: ParsedScenario) -> str` — single Scenario block
- [ ] 5.4 — Ensure proper indentation (2 spaces for scenarios, 4 for steps) and blank lines between scenarios

### Task 6 — Unit tests for Gherkin parser and serializer
- **Depends on:** 4, 5
- **Context:** Create `backend/tests/test_gherkin_parser.py` and sample fixtures in `backend/tests/fixtures/`. These are unit tests — no HTTP, no mocking needed.
- [ ] 6.1 — Create `backend/tests/fixtures/sample_login.feature` with multiple scenarios and tags (use the example from the PRD)
- [ ] 6.2 — Create `backend/tests/fixtures/sample_empty.feature` with only a Feature line and no scenarios
- [ ] 6.3 — Test `parse_feature()` correctly extracts feature title, description, tags, and all scenarios
- [ ] 6.4 — Test `extract_tags()` handles all recognized tag categories (status, priority, points) and ignores unknown tags
- [ ] 6.5 — Test `serialize_feature()` produces valid Gherkin content
- [ ] 6.6 — Test round-trip: `parse_feature(serialize_feature(parsed))` returns equivalent data

---

## Phase 2: Backend Schemas

### Task 7 — Create Initiative schemas (`backend/app/schemas/initiative.py`)
- **Depends on:** none (schemas are standalone Pydantic models)
- **Context:** Initiatives are folders — no Gherkin tags. Schemas are simple name/slug wrappers.
- [ ] 7.1 — `InitiativeCreate(name: str)` — name will be slugified for folder name
- [ ] 7.2 — `InitiativeResponse(slug: str, name: str, entity_count: int)`

### Task 8 — Create Entity schemas (`backend/app/schemas/entity.py`)
- **Depends on:** none
- **Context:** Entities are subfolders — same pattern as initiatives.
- [ ] 8.1 — `EntityCreate(name: str)`
- [ ] 8.2 — `EntityResponse(slug: str, initiative_slug: str, name: str, feature_count: int)`

### Task 9 — Create Feature schemas (`backend/app/schemas/feature.py`)
- **Depends on:** none
- **Context:** Features are `.feature` files. Response includes parsed Gherkin metadata.
- [ ] 9.1 — `FeatureCreate(title: str, description: str = "", status: str = "draft", priority: str = "medium")`
- [ ] 9.2 — `FeatureUpdate(title: str | None, description: str | None, status: str | None, priority: str | None)`
- [ ] 9.3 — `FeatureResponse(slug: str, initiative_slug: str, entity_slug: str, title: str, description: str, status: str, priority: str, stories: list[StoryResponse])`
- [ ] 9.4 — Define `Status` and `Priority` as string enums shared across schemas (can go in a `common.py` or inline)

### Task 10 — Create Story schemas (`backend/app/schemas/story.py`)
- **Depends on:** 9 (uses shared Status/Priority enums)
- **Context:** Stories are Scenario blocks. Include Gherkin steps.
- [ ] 10.1 — `GherkinStep(keyword: str, text: str)` — keyword is "Given"/"When"/"Then"/"And"/"But"
- [ ] 10.2 — `StoryCreate(title: str, steps: list[GherkinStep], status: str = "draft", priority: str = "medium", points: int | None = None)`
- [ ] 10.3 — `StoryUpdate(title: str | None, steps: list[GherkinStep] | None, status: str | None, priority: str | None, points: int | None)`
- [ ] 10.4 — `StoryResponse(index: int, title: str, status: str, priority: str, points: int | None, steps: list[GherkinStep])`
- [ ] 10.5 — Validate `points` is one of `{1, 2, 3, 5, 8, 13}` or `None` using a Pydantic validator

### Task 11 — Create Tree schemas (`backend/app/schemas/tree.py`)
- **Depends on:** 7, 8, 9, 10
- **Context:** Nested response type for the tree endpoint that powers the sidebar.
- [ ] 11.1 — `StoryBrief(index: int, title: str, status: str)`
- [ ] 11.2 — `FeatureTree(slug: str, title: str, status: str, priority: str, story_count: int, stories: list[StoryBrief])`
- [ ] 11.3 — `EntityTree(slug: str, name: str, feature_count: int, features: list[FeatureTree])`
- [ ] 11.4 — `InitiativeTree(slug: str, name: str, entity_count: int, entities: list[EntityTree])`

---

## Phase 3: Backend Services

### Task 12 — Create initiative service (`backend/app/services/initiative_service.py`)
- **Depends on:** 3, 7
- **Context:** CRUD for initiative folders via GitHubClient. Lists directories at `{base_path}`, creates/renames/deletes folders.
- [ ] 12.1 — `list_initiatives(client) -> list[InitiativeResponse]` — list dirs at base_path, count entity sub-dirs per initiative
- [ ] 12.2 — `create_initiative(data, client) -> InitiativeResponse` — slugify name, create folder via `.gitkeep`
- [ ] 12.3 — `rename_initiative(slug, new_name, client) -> InitiativeResponse` — rename by creating new folder, moving contents, deleting old folder (GitHub API has no rename — must copy+delete)
- [ ] 12.4 — `delete_initiative(slug, client) -> None` — delete folder recursively, 404 if not found

### Task 13 — Create entity service (`backend/app/services/entity_service.py`)
- **Depends on:** 3, 8
- **Context:** CRUD for entity subfolders within an initiative. Same pattern as initiative service but scoped to `{base_path}/{initiative_slug}/`.
- [ ] 13.1 — `list_entities(initiative_slug, client) -> list[EntityResponse]` — list dirs, count `.feature` files per entity
- [ ] 13.2 — `create_entity(initiative_slug, data, client) -> EntityResponse` — slugify, create folder
- [ ] 13.3 — `rename_entity(initiative_slug, entity_slug, new_name, client) -> EntityResponse` — copy+delete rename
- [ ] 13.4 — `delete_entity(initiative_slug, entity_slug, client) -> None` — recursive delete, 404 if not found

### Task 14 — Create feature service (`backend/app/services/feature_service.py`)
- **Depends on:** 3, 4, 5, 9
- **Context:** CRUD for `.feature` files. Uses Gherkin parser/serializer to convert between file content and domain objects. Must handle SHA for updates.
- [ ] 14.1 — `list_features(initiative_slug, entity_slug, client) -> list[FeatureBrief]` — list `.feature` files in entity dir, parse each to extract title/status/priority/story count
- [ ] 14.2 — `get_feature(initiative_slug, entity_slug, feature_slug, client) -> FeatureResponse` — read file, parse, return full detail including stories
- [ ] 14.3 — `create_feature(initiative_slug, entity_slug, data, client) -> FeatureResponse` — serialize to Gherkin, create file
- [ ] 14.4 — `update_feature(initiative_slug, entity_slug, feature_slug, data, client) -> FeatureResponse` — read current file (get SHA), merge updates, serialize, write back with SHA
- [ ] 14.5 — `delete_feature(initiative_slug, entity_slug, feature_slug, client) -> None` — get file SHA, delete, 404 if not found

### Task 15 — Create story service (`backend/app/services/story_service.py`)
- **Depends on:** 3, 4, 5, 10, 14
- **Context:** CRUD for Scenario blocks within a `.feature` file. Reads the full file, modifies the scenario list, writes back. Uses feature service internally or calls GitHub client directly.
- [ ] 15.1 — `list_stories(initiative_slug, entity_slug, feature_slug, client) -> list[StoryResponse]` — read file, parse, return all scenarios
- [ ] 15.2 — `create_story(initiative_slug, entity_slug, feature_slug, data, client) -> StoryResponse` — read file, append scenario, serialize, write back
- [ ] 15.3 — `update_story(initiative_slug, entity_slug, feature_slug, story_index, data, client) -> StoryResponse` — read file, modify scenario at index, serialize, write back
- [ ] 15.4 — `delete_story(initiative_slug, entity_slug, feature_slug, story_index, client) -> None` — read file, remove scenario at index, serialize, write back
- [ ] 15.5 — Handle index out of bounds with 404

### Task 16 — Create tree service (`backend/app/services/tree_service.py`)
- **Depends on:** 3, 4, 11
- **Context:** Builds the full 4-level hierarchy in a single response. Traverses `initiatives/ → entities/ → features/ → scenarios`. Must minimize GitHub API calls (batch where possible).
- [ ] 16.1 — `get_tree(client) -> list[InitiativeTree]` — recursively list initiatives, entities, features, parse each feature for scenario briefs
- [ ] 16.2 — Consider caching or parallel fetching to keep response time reasonable

---

## Phase 4: Backend Routers

### Task 17 — Create initiatives router (`backend/app/api/v1/initiatives.py`)
- **Depends on:** 3, 12
- **Context:** Replace the old items router pattern. Use `Annotated[GitHubClient, Depends(get_github_client)]` instead of `DbSession`.
- [ ] 17.1 — `GET /` → `list_initiatives` — returns `list[InitiativeResponse]`
- [ ] 17.2 — `POST /` (201) → `create_initiative` — accepts `InitiativeCreate`, returns `InitiativeResponse`
- [ ] 17.3 — `PUT /{slug}` → `rename_initiative` — accepts `InitiativeCreate` (new name), returns `InitiativeResponse`
- [ ] 17.4 — `DELETE /{slug}` (204) → `delete_initiative`

### Task 18 — Create entities router (`backend/app/api/v1/entities.py`)
- **Depends on:** 3, 13
- **Context:** Nested under initiatives: prefix `/initiatives/{initiative_slug}/entities`.
- [ ] 18.1 — `GET /` → `list_entities(initiative_slug)` — returns `list[EntityResponse]`
- [ ] 18.2 — `POST /` (201) → `create_entity(initiative_slug)` — accepts `EntityCreate`
- [ ] 18.3 — `PUT /{entity_slug}` → `rename_entity(initiative_slug, entity_slug)`
- [ ] 18.4 — `DELETE /{entity_slug}` (204) → `delete_entity(initiative_slug, entity_slug)`

### Task 19 — Create features router (`backend/app/api/v1/features.py`)
- **Depends on:** 3, 14
- **Context:** Mixed routing: list/create nested under entity, get/update/delete are flat with all three slugs.
- [ ] 19.1 — Create nested router (prefix under entities): `GET /` and `POST /` for list/create scoped to initiative+entity
- [ ] 19.2 — Create flat router: `GET /{initiative_slug}/{entity_slug}/{feature_slug}` for get
- [ ] 19.3 — `PUT /{initiative_slug}/{entity_slug}/{feature_slug}` for update — accepts `FeatureUpdate`
- [ ] 19.4 — `DELETE /{initiative_slug}/{entity_slug}/{feature_slug}` (204) for delete

### Task 20 — Create stories router (`backend/app/api/v1/stories.py`)
- **Depends on:** 3, 15
- **Context:** Mixed routing: list/create nested under feature, update/delete flat with slugs+index.
- [ ] 20.1 — Create nested router: `GET /stories` and `POST /stories` scoped to a specific feature
- [ ] 20.2 — Create flat router: `PUT /{initiative_slug}/{entity_slug}/{feature_slug}/{story_index}` for update
- [ ] 20.3 — `DELETE /{initiative_slug}/{entity_slug}/{feature_slug}/{story_index}` (204) for delete

### Task 21 — Create tree router (`backend/app/api/v1/tree.py`)
- **Depends on:** 16
- **Context:** Single endpoint for sidebar navigation.
- [ ] 21.1 — `GET /api/v1/initiatives/tree` → returns `list[InitiativeTree]`

### Task 22 — Update `backend/main.py`
- **Depends on:** 17, 18, 19, 20, 21
- **Context:** Remove old routers (items, dictionary), register new routers, remove database imports, update lifespan.
- [ ] 22.1 — Remove `from app.api.v1.items import router as items_router`
- [ ] 22.2 — Remove `from app.api.v1.dictionary import router as dictionary_router`
- [ ] 22.3 — Remove `import app.models.item` and `import app.models.word`
- [ ] 22.4 — Remove database table creation from lifespan (`create_all_tables`)
- [ ] 22.5 — Import and register all new routers with correct prefixes:
  - `initiatives_router` at `/api/v1`
  - `entities_router` at `/api/v1` (nested path is in the router itself)
  - `features_router` at `/api/v1`
  - `stories_router` at `/api/v1`
  - `tree_router` at `/api/v1`
- [ ] 22.6 — Optionally add GitHub connectivity check in lifespan

---

## Phase 5: Backend Tests

### Task 23 — Update test configuration (`backend/tests/conftest.py`)
- **Depends on:** 3, 22
- **Context:** Replace DB fixtures with mocked GitHub client. Current `conftest.py` has `db_session` and `async_client` fixtures using in-memory SQLite.
- [ ] 23.1 — Remove `db_session` fixture and all SQLAlchemy imports
- [ ] 23.2 — Create `mock_github_client` fixture that returns a `MagicMock` (or `AsyncMock`) of `GitHubClient`
- [ ] 23.3 — Update `async_client` fixture to override `get_github_client` dependency with the mock
- [ ] 23.4 — Create helper functions for loading fixture `.feature` files from `tests/fixtures/`

### Task 24 — Write initiative router tests (`backend/tests/test_initiatives_router.py`)
- **Depends on:** 17, 23
- [ ] 24.1 — Test `GET /api/v1/initiatives/` returns list of initiatives (mock `list_contents` to return directory entries)
- [ ] 24.2 — Test `POST /api/v1/initiatives/` creates initiative and returns 201
- [ ] 24.3 — Test `PUT /api/v1/initiatives/{slug}` renames initiative
- [ ] 24.4 — Test `DELETE /api/v1/initiatives/{slug}` returns 204
- [ ] 24.5 — Test 404 when deleting nonexistent initiative

### Task 25 — Write entity router tests (`backend/tests/test_entities_router.py`)
- **Depends on:** 18, 23
- [ ] 25.1 — Test `GET` list entities for an initiative
- [ ] 25.2 — Test `POST` create entity
- [ ] 25.3 — Test `PUT` rename entity
- [ ] 25.4 — Test `DELETE` entity with 204
- [ ] 25.5 — Test 404 for nonexistent initiative or entity

### Task 26 — Write feature router tests (`backend/tests/test_features_router.py`)
- **Depends on:** 19, 23
- [ ] 26.1 — Test `GET` list features in entity
- [ ] 26.2 — Test `POST` create feature (verify Gherkin file content is valid)
- [ ] 26.3 — Test `GET` single feature returns parsed Gherkin with stories
- [ ] 26.4 — Test `PUT` update feature metadata
- [ ] 26.5 — Test `DELETE` feature returns 204
- [ ] 26.6 — Test 409 if SHA conflict on update

### Task 27 — Write story router tests (`backend/tests/test_stories_router.py`)
- **Depends on:** 20, 23
- [ ] 27.1 — Test `GET` list stories for a feature
- [ ] 27.2 — Test `POST` add story (scenario appended to file)
- [ ] 27.3 — Test `PUT` update story at index
- [ ] 27.4 — Test `DELETE` story at index
- [ ] 27.5 — Test 404 for story index out of bounds

### Task 28 — Write tree endpoint tests (`backend/tests/test_tree_router.py`)
- **Depends on:** 21, 23
- [ ] 28.1 — Test `GET /api/v1/initiatives/tree` returns nested 4-level hierarchy
- [ ] 28.2 — Test empty state (no initiatives) returns empty list

### Task 29 — Remove old test files and models
- **Depends on:** 23, 24, 25, 26, 27, 28
- **Context:** Clean up template artifacts no longer needed.
- [ ] 29.1 — Delete `backend/tests/test_items_router.py`
- [ ] 29.2 — Delete `backend/tests/test_dictionary_router.py`, `test_dictionary_service.py`, `test_models.py`, `test_schemas.py`
- [ ] 29.3 — Delete `backend/app/models/item.py`, `backend/app/models/word.py`, `backend/app/models/base.py`
- [ ] 29.4 — Delete `backend/app/schemas/item.py`, `backend/app/schemas/word.py`
- [ ] 29.5 — Delete `backend/app/services/item_service.py`, `backend/app/services/dictionary_service.py`
- [ ] 29.6 — Delete `backend/app/api/v1/items.py`, `backend/app/api/v1/dictionary.py`
- [ ] 29.7 — Delete `backend/app/core/database.py`
- [ ] 29.8 — Delete `backend/data/words.json` and `backend/scripts/seed_db.py`

---

## Phase 6: Docker & Infrastructure

### Task 30 — Update Docker Compose with GitHub environment variables
- **Depends on:** 2
- **Context:** `docker/docker-compose.yml` currently sets `PYTHONUNBUFFERED` and `VITE_API_URL`. Add GitHub env vars.
- [ ] 30.1 — Add `APP_GITHUB_TOKEN` (reference from `.env` file or leave as placeholder)
- [ ] 30.2 — Add `APP_GITHUB_REPO`
- [ ] 30.3 — Add `APP_GITHUB_BRANCH` (default: `main`)
- [ ] 30.4 — Add `APP_FEATURES_BASE_PATH` (default: `initiatives/`)
- [ ] 30.5 — Create a `.env.example` file documenting all required variables

---

## Phase 7: Frontend Types & API Services

### Task 31 — Define TypeScript types (`frontend/src/types/index.ts`)
- **Depends on:** 7, 8, 9, 10, 11
- **Context:** Replace the existing `ItemResponse` interface with all domain types. Mirror the backend Pydantic schemas.
- [ ] 31.1 — Define `Status` and `Priority` union types
- [ ] 31.2 — Define `Initiative`, `InitiativeCreate`
- [ ] 31.3 — Define `Entity`, `EntityCreate`
- [ ] 31.4 — Define `GherkinStep`, `Feature`, `FeatureCreate`, `FeatureUpdate`
- [ ] 31.5 — Define `Story`, `StoryCreate`, `StoryUpdate`, `StoryBrief`
- [ ] 31.6 — Define tree types: `InitiativeTree`, `EntityTree`, `FeatureTree`
- [ ] 31.7 — Remove old `ItemResponse` interface

### Task 32 — Create initiative API service (`frontend/src/services/initiativeApi.ts`)
- **Depends on:** 31
- **Context:** Follow the existing `itemApi.ts` pattern: export plain fetch functions + React Query hooks. Use `apiFetch` from `api.ts`.
- [ ] 32.1 — `getInitiatives()` → `GET /api/v1/initiatives/`
- [ ] 32.2 — `createInitiative(data)` → `POST /api/v1/initiatives/`
- [ ] 32.3 — `renameInitiative(slug, data)` → `PUT /api/v1/initiatives/{slug}`
- [ ] 32.4 — `deleteInitiative(slug)` → `DELETE /api/v1/initiatives/{slug}`
- [ ] 32.5 — `getInitiativeTree()` → `GET /api/v1/initiatives/tree`
- [ ] 32.6 — Export hooks: `useInitiatives()`, `useInitiativeTree()`, `useCreateInitiative()`, `useRenameInitiative()`, `useDeleteInitiative()`
- [ ] 32.7 — All mutation hooks invalidate `["initiatives", "tree"]` and `["initiatives"]` on success

### Task 33 — Create entity API service (`frontend/src/services/entityApi.ts`)
- **Depends on:** 31
- [ ] 33.1 — `getEntities(initiativeSlug)` → `GET /api/v1/initiatives/{slug}/entities/`
- [ ] 33.2 — `createEntity(initiativeSlug, data)` → `POST`
- [ ] 33.3 — `renameEntity(initiativeSlug, entitySlug, data)` → `PUT`
- [ ] 33.4 — `deleteEntity(initiativeSlug, entitySlug)` → `DELETE`
- [ ] 33.5 — Export hooks with appropriate query keys and invalidations

### Task 34 — Create feature API service (`frontend/src/services/featureApi.ts`)
- **Depends on:** 31
- [ ] 34.1 — `getFeatures(initiativeSlug, entitySlug)` → list features
- [ ] 34.2 — `getFeature(initiativeSlug, entitySlug, featureSlug)` → get single parsed feature
- [ ] 34.3 — `createFeature(initiativeSlug, entitySlug, data)` → create
- [ ] 34.4 — `updateFeature(initiativeSlug, entitySlug, featureSlug, data)` → update
- [ ] 34.5 — `deleteFeature(initiativeSlug, entitySlug, featureSlug)` → delete
- [ ] 34.6 — Export hooks: `useFeatures()`, `useFeature()`, `useCreateFeature()`, `useUpdateFeature()`, `useDeleteFeature()`

### Task 35 — Create story API service (`frontend/src/services/storyApi.ts`)
- **Depends on:** 31
- [ ] 35.1 — `getStories(initiativeSlug, entitySlug, featureSlug)` → list
- [ ] 35.2 — `createStory(initiativeSlug, entitySlug, featureSlug, data)` → create
- [ ] 35.3 — `updateStory(initiativeSlug, entitySlug, featureSlug, storyIndex, data)` → update
- [ ] 35.4 — `deleteStory(initiativeSlug, entitySlug, featureSlug, storyIndex)` → delete
- [ ] 35.5 — Export hooks with invalidation of tree + feature-specific queries

### Task 36 — Remove old API service
- **Depends on:** 32
- [ ] 36.1 — Delete `frontend/src/services/itemApi.ts`

---

## Phase 8: Frontend UI Components

### Task 37 — Create Badge component (`frontend/src/components/ui/Badge.tsx`)
- **Depends on:** 31
- **Context:** Color-coded badge for status and priority. Reuse `cn()` from `lib/utils.ts`. Follow the existing `Button.tsx` pattern.
- [ ] 37.1 — Accept props: `variant: "status" | "priority"`, `value: string`
- [ ] 37.2 — Map status values to colors: draft=gray, active/in_progress=blue, done/completed=green, archived=dim
- [ ] 37.3 — Map priority values to colors: low=gray, medium=yellow, high=orange, critical=red
- [ ] 37.4 — Render as small pill/chip with Tailwind classes

### Task 38 — Create Modal component (`frontend/src/components/ui/Modal.tsx`)
- **Depends on:** none
- **Context:** Reusable dialog for delete confirmations. No external dependencies.
- [ ] 38.1 — Accept props: `open: boolean`, `onClose`, `title`, `children`, `onConfirm`
- [ ] 38.2 — Render backdrop overlay + centered card
- [ ] 38.3 — Include Cancel and Confirm buttons (Confirm uses existing Button component with variant)

### Task 39 — Create TreeView component (`frontend/src/components/ui/TreeView.tsx`)
- **Depends on:** none
- **Context:** Generic collapsible tree node. Used by sidebar nodes.
- [ ] 39.1 — Accept props: `label: string`, `icon?: ReactNode`, `children?: ReactNode`, `isExpanded?: boolean`, `onToggle`, `isSelected?: boolean`, `onClick?`
- [ ] 39.2 — Render expand/collapse chevron, label, and nested children with indentation
- [ ] 39.3 — Highlight when selected

---

## Phase 9: Frontend Sidebar

### Task 40 — Create SidebarTree component (`frontend/src/components/features/sidebar/SidebarTree.tsx`)
- **Depends on:** 32, 39
- **Context:** Top-level sidebar component. Fetches tree data via `useInitiativeTree()` hook. Renders initiative nodes.
- [ ] 40.1 — Call `useInitiativeTree()` to fetch the full hierarchy
- [ ] 40.2 — Render loading/error/empty states
- [ ] 40.3 — Render list of `InitiativeNode` components from tree data
- [ ] 40.4 — Accept `selectedItem` and `onSelect` callback props for selection state

### Task 41 — Create InitiativeNode component (`frontend/src/components/features/sidebar/InitiativeNode.tsx`)
- **Depends on:** 39, 40
- [ ] 41.1 — Render initiative name as collapsible TreeView node (folder icon)
- [ ] 41.2 — When expanded, render `EntityNode` children
- [ ] 41.3 — Pass selection state down

### Task 42 — Create EntityNode component (`frontend/src/components/features/sidebar/EntityNode.tsx`)
- **Depends on:** 39, 41
- [ ] 42.1 — Render entity name as collapsible TreeView node
- [ ] 42.2 — When expanded, render `FeatureNode` children

### Task 43 — Create FeatureNode component (`frontend/src/components/features/sidebar/FeatureNode.tsx`)
- **Depends on:** 37, 39, 42
- [ ] 43.1 — Render feature title with status Badge
- [ ] 43.2 — When expanded, render `StoryNode` children

### Task 44 — Create StoryNode component (`frontend/src/components/features/sidebar/StoryNode.tsx`)
- **Depends on:** 37, 43
- [ ] 44.1 — Render story title as leaf node (no expand) with status Badge
- [ ] 44.2 — On click, select this story in the detail panel

---

## Phase 10: Frontend Detail Panel

### Task 45 — Create EmptyState component (`frontend/src/components/features/detail-panel/EmptyState.tsx`)
- **Depends on:** none
- [ ] 45.1 — Render welcome message: "Select an item from the sidebar to view details"

### Task 46 — Create DetailPanel component (`frontend/src/components/features/detail-panel/DetailPanel.tsx`)
- **Depends on:** 45
- **Context:** Router/switcher that renders the correct detail component based on selected item type.
- [ ] 46.1 — Accept props: `selectedItem: { type: "initiative" | "entity" | "feature" | "story", slugs: {...}, index?: number } | null`
- [ ] 46.2 — If null, render `EmptyState`
- [ ] 46.3 — Switch on type → render `InitiativeDetail`, `EntityDetail`, `FeatureDetail`, or `StoryDetail`

### Task 47 — Create InitiativeDetail component (`frontend/src/components/features/detail-panel/InitiativeDetail.tsx`)
- **Depends on:** 32, 38, 46
- [ ] 47.1 — Display initiative name and entity count
- [ ] 47.2 — "Create Entity" button → inline form
- [ ] 47.3 — Rename initiative (inline edit with save/cancel)
- [ ] 47.4 — Delete initiative button → Modal confirmation → `useDeleteInitiative()` mutation

### Task 48 — Create EntityDetail component (`frontend/src/components/features/detail-panel/EntityDetail.tsx`)
- **Depends on:** 33, 38, 46
- [ ] 48.1 — Display entity name and feature count
- [ ] 48.2 — "Create Feature" button → inline form
- [ ] 48.3 — Rename entity (inline edit)
- [ ] 48.4 — Delete entity → Modal confirmation

### Task 49 — Create TagEditor component (`frontend/src/components/features/gherkin/TagEditor.tsx`)
- **Depends on:** 37
- **Context:** Visual editor for Gherkin metadata tags. Renders dropdowns for status, priority, and points.
- [ ] 49.1 — Accept props: `status`, `priority`, `points?`, `onChange` callback
- [ ] 49.2 — Render dropdown/select for each field with Badge previews
- [ ] 49.3 — Points dropdown only shown when `showPoints` prop is true (story-level only)

### Task 50 — Create StepEditor component (`frontend/src/components/features/gherkin/StepEditor.tsx`)
- **Depends on:** 31
- **Context:** Editor for a single Given/When/Then step line.
- [ ] 50.1 — Accept props: `step: GherkinStep`, `onChange`, `onDelete`
- [ ] 50.2 — Render keyword dropdown (Given/When/Then/And/But) + text input
- [ ] 50.3 — Delete button to remove the step

### Task 51 — Create ScenarioEditor component (`frontend/src/components/features/gherkin/ScenarioEditor.tsx`)
- **Depends on:** 49, 50
- **Context:** Full editor for a single Scenario block: title, tags, and step list.
- [ ] 51.1 — Accept props: story data + `onSave` and `onCancel` callbacks
- [ ] 51.2 — Title text input
- [ ] 51.3 — TagEditor for status, priority, points
- [ ] 51.4 — List of StepEditor components with "Add Step" button
- [ ] 51.5 — Save and Cancel buttons

### Task 52 — Create FeatureDetail component (`frontend/src/components/features/detail-panel/FeatureDetail.tsx`)
- **Depends on:** 34, 38, 49, 51
- [ ] 52.1 — Fetch feature data via `useFeature(initiativeSlug, entitySlug, featureSlug)`
- [ ] 52.2 — Display feature title, description, status/priority badges
- [ ] 52.3 — Edit mode: title input, description textarea, TagEditor
- [ ] 52.4 — List stories with brief info + "Add Story" button
- [ ] 52.5 — Delete feature → Modal confirmation

### Task 53 — Create StoryDetail component (`frontend/src/components/features/detail-panel/StoryDetail.tsx`)
- **Depends on:** 35, 38, 51
- [ ] 53.1 — Fetch story data (via parent feature query or dedicated endpoint)
- [ ] 53.2 — Display story title, steps, status/priority/points badges
- [ ] 53.3 — Edit mode: renders full `ScenarioEditor`
- [ ] 53.4 — Delete story → Modal confirmation

---

## Phase 11: Frontend Layout & Routing

### Task 54 — Create ManagerPage (`frontend/src/pages/ManagerPage.tsx`)
- **Depends on:** 40, 46
- **Context:** Main layout page replacing `HomePage.tsx`. Two-panel layout: sidebar + detail panel.
- [ ] 54.1 — Manage selection state: `{ type, slugs, index } | null`
- [ ] 54.2 — Render fixed-width sidebar (~300px) with `SidebarTree`, passing selection callbacks
- [ ] 54.3 — Render flexible detail panel with `DetailPanel`, passing selected item
- [ ] 54.4 — "New Initiative" button in sidebar header
- [ ] 54.5 — Style with Tailwind: `flex h-screen`, sidebar `w-80 border-r overflow-y-auto`, detail panel `flex-1 overflow-y-auto p-6`

### Task 55 — Update App.tsx routing
- **Depends on:** 54
- **Context:** Replace `HomePage` route with `ManagerPage`.
- [ ] 55.1 — Replace `import HomePage` with `import ManagerPage`
- [ ] 55.2 — Update route: `/` → `<ManagerPage />`

### Task 56 — Delete old frontend files
- **Depends on:** 55
- [ ] 56.1 — Delete `frontend/src/pages/HomePage.tsx`

---

## Phase 12: Integration & Polish

### Task 57 — End-to-end smoke test
- **Depends on:** 22, 55
- **Context:** Verify the full stack works with a real GitHub repo.
- [ ] 57.1 — Create a test initiative folder in the target GitHub repo
- [ ] 57.2 — Run `make build && make server`
- [ ] 57.3 — Verify `GET /api/v1/initiatives/tree` returns the test data
- [ ] 57.4 — Verify the UI sidebar loads and displays the hierarchy
- [ ] 57.5 — Test creating, editing, and deleting at each level via the UI

### Task 58 — Run full test suite
- **Depends on:** 29, 57
- [ ] 58.1 — Run `make test` — verify all backend tests pass
- [ ] 58.2 — Fix any failing tests

### Task 59 — Update docs/template-guide.md
- **Depends on:** 57
- **Context:** The guide still references the old Item example and CLAUDE.md file structure.
- [ ] 59.1 — Update architecture sections to reference GitHub API instead of DB
- [ ] 59.2 — Replace the Item/Task walkthrough with an Initiative/Feature walkthrough
- [ ] 59.3 — Update environment variables section
- [ ] 59.4 — Update AI-Assisted Development section to reference Claude Code

---

## Dependency Graph Summary

```
Phase 1 (Core):        1 → 2 → 3
                       1 → 4 → 5 → 6

Phase 2 (Schemas):     7, 8, 9, 10 (independent) → 11

Phase 3 (Services):    3+7 → 12, 3+8 → 13, 3+4+5+9 → 14, 3+4+5+10+14 → 15, 3+4+11 → 16

Phase 4 (Routers):     12→17, 13→18, 14→19, 15→20, 16→21 → 22

Phase 5 (Tests):       22 → 23 → 24,25,26,27,28 → 29

Phase 6 (Docker):      2 → 30

Phase 7 (FE Types):    schemas → 31 → 32,33,34,35 → 36

Phase 8 (FE UI):       37,38,39 (independent)

Phase 9 (FE Sidebar):  32+39 → 40 → 41 → 42 → 43 → 44

Phase 10 (FE Detail):  45 → 46 → 47,48,49,50 → 51 → 52,53

Phase 11 (FE Layout):  40+46 → 54 → 55 → 56

Phase 12 (Polish):     22+55 → 57 → 58,59
```
