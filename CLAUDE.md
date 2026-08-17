# Claude Code Repository Guidance

## Project

Edu Trainer frontend: React 19, TypeScript, Vite, TanStack Query, Tailwind, and Vitest. Application code and
colocated tests live under `src/`.

## Commands

- `npm run build` — type-check and build.
- `npm test -- --run <files>` — run focused tests once.
- `npm run lint` — run ESLint.

Do not create or run integration tests, browser containers, Docker, or end-to-end infrastructure unless the user
explicitly requests them.

## Conventions

- Follow repository `AGENTS.md` as the source of truth.
- Use functional components and existing shared components, hooks, services, and feature boundaries.
- Keep deployment-specific configuration in Vite environment variables and never commit secrets.

## Testing

Use the local `test-coverage` skill whenever adding, reviewing, or proposing tests. Prioritize production code and
write only the smallest focused Vitest/Testing Library set needed to prove changed behavior. Avoid duplicate
permutations, trivial passthrough tests, and library-guaranteed behavior.
