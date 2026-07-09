import express from 'express';
import { createBuyingRequirement, getBuyingRequirements, getBuyingRequirementById, addResponse, getFarmerDirectory } from '../controllers/traderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/requirements', protect, authorize('trader'), createBuyingRequirement);
router.get('/requirements', getBuyingRequirements);
router.get('/requirements/:id', getBuyingRequirementById);
router.post('/requirements/:id/respond', protect, authorize('farmer'), addResponse);
router.get('/directory', getFarmerDirectory);

export default router;