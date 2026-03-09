import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { dateRangeSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/time-series', authorize('analytics:read'), validate(dateRangeSchema, 'query'), handlers.timeSeries);
router.get('/confidence-distribution', authorize('analytics:read'), handlers.confidenceDistribution);
router.get('/provider-comparison', authorize('analytics:read'), handlers.providerComparison);
router.get('/processing-time', authorize('analytics:read'), validate(dateRangeSchema, 'query'), handlers.processingTime);
router.get('/cost-breakdown', authorize('analytics:read'), validate(dateRangeSchema, 'query'), handlers.costBreakdown);
router.get('/summary', authorize('analytics:read'), handlers.summary);

export { router as analyticsRouter };
