import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createProjectSchema, updateProjectSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('projects:read'), validate(paginationSchema, 'query'), handlers.list);
router.post('/', authorize('projects:create'), validate(createProjectSchema), handlers.create);
router.get('/:id', authorize('projects:read'), handlers.getById);
router.patch('/:id', authorize('projects:update'), validate(updateProjectSchema), handlers.update);
router.delete('/:id', authorize('projects:delete'), handlers.remove);

export { router as projectsRouter };
