import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { getDb, schema } from '../db/index.js';
import { parseGitHubUrl, fetchGitHubRepoDetails } from './github.service.js';
import { buildFeaturedRepoFromRawData } from './mlScorer.service.js';
import { extractImportPaths, resolveDependencyIds } from './dependencyParser.service.js';
import { inMemoryJobs, inMemoryRepos, AnalysisJob } from './jobStore.service.js';

const CACHE_TTL_HOURS = 6;
const STALE_JOB_MINUTES = 10;

type Stage = 'validate' | 'cache_lookup' | 'fetch_github' | 'score' | 'db_persist' | 'completed';
type Database = NonNullable<ReturnType<typeof getDb>>;

interface JobUpdate {
  status: AnalysisJob['status'];
  progress: number;
  stageMessage: string;
  resultRepoId?: string;
  errorMessage?: string;
  resultData?: any;
}

export interface AnalysisResult {
  jobId: string;
  repoId: string;
  data: any;
  cached: boolean;
}

function redactSecrets(value: string): string {
  const secrets = [process.env.DATABASE_URL, process.env.GITHUB_TOKEN, process.env.JWT_SECRET]
    .filter((value): value is string => Boolean(value));
  return secrets.reduce((redacted, secret) => redacted.split(secret).join('[REDACTED]'), value);
}

function describeError(error: unknown): string {
  return redactSecrets(error instanceof Error ? error.message : String(error));
}

function errorType(error: unknown, stage: Stage):
  'github_api' | 'rate_limit' | 'parsing' | 'db_write' | 'auth' | 'timeout' | 'network' | 'unknown' {
  const message = describeError(error).toLowerCase();
  if (/rate.limit|429|403/.test(message)) return 'rate_limit';
  if (/timeout|timed out|deadline/.test(message)) return 'timeout';
  if (/enotfound|econn|network|fetch failed|socket/.test(message)) return 'network';
  if (stage === 'db_persist' || stage === 'cache_lookup') return 'db_write';
  if (stage === 'fetch_github') return 'github_api';
  if (stage === 'validate' || stage === 'score') return 'parsing';
  return 'unknown';
}

async function setJob(db: Database | null, jobId: string, update: JobUpdate): Promise<void> {
  if (db) {
    await db.update(schema.analysisJobs).set({
      status: update.status,
      progress: update.progress,
      stageMessage: update.stageMessage,
      resultRepoId: update.resultRepoId ?? null,
      errorMessage: update.errorMessage ?? null,
      updatedAt: new Date(),
    }).where(eq(schema.analysisJobs.id, jobId));
  } else {
    const job = inMemoryJobs.get(jobId);
    if (job) Object.assign(job, update);
  }
}

async function recordFailure(
  db: Database | null,
  args: { repoUrl: string; repoId: string | null; jobId: string; stage: Stage; error: unknown },
): Promise<void> {
  const message = describeError(args.error);
  console.error(`Repository analysis failed (${args.stage}, job ${args.jobId}):`, message);
  if (!db) return;

  // A failed analysis may not have created a repo row; avoid violating repo_errors.repo_id FK.
  let linkedRepoId: string | null = null;
  if (args.repoId) {
    try {
      const [existing] = await db.select({ id: schema.repos.id })
        .from(schema.repos).where(eq(schema.repos.id, args.repoId)).limit(1);
      linkedRepoId = existing?.id ?? null;
    } catch (lookupError) {
      console.error('Could not resolve repository for error log:', lookupError);
    }
  }

  try {
    await db.insert(schema.repoErrors).values({
      repoId: linkedRepoId,
      jobId: args.jobId,
      repoUrl: args.repoUrl,
      errorType: errorType(args.error, args.stage),
      severity: 'error',
      stage: args.stage,
      message: message.slice(0, 4000),
      stackTrace: args.error instanceof Error ? redactSecrets(args.error.stack || '').slice(0, 12000) : undefined,
    });
  } catch (loggingError) {
    // Error logging must never hide the original analysis failure.
    console.error('Could not persist repository error:', loggingError);
  }
}

