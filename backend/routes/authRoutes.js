import express from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegistration, validateLoginData, handleValidationErrors } from '../utils/validators.js';

const router = express.Router();

router.post('/register', validateRegistration, handleValidationErrors, register);
router.post('/login', validateLoginData, handleValidationErrors, login);
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router;