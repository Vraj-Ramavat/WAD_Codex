import { Router } from 'express';
import { analyzeRepo, processJob, getStatus } from '../controllers/repos.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';

const router = Router();

router.post('/analyze', rateLimit(20, 60), requireAuth, analyzeRepo);
router.get('/analyze', rateLimit(20, 60), requireAuth, analyzeRepo);
router.post('/process-job', rateLimit(20, 60), requireAuth, processJob);
router.get('/status', rateLimit(60, 60), requireAuth, getStatus);

export default router;
