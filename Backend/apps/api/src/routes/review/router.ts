import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { reviewEditSchema, reviewFlagSchema, reviewBulkSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/queue', authorize('review:read'), validate(paginationSchema, 'query'), handlers.listQueue);
router.get('/:id', authorize('review:read'), handlers.getDetail);
router.post('/:id/approve', authorize('review:approve'), handlers.approve);
router.post('/:id/reject', authorize('review:reject'), handlers.reject);
router.post('/:id/flag', authorize('review:flag'), validate(reviewFlagSchema), handlers.flag);
router.patch('/:id/edit', authorize('review:edit'), validate(reviewEditSchema), handlers.edit);
router.get('/:id/navigation', authorize('review:read'), handlers.navigation);
router.post('/bulk', authorize('review:approve'), validate(reviewBulkSchema), handlers.bulk);

export { router as reviewRouter };
