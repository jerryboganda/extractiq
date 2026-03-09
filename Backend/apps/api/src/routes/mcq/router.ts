import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateMcqRecordSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('mcq:read'), validate(paginationSchema, 'query'), handlers.list);
router.get('/:id', authorize('mcq:read'), handlers.getById);
router.patch('/:id', authorize('mcq:update'), validate(updateMcqRecordSchema), handlers.update);
router.delete('/:id', authorize('mcq:delete'), handlers.remove);
router.get('/:id/history', authorize('mcq:read'), handlers.getHistory);

export { router as mcqRouter };
