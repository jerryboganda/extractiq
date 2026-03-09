import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { presignUploadSchema, completeUploadSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('documents:read'), validate(paginationSchema, 'query'), handlers.list);
router.post('/presign', authorize('documents:upload'), validate(presignUploadSchema), handlers.presignUpload);
router.post('/complete', authorize('documents:upload'), validate(completeUploadSchema), handlers.completeUpload);
router.get('/:id', authorize('documents:read'), handlers.getById);
router.delete('/:id', authorize('documents:delete'), handlers.remove);

export { router as documentsRouter };
