import express from 'express';
import { createBuyingRequirement, getBuyingRequirements, getMyResponses, getMyRequirements, getBuyingRequirementById, addResponse, updateResponseStatus, updateRequirementStatus } from '../controllers/traderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/requirements', protect, authorize('trader'), createBuyingRequirement);
// Listing carries the posting trader's contact phone and email, so it needs an
// account. Left open to any signed-in role: farmers browse it to find work and
// traders to see the market, which is the same audience the UI already allows.
router.get('/requirements', protect, getBuyingRequirements);
router.get('/requirements/my-requirements', protect, authorize('trader'), getMyRequirements);
router.get('/requirements/my-responses', protect, authorize('farmer'), getMyResponses);
router.get('/requirements/:id', protect, getBuyingRequirementById);
router.post('/requirements/:id/respond', protect, authorize('farmer'), addResponse);
router.patch('/requirements/:id/status', protect, authorize('trader'), updateRequirementStatus);
router.patch('/requirements/:id/responses/:responseId', protect, authorize('trader'), updateResponseStatus);


export default router;