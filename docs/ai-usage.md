# AI usage log

How AI tools were used to build this project, what was accepted, and what was changed or rejected. Updated as the work progresses.

## Tools

| Tool                      | Used for                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| Claude (Cowork, agentic)  | Research of hosting free tiers, planning, scaffolding, test-case ideas, docs drafts, review passes |
| `CLAUDE.md` / `AGENTS.md` | Standing instructions so every agent follows the same architecture and testing rules               |

## Principles

- The engineer decides scope, domain rules, schema and API shape; AI proposes and drafts.
- Every AI-generated change is read, run and tested before it is committed.
- Commits written with AI help carry a `Co-Authored-By` trailer, so the history shows it honestly.

## Log

| Step                 | Prompt (summary)                                                                       | Outcome                                                                                 | Human decision                                                                                                                                                                                                                           |
| -------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clarifying questions | "Read the brief and email; which questions should we ask the team?"                    | Draft of 8 questions                                                                    | Cut to 6: questions about which insights to build and Excel import were product decisions we should make ourselves, not ask about                                                                                                        |
| Stack research       | "Compare free hosting for a Node API with SQLite"                                      | Found Render's free disk is ephemeral; Fly.io and Koyeb have no free tier for new users | Chose Render + Turso (hosted SQLite) + Vercel                                                                                                                                                                                            |
| Framework choice     | "Fastify vs NestJS vs Express for a 2-day build"                                       | Fastify suggested first                                                                 | Rejected for submission risk; chose Express 5 (most familiar, least setup)                                                                                                                                                               |
| Plan review          | "Compare the plan with every requirement in the brief"                                 | 37 of 42 covered; 5 gaps                                                                | Added: requirements committed first, `docs/plan.md`, commit rules, interview notes, submission checklist                                                                                                                                 |
| Dependency versions  | "Pick versions for the toolchain"                                                      | Latest majors (TypeScript 7, Vite 8, ESLint 10) available                               | Pinned the previous, widely used majors (TypeScript 5.9, Vite 7, ESLint 9, Vitest 3) to avoid early-adopter breakage                                                                                                                     |
| Day 1 scaffold       | "Scaffold the monorepo, a tested health endpoint and a web page that shows API status" | Workspace, Express app, React app, CI, Render and Vercel configs                        | Tests written and committed before each implementation; production API bundled with esbuild so the TypeScript shared package needs no separate build; Husky pre-commit hooks dropped to keep setup minimal (CI enforces the same checks) |
