import express from 'express';
import { generateAnalytics, getAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('admin'), generateAnalytics);
router.get('/', protect, getAnalytics);

export default router;