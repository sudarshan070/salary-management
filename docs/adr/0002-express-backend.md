# 0002. Express 5 for the API

- **Status:** Accepted, 1 Oct 2026

## Context

The role is Node/TypeScript. The assessment has a 2-day deadline and rewards judgment over complexity. Candidates were Express, Fastify and NestJS.

## Decision

Express 5. It is the most widely known Node framework, needs the least setup, and version 5 passes rejected promises from async handlers to the error middleware without wrappers.

## Consequences

- Structure is not imposed by the framework, so it is enforced by convention: router → controller → service → repository per module (see `CLAUDE.md`).
- Validation and OpenAPI come from Zod plus small middleware rather than built-in schemas.
- **Rejected:** NestJS (modules, DI and decorators cost setup time the deadline can't afford); Fastify (strong option, but less familiar to most reviewers and contributors, so a higher delivery risk here).
