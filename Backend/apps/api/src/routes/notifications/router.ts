import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as handlers from './handlers.js';

const router = Router();
router.use(authenticate);

router.get('/', handlers.list);
router.patch('/:id/read', handlers.markRead);
router.post('/read-all', handlers.markAllRead);

export { router as notificationsRouter };
