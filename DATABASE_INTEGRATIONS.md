# Persistent repository analysis storage

CodeGalaxy NOVA implements all three existing PostgreSQL tables using the already-defined Drizzle schema. No changes to React, CSS, WebGL, planets, animations, or frontend request paths are required.

## Tables and behavior

| Table | What creates or updates a record? |
| --- | --- |
| `analysis_jobs` | Every authorized analysis request creates a UUID job, updates progress/stage, and persists completion or failure. |
| `analysis_cache` | A successful fresh repository analysis inserts or refreshes a six-hour TTL record; subsequent analyses use the saved `repos.raw_analysis_json` while TTL remains valid. |
| `repo_errors` | A failed analysis records repository URL, job ID, stage, classified error, optional stack trace, and severity. Successful analyses do not create error rows. |
| `repos` | Holds the last successful repository analysis JSON as before. |
| `users` | Authentication behavior is unchanged. |

`POST /api/repos/analyze` continues returning `status: "completed"` or `"cached"`, `repoId` and `data`, now with a `jobId`. The frontend needs no change.

`POST /api/repos/process-job` now processes the analysis **within the HTTP request** and responds with HTTP 200, `status: "done"`, `jobId` and result data. This replaces the previous unreliable fire-and-forget task, which could be interrupted when Vercel suspends an invocation. This endpoint is not a durable background queue. Long GitHub analyses remain subject to function duration limits.

`GET /api/repos/status?jobId=<uuid>` retrieves durable job status and result data from PostgreSQL. It also marks incomplete jobs older than ten minutes as interrupted and logs the timeout. Job status is visible only to the requesting account when an owner is recorded.

If `DATABASE_URL` is missing, the in-memory fallback remains available for local development, but is not persistent on Vercel. If PostgreSQL itself is unavailable, error logging can only reach the Vercel function logs (not the unavailable database).

## Neon schema and verification

This change **reuses the existing five tables**. Verify they exist in the same Neon branch pointed to by the Vercel Production `DATABASE_URL`. If any are missing, review the schema changes from `CodeGalaxy-NOVA/backend` before running:

```bash
npm run db:push
```

After a successful analysis of a public GitHub repository, run in Neon SQL Editor:

```sql
SELECT id, repo_url, status, progress, result_repo_id, error_message, created_at
FROM analysis_jobs ORDER BY created_at DESC LIMIT 10;

SELECT repo_id, cached_at, ttl_hours
FROM analysis_cache ORDER BY cached_at DESC LIMIT 10;

SELECT repo_url, job_id, error_type, stage, message, created_at
FROM repo_errors ORDER BY created_at DESC LIMIT 10;
```

Expected: `analysis_jobs` has a `done` row; `analysis_cache` has a row with `ttl_hours = 6`; `repo_errors` remains empty unless a request fails.

A repository cached before this feature existed will initially be reanalyzed to populate `analysis_cache`. Later requests within six hours will use the cache. Existing `repos` data is not deleted.

## Deployment

Pull `main` from GitHub and deploy manually via `vercel --prod`. GitHub is not connected for automatic Vercel deployments. Test the API, authentication, and a small repository analysis, then run the SQL queries above.

The GitHub Actions build checks do **not** test an authenticated production Neon connection or integration behavior; perform the production smoke tests before relying on the result.
