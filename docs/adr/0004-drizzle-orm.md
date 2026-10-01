# 0004. Drizzle ORM and drizzle-kit migrations

- **Status:** Accepted, 1 Oct 2026

## Context

We need typed queries, versioned schema migrations, and aggregates (min, max, average, median) that run in the database, not in JavaScript.

## Decision

Drizzle ORM with drizzle-kit. Queries read like SQL, are typed from the schema, and drop to raw SQL for window functions when needed. Migrations are plain SQL files committed to the repo.

## Consequences

- Only repositories import Drizzle; services stay database-agnostic.
- **Rejected:** Prisma (heavier client generation step and less direct control over aggregate SQL); raw SQL only (no type safety on results).
