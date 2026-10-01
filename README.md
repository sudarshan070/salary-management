# Salary Management

A web tool for ACME's HR Manager to manage salary data for 10,000 employees across countries, replacing spreadsheets, and to answer how the organisation pays people by country and job title.

Built for the Incubyte Software Craftsperson assessment.

|                |                                                     |
| -------------- | --------------------------------------------------- |
| **Live app**   | _coming with the first deploy_                      |
| **API docs**   | _`/docs` on the API, coming with the employees API_ |
| **Demo video** | _coming on Day 2_                                   |

> The API runs on a free Render instance that sleeps when idle. The first request after a pause can take about a minute.

## Quick start

Requires Node 22 and pnpm (`corepack enable` installs the pinned version).

```bash
pnpm install
pnpm dev          # API on http://localhost:3000, web on http://localhost:5173
pnpm test         # all tests
pnpm check        # lint, format, typecheck, tests and build — same as CI
```

## Repository layout

```
apps/api         Express 5 API (TypeScript)
apps/web         React 19 + Vite web app
packages/shared  Zod schemas and types shared by both apps
docs/            requirements, plan, ADRs, guides
```

## Documentation

| Doc                                          | What it covers                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| [Requirements](docs/requirements.md)         | One page: goal, scope, features, what is left out and why                |
| [Plan](docs/plan.md)                         | Planning and design notes, architecture, timeline, risks                 |
| [Architecture decisions](docs/adr/README.md) | Why Express, SQLite/Turso, Drizzle, integer money, no auth, free hosting |
| [Deployment](docs/deployment.md)             | Vercel + Render + Turso setup, env vars, rollback                        |
| [AI usage](docs/ai-usage.md)                 | How AI tools were used and what was accepted or changed                  |
| [Agent instructions](CLAUDE.md)              | Standing rules given to AI coding agents                                 |

Architecture, testing and performance docs are added as those parts are built.
