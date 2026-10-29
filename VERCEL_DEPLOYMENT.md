# CodeGalaxy NOVA — Vercel Services deployment

This repository uses a single [Vercel Services](https://vercel.com/docs/services) project for its Vite/React frontend and Express/TypeScript backend.

## Project configuration

In the Vercel dashboard, import this repository, set the **Root Directory to the Git repository root**, and select **Services** as the project's **Framework Preset**. The root `vercel.json` defines the individual build roots.

| Service | Root | Framework | Public URL paths |
| --- | --- | --- | --- |
| `frontend` | `CodeGalaxy-NOVA/frontend` | Vite | `/*`, except `/api/*` |
| `backend` | `CodeGalaxy-NOVA/backend` | Express | `/api/*` |

Top-level rewrites are evaluated in order. Vercel forwards the original path to the selected service, so `/api/health`, `/api/auth/*` and `/api/repos/*` match Express routes unchanged. The frontend service has its own fallback rewrite to `/index.html` so refreshing React Router paths such as `/dashboard` and `/solar-system` works.

## Why there are no service bindings

There are **no server-to-server calls between these services**. The Vite frontend runs in the user's browser and calls same-origin relative URLs such as `fetch('/api/auth/me')`. These requests use the public `/api/*` routing rule, not an internal service URL. Vercel service bindings are available only in server-side functions at runtime, not browser JavaScript. The Express backend talks to GitHub's REST API and Neon PostgreSQL; it does not call the frontend service. Adding a binding without a server-side consumer would be misleading.

If you later introduce a server-side frontend or gateway, declare a binding on that calling service and read its injected URL at runtime instead of hard-coding a host.

## Application compatibility

- `backend/src/server.ts` **exports `app` as default** for Vercel's Express runtime.
- The same file invokes `app.listen` only when `process.env.VERCEL` is absent, keeping `tsx watch` and standalone local development functional.
- `frontend/src/lib/api.js` already uses **relative `/api` URLs** by default: no frontend API code change is necessary.
- The development Vite config proxies `/api` to `127.0.0.1:5000`; this local-only proxy is not part of the deployed Vite bundle.
- Don't set `VITE_API_BASE_URL` to localhost or a Vercel internal binding URL.

## Environment variables

Set environment variables in the **Vercel project settings**, not in GitHub:

| Variable | Recommendation | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | **Required for reliable production use** | Neon PostgreSQL; persistent users and saved repository analyses |
| `JWT_SECRET` | **Required for secure production use** | Long, unique, unpredictable JWT signing secret |
| `GITHUB_TOKEN` | Optional but recommended | Higher authenticated GitHub REST API rate limits |
| `FRONTEND_URL` | Only for a separate custom frontend origin | Additional Express CORS allowlist entry |
| `NODE_ENV` | Production | Enables secure cookie setting when deployed |
| `VITE_API_BASE_URL` | **Leave unset** | Browser requests must use same-origin `/api` |
| `BACKEND_INTERNAL_URL` | **Do not set** | No server-side caller or binding exists |

Never commit a real `.env`, database password, JWT secret, or GitHub token.

## Database preparation

Five Drizzle PostgreSQL tables are defined. The deployed code currently uses `users` and `repos` as persistent database tables; analysis jobs remain in-memory. Create/check the schema in your real Neon database **before** accepting users:

```bash
cd CodeGalaxy-NOVA/backend
npm ci
npm run db:push
```

Read the schema-change plan before applying anything to an existing database. A local `backend/.env` is not automatically available to Vercel: copy the values securely into Vercel's project environment settings.

## Testing locally

From the **Git repository root**, run `vercel dev` after linking your Vercel project. Alternatively, use `vercel dev -L` for local-only testing where supported. The existing separate-server development workflow remains available:

```bash
cd CodeGalaxy-NOVA
npm run dev:backend
# in another terminal:
npm run dev:frontend
```

## Deployment smoke tests

1. Open `/api/health`, confirm a JSON health response.
2. Load `/`, `/login`, `/solar-system`, `/observatory` directly and refresh each page.
3. Confirm `/textures/earth.jpg` and other frontend assets load correctly.
4. Sign up/log in with a **test** account, and verify persistence in Neon `users`.
5. Analyze a small public repository; confirm a `repos` row is saved.
6. Refresh the site and check the last analyzed repository in the same browser.
7. Check commit playback, planet textures, the interactive galaxy, and the Observatory for browser errors.

The GitHub Actions workflow verifies TypeScript and Vite **builds**. It does **not** verify Vercel runtime integration or browser WebGL behavior.

## Operational limitations

- `/api/repos/process-job` launches a fire-and-forget in-memory job after returning a response. **This isn't a durable Vercel background queue.** Prefer the synchronous analysis route and review function-duration limits.
- Without `DATABASE_URL`, users and cached repository results live only in server process memory and will not persist reliably between serverless invocations.
- The current backend's rate limiter is in-process and not shared between instances.
- The current CORS policy accepts `*.vercel.app`; restrict it if needed before a public launch.
- A successful deployment does not imply the database tables exist, real-time GitHub analysis completes within function limits, or all SPA routes and 3D interactions work.

Docs: [Vercel Services](https://vercel.com/docs/services) · [Vercel Node backends](https://vercel.com/docs/frameworks/backend/express)
