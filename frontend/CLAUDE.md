## Tech Stack

- React (TypeScript) + Vite
- Tailwind CSS 3.4
- TanStack React Query 5 (server state)
- Zustand 5 (client state — session store)
- React Hook Form 7 + Zod 4 (form validation)
- React Router 7 (routing)
- Web MediaRecorder API (audio capture)

## Project Structure

```
src/
├── pages/
│   ├── WordListsPage.tsx     # Browse and select practice sets
│   ├── SessionPage.tsx       # Main loop: word prompt → record → phoneme feedback
│   └── ProgressPage.tsx      # Mastery scores per phoneme
├── components/
│   └── features/
│       ├── PhoneticBreakdown/ # Renders IPA sequence; green = correct, red = incorrect
│       ├── AudioRecorder/     # MediaRecorder state machine (idle → recording → processing)
│       └── CorrectionHint/   # Popover showing "Sound should be /θ/ as in 'Think'" hint
├── services/
│   ├── api.ts                # Axios/fetch base client — all HTTP calls go here
│   ├── evaluationApi.ts      # POST /evaluate (sends .wav blob, returns PhonemeResult[])
│   └── wordListApi.ts        # CRUD for practice sets
├── stores/
│   └── sessionStore.ts       # Current word, recording state, evaluation results
├── types/
│   └── index.ts              # Word, PhonemeResult, EvaluationResponse, MasteryScore
├── App.tsx                   # Router setup, ProtectedRoute, QueryClientProvider
├── main.tsx                  # React root + StrictMode
└── index.css                 # Tailwind directives
```

## Architecture Rules

- **API layer is the boundary.** All HTTP calls go through `services/api.ts`. Never use `fetch` directly in components.
- **Server state via React Query.** Use `useQuery` for reads (word lists, progress), `useMutation` for writes (evaluate, save list). Invalidate related queries on success.
- **Client state via Zustand.** Only the session store uses Zustand. Don't add stores for server-derived data.
- **Recording is a state machine.** The `AudioRecorder` component cycles through `idle → recording → processing → done`. Never manage raw MediaRecorder events outside this component.
- **Forms via React Hook Form + Zod.** All forms use `zodResolver`. Define schemas next to the component.
- **Path alias:** `@` maps to `./src` (configured in `vite.config.ts` and `tsconfig`).

## Key Domain Concepts

- **PhonemeResult:** `{ phoneme: string, expected: string, correct: boolean, hint?: string }`. The `PhoneticBreakdown` component renders one chip per result.
- **EvaluationResponse:** Array of `PhonemeResult` returned by POST `/evaluate`. Drives the color-coded IPA display.
- **CorrectionHint:** Shown when user clicks a red phoneme chip. Content comes from the backend error map (e.g., `"Sound should be /θ/ as in 'Think', not /f/ as in 'Finger'"`).
- **Session loop:** `SessionPage` advances through words in a list; failed phonemes are flagged for retry injection.

## Coding Conventions

- Pages are named exports (`export function SessionPage()`).
- Components are in `components/features/` (feature-specific) or `components/ui/` (generic).
- Types live in `types/` and mirror backend Pydantic schemas.
- API services are thin wrappers: one function per endpoint, typed return values.
- Tailwind classes directly in JSX. Use `cn()` for conditional classes.
