import express from 'express';
import { createBuyingRequirement, getBuyingRequirements, getMyRequirements, getBuyingRequirementById, addResponse, updateResponseStatus, getFarmerDirectory, getFarmerProfile } from '../controllers/traderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/requirements', protect, authorize('trader'), createBuyingRequirement);
router.get('/requirements', getBuyingRequirements);
router.get('/requirements/my-requirements', protect, authorize('trader'), getMyRequirements);
router.get('/requirements/:id', getBuyingRequirementById);
router.post('/requirements/:id/respond', protect, authorize('farmer'), addResponse);
router.patch('/requirements/:id/responses/:responseId', protect, authorize('trader'), updateResponseStatus);
router.get('/farmers', getFarmerDirectory);
router.get('/farmers/:id', getFarmerProfile);
router.get('/directory', getFarmerDirectory);

export default router;