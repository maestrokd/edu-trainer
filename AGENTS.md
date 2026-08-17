# Repository Guidelines

## Project Structure

This is a React 19, TypeScript, and Vite frontend. Application code lives in `src/`; shared UI is under
`src/components`, contexts under `src/contexts`, services under `src/services`, feature code under `src/features`,
and translations under `src/locales`. Keep tests next to the code they verify as `*.test.ts` or `*.test.tsx`.

## Commands

- `npm run dev` — start Vite locally.
- `npm run build` — type-check and build.
- `npm test -- --run <files>` — run focused Vitest tests once.
- `npm run lint` — run ESLint.
- `npm run format` — apply Prettier.

## Style

Use functional React components, 2-space indentation, double quotes, semicolons, and existing alias/import patterns.
Prefer existing shared UI and feature boundaries. Keep functions focused and assert user-visible behavior.

## Testing

Prioritize production code and add only the smallest useful Vitest/Testing Library test set needed to prove risky
behavior or guard a regression. Prefer one representative success case and one test per materially distinct error.
Avoid duplicate permutations, trivial passthrough tests, and library-guaranteed behavior.

Do not create or run integration tests, browser containers, Docker, or end-to-end infrastructure unless the user
explicitly requests them.

## Security and Configuration

Do not commit secrets. Use Vite environment variables for deployment-specific values.
