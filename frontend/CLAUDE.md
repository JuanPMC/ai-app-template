## Tech Stack

- Vite
- Tailwind CSS 3.4 (dark-mode minimalist aesthetic)
- TanStack React Query 5 (server state)
- Zustand 5 (client state -- auth store)
- React Hook Form 7 + Zod 4 (form validation)
- React Router 7 (routing)

## Project Structure

```
src/
├── pages/
├── components/
│   └── features/
├── services/
├── stores/
├── types/
├── utils/
├── App.tsx                   # Router setup, ProtectedRoute, QueryClientProvider
├── main.tsx                  # React root + StrictMode
└── index.css                 # Tailwind directives
```

## Architecture Rules

- **API layer is the boundary.** All HTTP calls go through `services/api.ts`. Never use `fetch` directly in components.
- **Server state via React Query.** Use `useQuery` for reads, `useMutation` for writes. Invalidate related queries on success.
- **Client state via Zustand.** Only the auth store uses Zustand. Don't add stores for server-derived data.
- **Forms via React Hook Form + Zod.** All forms use `zodResolver` for validation. Define schemas next to the component.
- **Path alias:** `@` maps to `./src` (configured in `vite.config.ts` and `tsconfig`).

## Coding Conventions

- Pages are named exports (`export function Login()`).
- Components are in `components/features/` (feature-specific) or `components/ui/` (generic, if needed).
- Types live in `types/` and mirror backend schemas.
- API services are thin wrappers: one function per endpoint, typed return values.
- Tailwind classes directly in JSX. Use `cn()` for conditional classes.
