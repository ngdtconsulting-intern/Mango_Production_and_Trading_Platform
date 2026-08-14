import express from 'express';
import { getDashboardStats, getUserManagement, toggleUserStatus, getAnalyticsReport, getUserDetails, createStaffAccount } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateStaffCreation, handleValidationErrors } from '../utils/validators.js';

const router = express.Router();

router.use(protect);

// Read-only user browsing is also available to officers (surveyor); everything
// else here (dashboard stats, toggling status, staff creation) stays admin-only.
router.get('/dashboard', authorize('admin'), getDashboardStats);
router.get('/users', authorize('admin', 'surveyor'), getUserManagement);
router.patch('/users/:id/toggle', authorize('admin'), toggleUserStatus);
router.get('/analytics', authorize('admin'), getAnalyticsReport);
router.get('/users/:id', authorize('admin', 'surveyor'), getUserDetails);
router.post('/staff', authorize('admin'), validateStaffCreation, handleValidationErrors, createStaffAccount);

export default router;