async function findValidCache(db: Database, repoId: string): Promise<any | null> {
  const [entry] = await db.select().from(schema.analysisCache)
    .where(eq(schema.analysisCache.repoId, repoId))
    .orderBy(desc(schema.analysisCache.cachedAt)).limit(1);
  if (!entry) return null;
  const age = Date.now() - new Date(entry.cachedAt).getTime();
  if (age < 0 || age >= entry.ttlHours * 60 * 60 * 1000) return null;
  const [repo] = await db.select().from(schema.repos)
    .where(eq(schema.repos.id, repoId)).limit(1);
  return repo?.rawAnalysisJson ?? null;
}

async function refreshCache(db: Database, repoId: string): Promise<void> {
  const [entry] = await db.select({ id: schema.analysisCache.id })
    .from(schema.analysisCache).where(eq(schema.analysisCache.repoId, repoId))
    .orderBy(desc(schema.analysisCache.cachedAt)).limit(1);
  if (entry) {
    await db.update(schema.analysisCache).set({
      cachedAt: new Date(),
      ttlHours: CACHE_TTL_HOURS,
    }).where(eq(schema.analysisCache.id, entry.id));
  } else {
    await db.insert(schema.analysisCache).values({
      repoId,
      cachedAt: new Date(),
      ttlHours: CACHE_TTL_HOURS,
    });
  }
}

/**
 * Runs the full analysis within the request. Do not detach this with a promise:
 * Vercel serverless executions may be frozen when a response is returned.
 */
export async function runRepoAnalysis(rawUrl: string, userId?: string): Promise<AnalysisResult> {
  const db = getDb();
  const jobId = randomUUID();
  let repoId: string | null = null;
  let stage: Stage = 'validate';
  let jobCreated = false;

  try {
    if (db) {
      await db.insert(schema.analysisJobs).values({
        id: jobId,
        repoUrl: rawUrl,
        userId: userId || null,
        status: 'pending',
        progress: 5,
        stageMessage: 'Repository analysis queued',
      });
    } else {
      inMemoryJobs.set(jobId, {
        id: jobId, repoUrl: rawUrl, status: 'pending', progress: 5,
        stageMessage: 'Repository analysis queued', createdAt: Date.now(),
      });
    }
    jobCreated = true;

    const { owner, repo } = parseGitHubUrl(rawUrl);
    repoId = `${owner}/${repo}`.toLowerCase();
    stage = 'cache_lookup';
    await setJob(db, jobId, {
      status: 'running', progress: 15, stageMessage: 'Checking repository analysis cache',
    });

    if (db) {
      const cachedData = await findValidCache(db, repoId);
      if (cachedData) {
        await setJob(db, jobId, {
          status: 'done', progress: 100, stageMessage: 'Cached analysis ready', resultRepoId: repoId,
        });
        return { jobId, repoId, data: cachedData, cached: true };
      }
    } else if (inMemoryRepos.has(repoId)) {
      const data = inMemoryRepos.get(repoId);
      await setJob(null, jobId, {
        status: 'done', progress: 100, stageMessage: 'Cached analysis ready',
        resultRepoId: repoId, resultData: data,
      });
      return { jobId, repoId, data, cached: true };
    }

    stage = 'fetch_github';
    await setJob(db, jobId, {
      status: 'running', progress: 30, stageMessage: 'Fetching GitHub repository metadata',
    });
    const rawData = await fetchGitHubRepoDetails(owner, repo);

    stage = 'score';
    await setJob(db, jobId, {
      status: 'running', progress: 65, stageMessage: 'Building repository metrics and file map',
    });
    const featuredRepo = buildFeaturedRepoFromRawData(
      owner, repo, rawData.meta, rawData.treeItems, rawData.commits, rawData.contributors,
    );

    // Preserve the current dependency-mapping output used by the 3D frontend.
    const pathToIdMap = new Map<string, string>();
    for (const folder of featuredRepo.folders) {
      for (const file of folder.files) pathToIdMap.set(file.path, file.id);
    }
    for (const folder of featuredRepo.folders) {
      for (const file of folder.files) {
        if (['.ts', '.tsx', '.js', '.jsx'].some((ext) => file.path.endsWith(ext))) {
          const simulatedContent = `import React from 'react'; import './${folder.name}';`;
          const rawImports = extractImportPaths(simulatedContent);
          file.dependencies = resolveDependencyIds(file.path, rawImports, pathToIdMap);
        }
      }
    }

    stage = 'db_persist';
    await setJob(db, jobId, {
      status: 'running', progress: 85, stageMessage: 'Saving repository and refreshing cache',
    });
    if (db) {
      await db.insert(schema.repos).values({
        id: repoId,
        githubFullName: `${owner}/${repo}`,
        url: `https://github.com/${owner}/${repo}`,
        stars: featuredRepo.stars,
        forks: featuredRepo.forks,
        healthScore: featuredRepo.healthScore,
        riskScore: featuredRepo.riskScore,
        description: featuredRepo.description,
        analyzedBy: userId || null,
        rawAnalysisJson: featuredRepo,
      }).onConflictDoUpdate({
        target: schema.repos.id,
        set: {
          rawAnalysisJson: featuredRepo,
          healthScore: featuredRepo.healthScore,
          riskScore: featuredRepo.riskScore,
          stars: featuredRepo.stars,
          forks: featuredRepo.forks,
        },
      });
      await refreshCache(db, repoId);
    } else {
      inMemoryRepos.set(repoId, featuredRepo);
    }

    stage = 'completed';
    await setJob(db, jobId, {
      status: 'done', progress: 100, stageMessage: 'Repository analysis complete',
      resultRepoId: repoId, resultData: featuredRepo,
    });
    return { jobId, repoId, data: featuredRepo, cached: false };
  } catch (error) {
    const message = describeError(error);
    if (jobCreated) {
      try {
        await setJob(db, jobId, {
          status: 'failed', progress: 100, stageMessage: `Failed during ${stage}`,
          errorMessage: message.slice(0, 4000),
        });
      } catch (updateError) {
        console.error('Could not mark analysis job as failed:', updateError);
      }
    }
    await recordFailure(db, { repoUrl: rawUrl, repoId, jobId, stage, error });
    throw error;
  }
}

