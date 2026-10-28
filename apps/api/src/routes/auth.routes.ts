import { Router } from 'express';
import { login, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { loginSchema, updateOwnerProfileSchema } from '@akfa/shared';
import { requireOwnerAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/profile', requireOwnerAuth, getProfile);
router.put('/profile', requireOwnerAuth, validateBody(updateOwnerProfileSchema), updateProfile);

export default router;
