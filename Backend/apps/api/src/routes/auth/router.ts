import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authRateLimiter } from '../../middleware/rate-limiter.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginSchema, registerSchema, changePasswordSchema, acceptInvitationSchema } from '@mcq-platform/shared-types';
import * as handlers from './handlers.js';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), handlers.register);
router.post('/login', authRateLimiter, validate(loginSchema), handlers.login);
router.get('/invitations/:token', handlers.getInvitation);
router.post('/accept-invitation', authRateLimiter, validate(acceptInvitationSchema), handlers.acceptInvitation);
router.post('/logout', authenticate, handlers.logout);
router.post('/refresh', handlers.refresh);
router.post('/change-password', authenticate, validate(changePasswordSchema), handlers.changePassword);
router.get('/me', authenticate, handlers.me);

export { router as authRouter };
