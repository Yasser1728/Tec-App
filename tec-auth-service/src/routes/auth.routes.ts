import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  registerValidation,
  loginValidation,
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, me);

export default router;
