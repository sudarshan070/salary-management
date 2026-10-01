# Agent instructions

Instructions for AI coding agents (Claude Code, Codex, Cursor) working in this repo. `AGENTS.md` points here.

## What this is

A salary management tool for ACME's HR Manager: manage 10,000 employee records and answer how the organisation pays people by country and job title. Scope and non-goals live in `docs/requirements.md`; do not add features outside it without updating that file first.

## Stack

- pnpm workspace: `apps/api` (Express 5, Drizzle, libSQL/SQLite), `apps/web` (React 19, Vite), `packages/shared` (Zod schemas and types).
- TypeScript strict everywhere. Node 22.

## Commands

| Task                              | Command        |
| --------------------------------- | -------------- |
| Install                           | `pnpm install` |
| Run API + web                     | `pnpm dev`     |
| All tests                         | `pnpm test`    |
| Lint, format, types, tests, build | `pnpm check`   |

## Rules

1. **Tests first.** Write a failing test named for the behaviour, then the code. Never commit code without its test.
2. **Layering in the API:** router → controller → service → repository. Services hold business rules and know nothing about HTTP or SQL. Repositories are the only place that touches Drizzle.
3. **One schema, one source of truth.** Request and response shapes are Zod schemas in `packages/shared`; the API validates with them and the web app reuses them.
4. **Money is an integer** in minor units (`salary_minor`). Never use floats for salaries.
5. **Errors** use one shape: `{ error: { code, message, details? } }`, produced only by the error-handling middleware.
6. **Tests are deterministic:** no network, no real clock, seeded random data, a fresh in-memory database per test file.
7. **Small commits** using Conventional Commits (`test:`, `feat:`, `refactor:`, `docs:`, `chore:`), each building and passing.
8. Record any architectural decision as an ADR in `docs/adr/` and any significant AI-assisted step in `docs/ai-usage.md`.

## Do not

- Add authentication, currency conversion, tax logic or salary history (deliberate non-goals).
- Return all 10,000 rows from an endpoint; lists are paginated (max 100 per page).
- Introduce new dependencies without a one-line reason in the commit message.
