import express from 'express';
import { createOrUpdatePrice, getMyPrices, getPrices, getLatestPrices, getPriceTrends } from '../controllers/marketController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('surveyor'), createOrUpdatePrice);
router.get('/my-prices', protect, authorize('surveyor'), getMyPrices);
router.get('/', getPrices);
router.get('/latest', getLatestPrices);
router.get('/trends', getPriceTrends);

export default router;