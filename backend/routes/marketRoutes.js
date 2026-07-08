import express from 'express';
import {
  createOrUpdatePrice,
  getPrices,
  getLatestPrices,
  getPriceComparison,
} from '../controllers/marketController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateMarketPrice, handleValidationErrors } from '../utils/validators.js';

const router = express.Router();

router.post('/', protect, authorize('admin'), validateMarketPrice, handleValidationErrors, createOrUpdatePrice);
router.get('/', getPrices);
router.get('/latest', getLatestPrices);
router.get('/comparison', getPriceComparison);

export default router;