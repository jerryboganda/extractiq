import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { rateLimiter } from '../../middleware/rate-limiter.js';
import { publicDemoRequestSchema, publicContactRequestSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();

router.post('/demo-request', rateLimiter, validate(publicDemoRequestSchema), handlers.submitDemoRequest);
router.post('/contact-request', rateLimiter, validate(publicContactRequestSchema), handlers.submitContactRequest);

export { router as publicRouter };
