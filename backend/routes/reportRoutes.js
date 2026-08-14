import express from 'express';
import { createReport, getMyReports, getReports, resolveReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('farmer', 'trader'), createReport);
router.get('/my', protect, authorize('farmer', 'trader'), getMyReports);
router.get('/', protect, authorize('surveyor', 'admin'), getReports);
router.patch('/:id/resolve', protect, authorize('surveyor'), resolveReport);

export default router;