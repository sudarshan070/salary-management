# Architecture Decision Records

Short records of decisions that shape the codebase: the context, what was chosen, what was given up. New decisions get the next number; a reversed decision is marked "Superseded" rather than deleted.

| #                                   | Decision                                               |
| ----------------------------------- | ------------------------------------------------------ |
| [0001](./0001-pnpm-monorepo.md)     | pnpm monorepo with a shared schema package             |
| [0002](./0002-express-backend.md)   | Express 5 for the API                                  |
| [0003](./0003-sqlite-turso.md)      | SQLite locally, Turso in production                    |
| [0004](./0004-drizzle-orm.md)       | Drizzle ORM and drizzle-kit migrations                 |
| [0005](./0005-money-as-integers.md) | Salaries stored as integer minor units, local currency |
| [0006](./0006-no-auth-in-mvp.md)    | No authentication in the MVP                           |
| [0007](./0007-free-tier-hosting.md) | Vercel + Render + Turso free tiers                     |
