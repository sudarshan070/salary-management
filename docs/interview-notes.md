# Interview notes

A walkthrough script for the technical discussion. The email says the interview will cover design decisions, architecture, AI workflows, trade-offs and possible improvements. Each section below is a 1–2 minute answer, with the file to open while speaking.

## 1. The problem, in one breath

ACME's HR Manager runs salaries for 10,000 people in 10 countries out of spreadsheets. The tool has two jobs: keep the records correct, and answer how the organisation pays people by country and by job title. Everything else was a deliberate omission, written down before coding (`docs/requirements.md`, first commit).

## 2. How I worked

- **Clarified, then decided:** I sent the team 6 questions, each with my planned answer. There was no reply, so the planned answers became documented assumptions. I kept product questions, such as which insights matter, as my own decisions; the brief leaves that judgment to the candidate.
- **Planned before building:** the plan (`docs/plan.md`) has scope, stack, a 2-day timeline with gates, and risks. The first gate was "deploys end to end on Day 1 morning", which took the riskiest unknown out early.
- **Test-first, visibly:** the history shows `test:` commits before `feat:` commits. Run `git log --oneline` to show it.
- **Designed before coding the UI:** mockups built from live API data were reviewed first, then implemented.

## 3. Architecture (open `docs/architecture.md`)

- Monorepo: `apps/api`, `apps/web`, `packages/shared`. The shared Zod schemas are the single source of truth. The API validates requests with them, the web form validates with them, and the API docs are generated from them.
- API layering: router → service → repository. Services have no HTTP or SQL and depend on a repository interface, which is why the service tests use an in-memory fake (`employees.service.test.ts`).
- `createApp(deps)` takes the database and the clock as inputs, so tests are fast and deterministic and `server.ts` is the only file that listens.

## 4. Decisions I'd defend (ADRs in `docs/adr/`)

| Decision                             | Why                                                           | What I gave up                                                              |
| ------------------------------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Express over NestJS/Fastify          | Lowest delivery risk for 2 days; familiar to most reviewers   | Framework-enforced structure (enforced by convention + `CLAUDE.md` instead) |
| SQLite (Turso in prod)               | Matches the brief; same engine locally, in tests and in prod  | Some PostgreSQL features; migration path documented                         |
| Money as integer minor units         | No float errors; JPY handled with 0 decimals                  | Formatting needed at the edge                                               |
| No currency conversion               | Mixing currencies would mislead; every insight is per country | No single global "average salary"                                           |
| Median in SQL with a window function | Grouping stays in the database; no 10,000 rows in memory      | Slightly more complex SQL, covered by odd/even tests                        |
| Seed on first boot                   | Reviewers always see 10,000 employees with no manual step     | Only runs when the table is empty, so it can never wipe data                |
| No auth                              | One persona in the brief; auth wouldn't prove the core        | Must be added before real data (roadmap item 2)                             |

## 5. Testing

- 102 tests in a few seconds. Unit tests cover rules and formatting, integration tests cover real HTTP against a real migrated SQLite file, and component tests cover what the HR Manager sees.
- Determinism: a fresh database per test file, an injected clock, a seeded PRNG, and no network. The web tests use a small fetch router that records every call.
- The performance test seeds 10,000 rows and fails the build if any list or insight endpoint exceeds 200 ms. The measured range is 8–52 ms.

## 6. How I used AI (open `docs/ai-usage.md`, `CLAUDE.md`)

- `CLAUDE.md` gives every agent the same rules: tests first, layering, money as integers, one error shape, no out-of-scope features.
- AI drafted, researched and scaffolded. I made the decisions, and the log records where I overrode it:
  - Rejected Fastify for delivery risk.
  - Trimmed the clarifying questions from 8 to 6.
  - Pinned the previous major versions instead of the newest.
  - Dropped libraries the screens didn't need.
- Bugs caught through tests rather than trusting output: the OpenAPI library couldn't extend schemas created before it loaded; filter and dialog fields had duplicate ids; an earlier commit nearly published a database token, caught before push.
- Commits written with AI help carry a `Co-Authored-By` trailer.

## 7. Trade-offs and known limits

- `LIKE '%term%'` search and `OFFSET` paging are fine at 10,000 rows, but not at millions (FTS5 or PostgreSQL trigram indexes; keyset pagination).
- The free Render plan sleeps after 15 minutes, so the first request takes about a minute. The UI explains the wait, and Render Starter removes it.
- Two mid-history commits don't build on their own (a dependent file landed one commit later). The final tree is green in CI. Next time I'd run `pnpm check` on every commit with a pre-commit hook.

## 8. What I'd build next (in order)

1. CSV/Excel import with a per-row validation report, reusing the shared schema. It's the real migration path off spreadsheets.
2. Authentication, roles (HR admin, viewer) and an audit log of salary changes.
3. Salary history with effective dates.
4. Salary bands, compa-ratio and pay-equity views (for example, the gap by department within a country).
5. Multi-currency comparison with dated exchange rates, clearly labelled as converted.
6. PostgreSQL and multi-tenant organisations, if this becomes a product.

## 9. Likely questions, short answers

- **"Why not compare countries in USD?"** Converting salaries at a single exchange rate hides cost-of-labour differences, and the rates drift. Comparing within a country is accurate; across countries it needs a dated, labelled conversion, which is on the roadmap.
- **"How do you stop the client and server rules drifting?"** They're the same Zod schema, imported from `packages/shared`.
- **"What happens with two edits at once?"** The last write wins today. With real use, I'd add an `updated_at` precondition (optimistic locking) and return 409 on conflict.
- **"How would you scale to 1 million employees?"** Move to PostgreSQL behind the same repository interface, use keyset pagination and full-text search, cache insights per country with invalidation on write, and run the median through `percentile_cont`.
