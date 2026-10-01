# Salary Management

A web tool for ACME's HR Manager to manage salary records for 10,000 employees in 10 countries, replacing spreadsheets, and to see how the organisation pays people by country and job title.

Built for the Incubyte Software Craftsperson assessment.

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| **Live app**   | https://e-salary-management.vercel.app                 |
| **API docs**   | https://salary-api-vdsd.onrender.com/docs (Swagger UI) |
| **Demo video** | _[link added after recording]_                         |

> The API runs on a free Render instance that sleeps after 15 idle minutes. The first request can take about a minute; the app shows a "waking up" banner meanwhile.

## What it does

- **Insights (home):** totals; median, average and min–max range of pay per country; pay by job title within any country; headcount by department and employment type. Every figure is in the country's own currency, and currencies are never mixed.
- **Employees:** search by name or email; filter by country, department and job title; sort by name, hire date or salary; server-side pages of 25, 50 or 100. Filters live in the URL.
- **Add, edit, delete:** one form validated by the same schema as the API. The currency follows the country, salaries are stored as integer minor units, and API errors (duplicate email, future hire date) appear on the right field. Deleting asks for confirmation.

What it deliberately does not do (login, currency conversion, tax, salary history, Excel import), and why: [requirements](docs/requirements.md).

## Stack

TypeScript end to end in a pnpm monorepo.

| Part              | Tech                                                                            | Hosted on |
| ----------------- | ------------------------------------------------------------------------------- | --------- |
| `apps/web`        | React 19, Vite, Tailwind CSS v4, TanStack Query, React Hook Form, Radix dialogs | Vercel    |
| `apps/api`        | Express 5, Drizzle ORM, libSQL (SQLite), Zod, OpenAPI                           | Render    |
| `packages/shared` | Zod schemas and types used by both apps                                         | —         |
| Database          | SQLite: a local file in dev and tests, Turso in production                      | Turso     |

## Quick start

Requires Node 22 and pnpm (`corepack enable` installs the pinned version; on macOS you may need `sudo corepack enable`).

```bash
pnpm install
pnpm --filter @salary/api db:seed   # creates apps/api/local.db with 10,000 employees (~1 s)
pnpm dev     # API on http://localhost:3000, web on http://localhost:5173
pnpm test    # 103 tests, a few seconds
pnpm check   # lint, format, typecheck, tests and build — the same as CI
```

The API reads `apps/api/.env` if present (see `apps/api/.env.example`). With no settings it uses the local `local.db` SQLite file; running `db:seed` again resets it.

## How it's built

- **Requirements and plan first:** the first commits are [docs/requirements.md](docs/requirements.md) and [docs/plan.md](docs/plan.md).
- **Test-first:** each `test:` commit comes before its `feat:` commit. Unit, integration (real HTTP against real SQLite) and component tests; a performance test fails the build if any endpoint takes over 200 ms on 10,000 rows.
- **Layered API:** router → service → repository. Business rules have no HTTP or SQL in them.
- **One source of truth:** the Zod schemas in `packages/shared` validate API requests, validate the web form, type both apps and generate the API docs.

## Documentation

| Doc                                        | What it covers                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| [Requirements](docs/requirements.md)       | One page: goal, scope, features, what is left out and why, assumptions               |
| [Plan](docs/plan.md)                       | Planning and design notes, timeline, risks, changes made during the build            |
| [Architecture](docs/architecture.md)       | Diagrams: system, API layers, request flow, data model, frontend, errors, deployment |
| [Decisions (ADRs)](docs/adr/README.md)     | Express, SQLite/Turso, Drizzle, integer money, no auth, free hosting, monorepo       |
| [Testing](docs/testing.md)                 | Test levels, how to run them, determinism rules                                      |
| [Performance](docs/performance.md)         | Measured timings at 10,000 rows, indexes, known limits                               |
| [Deployment](docs/deployment.md)           | Vercel + Render + Turso setup, environment variables, rollback                       |
| [AI usage](docs/ai-usage.md)               | How AI tools were used, and what was accepted, changed or rejected                   |
| [Agent instructions](CLAUDE.md)            | Standing rules given to AI coding agents                                             |
| [Interview notes](docs/interview-notes.md) | Walkthrough of decisions, trade-offs and next steps                                  |

## Repository layout

```
apps/api         Express 5 API: modules/{employees,insights,health}, db, seed, middleware
apps/web         React app: features/{insights,employees}, components, lib
packages/shared  Zod schemas, types, countries and currencies
docs/            requirements, plan, architecture, ADRs, guides
```
