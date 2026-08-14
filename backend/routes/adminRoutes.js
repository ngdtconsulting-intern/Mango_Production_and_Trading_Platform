import express from 'express';
import { getDashboardStats, getUserManagement, toggleUserStatus, getAnalyticsReport, getUserDetails, createStaffAccount } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateStaffCreation, handleValidationErrors } from '../utils/validators.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUserManagement);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/analytics', getAnalyticsReport);
router.get('/users/:id', getUserDetails);
router.post('/staff', validateStaffCreation, handleValidationErrors, createStaffAccount);

export default router;