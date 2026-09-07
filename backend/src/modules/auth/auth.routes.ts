import { Router } from 'express';
import {
  login,
  logout,
  register,
  refresh,
  getMe,
  forgotPassword,
  resetPassword,
} from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { strictRateLimit } from '../../middleware/rateLimit';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

const router = Router();

router.post('/register', strictRateLimit({ max: 10 }), validate(registerSchema), register);
router.post('/login', strictRateLimit({ max: 10 }), validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', validate(logoutSchema), logout);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/me', getMe);

export default router;