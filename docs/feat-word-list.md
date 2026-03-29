## Phase 1: Test Suite (Red Light)
**Goal:** Define the contract for the Word List service. All tests should fail initially due to missing modules or 404/422 errors.

### [Task 1] Models & Schemas Tests
* **1.1:** Create `backend/tests/test_word_list_models.py`. Assert that `WordList` has a `name` column and `WordListItem` has `list_id` and `word_id` foreign keys.
* **1.2:** Create `backend/tests/test_word_list_schemas.py`. Test `WordListCreate` and `WordListResponse` validation, ensuring `word_ids` is required as a list of integers.

### [Task 2] Word List Service Tests
* **2.1:** Create `backend/tests/test_word_list_service.py`. Write a test for `create_word_list` that:
    * Succeeds when providing valid dictionary `word_ids`.
    * Fails (raises `HTTPException`) if any `word_id` does not exist in the master dictionary.
* **2.2:** Write a test for `get_all_word_lists` asserting it returns a list of `WordListResponse` objects.
* **2.3:** Write a test for `delete_word_list` ensuring that deleting a list also removes the entries in the join table (cascade behavior).

### [Task 3] Router Tests
* **3.1:** Create `backend/tests/test_word_list_router.py`. Use `AsyncClient` to test `POST /api/v1/word-lists`. Assert `201 Created` and verify the returned JSON contains the list of IDs.
* **3.2:** Test `GET /api/v1/word-lists/{id}` for both a valid ID and a `404` case.

---

## Phase 2: Implementation (Green Light)
**Goal:** Implement the minimum code required to pass the test suite.

### [Task 4] Models & Schemas Implementation
* **4.1:** Create `backend/app/models/word_list.py`. Implement `WordList` and the association table/model for `WordListItem`.
* **4.2:** Create `backend/app/schemas/word_list.py` with Pydantic models.
* **4.3:** Run `pytest` to pass Task 1.

### [Task 5] Service & Router Implementation
* **5.1:** Create `backend/app/services/word_list_service.py`. Implement logic to fetch, create, and delete lists. **Crucial:** Add a check against the `Word` model to validate `word_ids` during creation.
* **5.2:** Create `backend/app/api/v1/word_lists.py`. Define the FastAPI routes and inject the `DbSession`.
* **5.3:** Register the new router in `backend/main.py`.
* **5.4:** Run `make test` — the full suite must be green.
