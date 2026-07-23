import express from 'express';
import { createOrUpdatePrice, getPrices, getLatestPrices, getPriceTrends, getPriceComparison } from '../controllers/marketController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('admin'), createOrUpdatePrice);
router.get('/', getPrices);
router.get('/latest', getLatestPrices);
router.get('/trends', getPriceTrends);
router.get('/comparison', getPriceComparison);

export default router;