# Contributing

Korean: [`CONTRIBUTING.md`](CONTRIBUTING.md)

Thanks for contributing to `litomi`. This guide lists the expectations that help PRs get reviewed and merged smoothly.

## Code of Conduct

This project follows [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Quickstart (development)

Please follow the README first to set up the local environment:

- Korean: [`README.md`](README.md)
- English: [`README.en.md`](README.en.md)

In short, local development requires all of these running:

- Postgres + Redis (docker compose)
- Backend
- Web

## Workflow

- **Open an issue first**: for large changes (refactors, design changes, new features), align on direction in an issue first.
- **Keep PRs small**: one goal per PR when possible.
- **Don’t break unrelated features**: include minimal tests relevant to your change.

## Quality bar (required)

- **Type safety**: don’t use `any`.
- **Tests**:
  - Unit: `bun test`
  - E2E: `bun run test:e2e`
- **Static checks**:
  - Lint: `bun run lint`
  - Typecheck: `bun run type`

## Style notes (high-signal)

The repo’s code/config is the source of truth. These are the most common pitfalls:

- **No barrel files**: don’t re-export via `index.ts`. Import directly from the source file.
- **Time constants**: avoid magic numbers; use `ms()` / `sec()` helpers.
- **SQL**:
  - Allowed: `sql\`\`` fragments (expressions/CASE/etc.)
  - Forbidden: `sql.raw(...)` or string concatenation to build SQL
- **Korean UX writing**: user-facing Korean text should keep a friendly **~요** tone.

## Commit / PR guidance

- **Commit messages**: describe intent, not implementation details.
- **PR description**:
  - What changed
  - Why it changed
  - How to test (commands / scenarios)

## Need help?

If you’re unsure, open an issue with reproduction steps and screenshots if applicable.
