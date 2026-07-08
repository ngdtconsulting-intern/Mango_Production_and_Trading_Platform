import express from 'express';
import {
  getDashboardStats,
  getUserManagement,
  toggleUserStatus,
  getAnalyticsReport,
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUserManagement);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/analytics', getAnalyticsReport);

export default router;