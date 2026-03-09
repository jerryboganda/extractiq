import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createExportSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('export:read'), validate(paginationSchema, 'query'), handlers.list);
router.post('/', authorize('export:create'), validate(createExportSchema), handlers.create);
router.get('/:id', authorize('export:read'), handlers.getById);
router.get('/:id/download', authorize('export:download'), handlers.download);

export { router as exportRouter };
