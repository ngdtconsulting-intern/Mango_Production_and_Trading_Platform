import express from 'express';
import { getChatHistory, uploadChatImage } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/history', protect, getChatHistory);
router.post('/upload', protect, upload.single('image'), uploadChatImage);

export default router;