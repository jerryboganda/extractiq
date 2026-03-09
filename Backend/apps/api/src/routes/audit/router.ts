import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('audit:read'), validate(paginationSchema, 'query'), handlers.list);

export { router as auditRouter };
