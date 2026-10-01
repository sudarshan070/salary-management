# Testing

Tests are written before the code they cover (see the `test:` → `feat:` pairs in the git history). The whole suite runs in a few seconds and never touches the network.

```bash
pnpm test                       # everything
pnpm --filter @salary/api test  # API only
pnpm --filter @salary/api exec vitest run src/performance.test.ts   # 10,000-row budget
```

## What is tested where

| Level                 | Files                                                                | What it proves                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema (unit)         | `packages/shared/src/*.test.ts`                                      | Validation rules: names, emails, countries, integer salaries, page-size cap, sort keys                                                                                          |
| Business rules (unit) | `apps/api/src/modules/employees/employees.service.test.ts`           | Currency from country, unique email, no future hire dates, not-found handling — against an in-memory fake repository                                                            |
| Seed data (unit)      | `apps/api/src/seed/*.test.ts`                                        | Exactly 10,000 valid, unique, deterministic employees across all countries; batched, repeatable seeding                                                                         |
| API (integration)     | `apps/api/src/**/*.router.test.ts`, `app.test.ts`, `openapi.test.ts` | Real HTTP through Express (Supertest) against a real, migrated SQLite database: status codes, filters, sorting, pagination, error shape, insights maths incl. both median cases |
| Database              | `apps/api/src/db/migrations.test.ts`                                 | Migrations create the table, indexes and the unique email constraint                                                                                                            |
| Performance           | `apps/api/src/performance.test.ts`                                   | Every list and insight endpoint under 200 ms with 10,000 rows                                                                                                                   |
| Web (component)       | `apps/web/src/*.test.tsx`                                            | What the HR Manager sees for each API state                                                                                                                                     |

## Rules that keep tests fast and deterministic

- **Fresh database per test file:** `createTestDb()` makes a migrated SQLite file in a temp folder. Tests never share state.
- **Fixed clock:** the app takes a `clock` function; tests pass `2026-10-01T09:00:00Z`, so "today" never changes.
- **Seeded random data:** the generator uses a seeded PRNG, so the same seed always gives the same 10,000 employees.
- **No network:** the web tests stub `fetch`; the API tests call Express in-process.
- **Names describe behaviour:** `refuses a hire date in the future`, not `test create 3`.