export async function readJobStatus(jobId: string, userId?: string) {
  const db = getDb();
  // Legacy local jobs were non-UUID strings. Never pass them into a PostgreSQL UUID lookup.
  const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
  if (db && validUuid) {
    const [job] = await db.select().from(schema.analysisJobs)
      .where(eq(schema.analysisJobs.id, jobId)).limit(1);
    if (!job || (job.userId && job.userId !== userId)) return null;

    // A process termination may leave a row in 'pending' / 'running'. Detect that on poll.
    if ((job.status === 'pending' || job.status === 'running') &&
        Date.now() - new Date(job.updatedAt).getTime() > STALE_JOB_MINUTES * 60 * 1000) {
      const message = 'Analysis execution was interrupted or exceeded its time limit. Please retry.';
      await setJob(db, jobId, {
        status: 'failed', progress: job.progress, stageMessage: 'Analysis interrupted',
        errorMessage: message,
      });
      await recordFailure(db, {
        repoUrl: job.repoUrl, repoId: job.resultRepoId, jobId,
        stage: 'fetch_github', error: new Error(message),
      });
      return { jobId, status: 'failed', progress: job.progress,
        stageMessage: 'Analysis interrupted', resultRepoId: job.resultRepoId,
        error: message };
    }

    let data: any;
    if (job.status === 'done' && job.resultRepoId) {
      const [repo] = await db.select({ data: schema.repos.rawAnalysisJson })
        .from(schema.repos).where(eq(schema.repos.id, job.resultRepoId)).limit(1);
      data = repo?.data;
    }
    return { jobId: job.id, status: job.status, progress: job.progress,
      stageMessage: job.stageMessage, resultRepoId: job.resultRepoId,
      data, error: job.errorMessage };
  }

  if (db) return null;
  const job = inMemoryJobs.get(jobId);
  if (!job) return null;
  return { jobId: job.id, status: job.status, progress: job.progress,
    stageMessage: job.stageMessage, resultRepoId: job.resultRepoId,
    data: job.resultData, error: job.errorMessage };
}
