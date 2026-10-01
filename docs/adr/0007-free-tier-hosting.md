# 0007. Vercel + Render + Turso free tiers

- **Status:** Accepted, 1 Oct 2026

## Context

The assessment must be deployed at zero cost; paid hosting comes only if this becomes a product.

## Decision

| Part     | Host                    | Why                                                |
| -------- | ----------------------- | -------------------------------------------------- |
| Web      | Vercel Hobby            | Static Vite build, global CDN, deploy per push     |
| API      | Render free web service | Runs a normal long-lived Node process; 750 h/month |
| Database | Turso free plan         | Hosted SQLite that persists across API restarts    |

## Consequences

- The API sleeps after 15 minutes idle and takes about a minute to wake. The UI says so, and the README warns reviewers.
- **Rejected:** Fly.io and Koyeb (no free plan for new users), Railway (trial expires after 30 days).
- **Upgrade path:** Render Starter (always on), Turso Developer ($4.99/month) or PostgreSQL, Vercel Pro for commercial use.
