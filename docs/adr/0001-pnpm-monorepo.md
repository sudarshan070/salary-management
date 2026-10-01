# 0001. pnpm monorepo with a shared schema package

- **Status:** Accepted, 1 Oct 2026

## Context

The API and the web app must agree on request and response shapes. Two repos, or copied types, drift apart.

## Decision

One pnpm workspace with `apps/api`, `apps/web` and `packages/shared`. `packages/shared` holds Zod schemas and the types inferred from them; both apps import it as TypeScript source.

## Consequences

- One install, one CI run, one place to change a contract.
- The API build bundles the shared package (esbuild), because it ships as source.
- Nx or Turborepo were not needed for two apps; they can be added if build times grow.
