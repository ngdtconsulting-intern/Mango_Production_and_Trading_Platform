import express from 'express';
import { createSurvey, getSurveys, getSurveyById, updateSurvey, deleteSurvey, verifySurvey, getSurveyStats } from '../controllers/surveyController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateSurveyData, handleValidationErrors, validatePagination } from '../utils/validators.js';

const router = express.Router();

router.post('/', protect, createSurvey);
router.get('/', protect, getSurveys);
router.get('/stats', protect, getSurveyStats);
router.get('/:id', protect, getSurveyById);
router.put('/:id', protect, updateSurvey);
router.delete('/:id', protect, deleteSurvey);
router.patch('/:id/verify', protect, authorize('admin'), verifySurvey);

export default router;