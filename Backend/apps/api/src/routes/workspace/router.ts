import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { updateWorkspaceSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('workspace:read'), handlers.get);
router.patch('/', authorize('workspace:update'), validate(updateWorkspaceSchema), handlers.update);
router.get('/usage', authorize('workspace:read'), handlers.usage);

export { router as workspaceRouter };
