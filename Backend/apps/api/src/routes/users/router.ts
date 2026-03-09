import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { inviteUserSchema, updateUserSchema, paginationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize('users:list'), validate(paginationSchema, 'query'), handlers.list);
router.post('/invite', authorize('users:invite'), validate(inviteUserSchema), handlers.invite);
router.patch('/:id', authorize('users:update_role'), validate(updateUserSchema), handlers.update);
router.delete('/:id', authorize('users:deactivate'), handlers.deactivate);

export { router as usersRouter };
