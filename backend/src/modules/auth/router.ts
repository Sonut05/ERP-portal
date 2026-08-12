import { Router } from 'express';
import { login, getMe, updateProfile } from './controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { loginSchema, updateProfileSchema } from './schema';

const router = Router();

// POST /api/auth/login
router.post('/login', validate(loginSchema), login);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

// PUT /api/auth/profile
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
