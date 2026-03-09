import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/stats', handlers.getStats);
router.get('/sparklines', handlers.getSparklines);
router.get('/active-jobs', handlers.getActiveJobs);
router.get('/recent-activity', handlers.getRecentActivity);
router.get('/provider-health', handlers.getProviderHealth);

export { router as dashboardRouter };
