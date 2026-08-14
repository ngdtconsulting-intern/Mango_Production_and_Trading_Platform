import express from 'express';
import { generateAnalytics, getAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, authorize('surveyor'), generateAnalytics);
router.get('/', getAnalytics);

export default router;