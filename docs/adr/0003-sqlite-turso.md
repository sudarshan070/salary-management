# 0003. SQLite locally, Turso in production

- **Status:** Accepted, 1 Oct 2026

## Context

The brief suggests a relational database such as SQLite. The free API host (Render) wipes its disk on every restart, so a SQLite file on the server would lose data.

## Decision

Use libSQL, SQLite's open-source fork, through `@libsql/client`: a local file (or in-memory database) in development and tests, and a hosted Turso database in production. Same SQL dialect, same driver, only the connection URL changes.

## Consequences

- Tests run against a real SQLite engine in memory: fast and deterministic.
- Production data persists on Turso's free plan (5 GB, 500M row reads per month).
- **Rejected:** PostgreSQL on a free tier (diverges from the brief's suggestion for no MVP benefit); a SQLite file on Render (data loss on restart).
- **Later:** a move to PostgreSQL is a new Drizzle schema plus repository implementation (see ADR 0004).
