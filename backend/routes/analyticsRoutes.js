import express from 'express';
import { generateAnalytics, getAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, authorize('surveyor'), generateAnalytics);

// District-level planning aggregates. No client-facing screen reads these, and
// the write side is already officer-only, so reading is restricted to the same
// staff roles rather than merely requiring any logged-in account.
router.get('/', protect, authorize('surveyor', 'admin'), getAnalytics);

export default router;