import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createJobSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('jobs:read'), validate(paginationSchema, 'query'), handlers.list);
router.post('/', authorize('jobs:create'), validate(createJobSchema), handlers.create);
router.get('/:id', authorize('jobs:read'), handlers.getById);
router.post('/:id/cancel', authorize('jobs:cancel'), handlers.cancel);
router.post('/:id/retry', authorize('jobs:retry'), handlers.retry);

export { router as jobsRouter };
