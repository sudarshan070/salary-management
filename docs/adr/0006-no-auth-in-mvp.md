# 0006. No authentication in the MVP

- **Status:** Accepted, 1 Oct 2026

## Context

The brief names one persona (the HR Manager) and no access rules. Login, sessions and roles would take a large share of a 2-day budget without demonstrating the core problem.

## Decision

Ship without authentication and state it in the requirements as a deliberate omission.

## Consequences

- The deployed demo contains only generated data, never real salaries.
- All routes sit under `/api/v1` behind one Express app, so an auth middleware can be added in one place later (roadmap item 2).
