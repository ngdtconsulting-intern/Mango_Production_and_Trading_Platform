import express from 'express';
import { register, login, getCurrentUser, updateProfile, logout, adminExists } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegistration, validateLoginData, handleValidationErrors } from '../utils/validators.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Limiters run before validation so malformed floods are counted too.
router.post('/register', registerLimiter, validateRegistration, handleValidationErrors, register);
router.post('/login', loginLimiter, validateLoginData, handleValidationErrors, login);
router.get('/me', protect, getCurrentUser);
router.get('/admin-exists', adminExists);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);

export default router;