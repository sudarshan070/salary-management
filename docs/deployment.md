# Deployment

Three free services: **Vercel** (web), **Render** (API), **Turso** (database). Every push to `main` redeploys the web app and the API automatically once they are connected to the GitHub repo.

| Part     | Service                 | URL (fill in after first deploy)                                               |
| -------- | ----------------------- | ------------------------------------------------------------------------------ |
| Web      | Vercel Hobby            | https://e-salary-management.vercel.app                                         |
| API      | Render free web service | https://salary-api-vdsd.onrender.com                                           |
| Database | Turso free plan         | `libsql://salary-management-sudarshan070.aws-ap-south-1.turso.io` (AWS Mumbai) |

> The free Render instance sleeps after 15 minutes without traffic and needs about a minute to wake. The first request after a pause is slow; the web app shows a waking-up message meanwhile.

## 1. API on Render

1. Sign in to [Render](https://render.com) with GitHub.
2. **New → Blueprint**, pick this repository. Render reads `render.yaml` and proposes the `salary-api` service on the free plan.
3. When asked for `CORS_ORIGIN`, enter `*` for now (it is tightened in step 3 below).
4. Create. The first build takes a few minutes. Check `https://<service>.onrender.com/health` returns `{"status":"ok",...}`.

What the blueprint does: installs with pnpm, bundles the API with esbuild (`apps/api/build.mjs`), starts `node apps/api/dist/server.js`, and uses `/health` as the health check.

## 2. Web on Vercel

1. Sign in to [Vercel](https://vercel.com) with GitHub, **Add New → Project**, import this repository.
2. Set **Root Directory** to `apps/web`. Vercel detects Vite and pnpm; `apps/web/vercel.json` sets the build and SPA routing.
3. Add the environment variable `VITE_API_URL` = the Render URL from step 1 (no trailing slash), for Production. **Required:** without it the app calls Vercel itself and shows a configuration banner. Vite bakes the value in at build time, so after adding or changing it, **Redeploy** (Deployments → ⋯ → Redeploy).
4. Deploy. The home page should say "API is up (v0.1.0)".

## 3. Lock down CORS

In Render → `salary-api` → **Environment**, set `CORS_ORIGIN` to the Vercel URL (`https://e-salary-management.vercel.app`, no trailing slash) and save. Render redeploys automatically.

## 4. Database on Turso (needed from Day 1 afternoon)

1. Sign up at [Turso](https://turso.tech) and create a database (for example `salary-management`) in the region closest to the Render region (the blueprint uses Singapore).
2. Copy the database URL (`libsql://...`) and create a database token.
3. In Render → **Environment**, add `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.
4. On its first start the API runs the migrations and, with `SEED_IF_EMPTY=true` (set in `render.yaml`), seeds the 10,000 employees into the empty Turso database. Nothing to run by hand.

To work against Turso from your machine, keep its credentials in `apps/api/.env.turso` (git-ignored) and pass the file explicitly, for example `cd apps/api && node --env-file=.env.turso --import tsx src/scripts/migrate.ts` (the seed script replaces all employees, so run it against Turso only on purpose). Keep them out of `apps/api/.env`: that file is loaded by `pnpm dev`, and local development should never write to production data.

## Environment variables

| Variable              | Where              | Example                                    | Purpose                                                        |
| --------------------- | ------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| `PORT`                | Render (automatic) | `10000`                                    | Port the API listens on                                        |
| `CORS_ORIGIN`         | Render             | `https://salary-management.vercel.app`     | Browser origin allowed to call the API                         |
| `APP_VERSION`         | Render (optional)  | `0.1.0`                                    | Shown by `/health`                                             |
| `DATABASE_URL`        | Render             | `libsql://salary-management-acme.turso.io` | Turso database                                                 |
| `DATABASE_AUTH_TOKEN` | Render             | (secret)                                   | Turso access token                                             |
| `VITE_API_URL`        | Vercel             | `https://salary-api-vdsd.onrender.com`     | API base URL baked into the web build; redeploy after changing |

## Rollback

- **Vercel:** Deployments → pick the last good deployment → **Promote to Production**.
- **Render:** Events → pick the last good deploy → **Rollback**.
