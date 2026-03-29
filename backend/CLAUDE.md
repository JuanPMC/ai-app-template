## Tech Stack

- Python 3.12+
- FastAPI
- SQLAlchemy 2.0 (async with asyncpg)
- Pydantic v2 for request/response models
- PostgreSQL database
- `transformers` (Hugging Face) + `torch` — wav2vec2-lv60-phoneme model
- `librosa` — audio preprocessing

## Project Structure

```
app/
├── api/
│   ├── v1/
│   │   ├── evaluation.py     # POST /evaluate — run inference + phoneme comparison
│   │   ├── dictionary.py     # GET /words, GET /words/{id}
│   │   ├── word_lists.py     # CRUD for user practice sets
│   │   ├── progress.py       # GET /progress, PUT /progress/{phoneme}
│   │   └── __init__.py       # Collects all v1 routers
│   └── deps.py               # Shared dependencies (DbSession, CurrentUser)
├── models/
│   ├── word.py               # Word ORM model (master dictionary: id, text, ipa)
│   ├── word_list.py          # WordList + WordListItem ORM models
│   └── progress.py           # MasteryScore ORM model (user_id, phoneme, score)
├── schemas/
│   ├── word.py               # WordResponse: { id, text, ipa: list[str] }
│   ├── evaluation.py         # EvaluationRequest (audio blob), EvaluationResponse, PhonemeResult
│   ├── word_list.py          # WordListCreate, WordListResponse
│   └── progress.py           # MasteryScoreResponse
├── services/
│   ├── evaluation_service.py # Exact-match alignment: model output IPA vs dictionary IPA
│   ├── dictionary_service.py # Fetch words from master dictionary
│   ├── word_list_service.py  # CRUD for practice sets (reference word IDs)
│   └── progress_service.py   # Read/update mastery scores per phoneme
├── ml/
│   ├── phoneme_model.py      # wav2vec2 model loading + inference → IPA sequence
│   └── error_map.py          # Lookup: "θ_f" → "Sound should be /θ/ as in 'Think', not /f/"
├── core/
│   ├── config.py             # Settings via pydantic-settings (env prefix: PHONEMES_)
│   ├── security.py           # JWT encode/decode, password hash/verify
│   └── database.py           # Async engine + session factory
└── main.py                   # FastAPI app with CORS + lifespan (model pre-load)
```

## Architecture Rules

- **One router per domain.** `api/v1/evaluation.py` handles all evaluation endpoints. Never put multiple unrelated domains in one router file.
- **Three-layer architecture:** Router -> Service -> Model. Routers validate input and call services. Services contain business logic and call the ORM. Never do ORM queries directly in router functions.
- **ML logic is isolated in `ml/`.** Routers and services never import `transformers` or `torch` directly — go through `phoneme_model.py`.
- **All route handlers are `async def`.** Use async natively with asyncpg.
- **Dependency injection via `Depends()`.** Use `Annotated[type, Depends(...)]` for type-safe injection. See `DbSession` and `CurrentUser` in `deps.py`.
- **Pydantic models are the contract.** API consumers see Pydantic schemas, never SQLAlchemy models. Map with `model_validate()`.

## Key Domain Concepts

- **Master Dictionary:** Static source of truth. Each entry: `{ id, text, ipa: list[str] }`. Example: `{ "id": 101, "text": "Think", "ipa": ["θ", "ɪ", "ŋ", "k"] }`.
- **Evaluation:** POST `/evaluate` accepts a `.wav` blob + `word_id`. Returns per-phoneme results (correct/incorrect) after 1:1 index comparison.
- **Error Map:** Keyed by `{target}_{user}` (e.g., `θ_f`). Value is the corrective hint string.
- **Mastery Score:** A float per (user, phoneme) pair — updated after each evaluation, not raw audio stored.
- **Practice Sets:** User-created lists that reference word IDs from the master dictionary.

## Coding Conventions

- Pydantic schema naming: `{Entity}Create`, `{Entity}Update`, `{Entity}Response`.
- Route function naming: verb first, noun second (`evaluate_word`, `get_word`, `create_word_list`).
- Error responses: raise `HTTPException` with specific status codes and detail messages.
- Environment config: use `pydantic-settings` with `Settings` class. Access via `get_settings()`. Never use `os.getenv()`.

## Testing

- Framework: `pytest` + `pytest-asyncio` (auto mode)
- HTTP client: `httpx.AsyncClient` with `ASGITransport`
- Database: isolated PostgreSQL schema per test via `conftest.py` fixtures
- ML model: mock `phoneme_model.py` in unit tests — never load real weights in tests
- Test files mirror the modules they test: `test_evaluation_service.py` tests `evaluation_service.py`
- Run tests: `./venv/bin/python -m pytest tests/ -v`

## NEVER DO THIS

1. **Never do ORM queries in routers.** Routers call services, services call the ORM.
2. **Never return SQLAlchemy models from endpoints.** Always map to a Pydantic Response schema.
3. **Never hardcode connection strings or secrets.** Use environment variables via `pydantic-settings`.
4. **Never use synchronous database drivers in async code.**
5. **Never load the wav2vec2 model per-request.** Load once at startup in `lifespan` and inject via `Depends()`.
