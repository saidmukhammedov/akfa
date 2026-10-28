import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
  setup,
  checkSetupStatus,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { loginSchema, updateOwnerProfileSchema } from '@akfa/shared';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.get('/status', checkSetupStatus);
router.post('/setup', authRateLimiter, setup);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/profile', requireOwnerAuth, getProfile);
router.put('/profile', requireOwnerAuth, validateBody(updateOwnerProfileSchema), updateProfile);

export default router;
