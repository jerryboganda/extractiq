import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createProviderSchema, updateProviderSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('providers:read'), handlers.list);
router.post('/', authorize('providers:create'), validate(createProviderSchema), handlers.create);
router.get('/:id', authorize('providers:read'), handlers.getById);
router.patch('/:id', authorize('providers:update'), validate(updateProviderSchema), handlers.update);
router.delete('/:id', authorize('providers:delete'), handlers.remove);
router.post('/:id/test', authorize('providers:test'), handlers.test);
router.get('/:id/benchmarks', authorize('providers:read'), handlers.getBenchmarks);

export { router as providersRouter };
