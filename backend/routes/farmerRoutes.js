import express from 'express';
import {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
} from '../controllers/farmerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createFarm);
router.get('/', protect, getFarms);
router.get('/:id', protect, getFarmById);
router.put('/:id', protect, updateFarm);
router.delete('/:id', protect, deleteFarm);

export default router;