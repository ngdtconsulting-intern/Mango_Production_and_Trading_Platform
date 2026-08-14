import express from 'express';
import { createReport, getMyReports, getReports, resolveReport, uploadReportImage } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.post('/', protect, authorize('farmer', 'trader'), createReport);
router.post('/upload', protect, authorize('farmer', 'trader'), upload.single('image'), uploadReportImage);
router.get('/my', protect, authorize('farmer', 'trader'), getMyReports);
router.get('/', protect, authorize('surveyor', 'admin'), getReports);
router.patch('/:id/resolve', protect, authorize('surveyor'), resolveReport);

export default router;