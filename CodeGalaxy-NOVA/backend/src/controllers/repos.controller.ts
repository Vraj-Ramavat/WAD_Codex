import { Response } from 'express';
import { eq } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getDb, schema } from '../db/index.js';
import { inMemoryRepos } from '../services/jobStore.service.js';
import { readJobStatus, runRepoAnalysis } from '../services/analysis.service.js';

function repositoryUrl(req: AuthenticatedRequest): string | undefined {
  const value = req.body?.url || req.body?.repoUrl || req.query?.url || req.query?.repoUrl;
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function analyzeRepo(req: AuthenticatedRequest, res: Response) {
  const rawUrl = repositoryUrl(req);
  if (!rawUrl) return res.status(400).json({ error: 'Repository URL is required.' });

  try {
    const result = await runRepoAnalysis(rawUrl, req.user?.userId);
    return res.status(200).json({
      status: result.cached ? 'cached' : 'completed',
      jobId: result.jobId,
      repoId: result.repoId,
      data: result.data,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to analyze repository.' });
  }
}

/**
 * Performs analysis during the HTTP request, then returns a persisted job ID.
 * A detached fire-and-forget task is unreliable on Vercel serverless functions.
 */
export async function processJob(req: AuthenticatedRequest, res: Response) {
  const rawUrl = repositoryUrl(req);
  if (!rawUrl) return res.status(400).json({ error: 'Repository URL is required.' });

  try {
    const result = await runRepoAnalysis(rawUrl, req.user?.userId);
    return res.status(200).json({
      jobId: result.jobId,
      status: 'done',
      resultRepoId: result.repoId,
      data: result.data,
      message: result.cached ? 'Cached analysis ready.' : 'Analysis completed successfully.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to process job.' });
  }
}

export async function getStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const jobId = typeof req.query.jobId === 'string' ? req.query.jobId : undefined;
    const repoId = typeof req.query.repoId === 'string' ? req.query.repoId : undefined;

    if (jobId) {
      const job = await readJobStatus(jobId, req.user?.userId);
      if (!job) return res.status(404).json({ error: 'Job not found.' });
      return res.status(200).json(job);
    }

    if (repoId) {
      const normalized = repoId.toLowerCase();
      const db = getDb();
      if (db) {
        const [found] = await db.select().from(schema.repos)
          .where(eq(schema.repos.id, normalized)).limit(1);
        if (found) return res.status(200).json({
          status: 'done', repoId: found.id, data: found.rawAnalysisJson,
        });
      }
      if (inMemoryRepos.has(normalized)) return res.status(200).json({
        status: 'done', repoId: normalized, data: inMemoryRepos.get(normalized),
      });
      return res.status(404).json({ error: `Repository "${repoId}" not found in cache.` });
    }

    return res.status(400).json({ error: 'Please provide either jobId or repoId query parameter.' });
  } catch (error: any) {
    console.error('Get status error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get status.' });
  }
}
