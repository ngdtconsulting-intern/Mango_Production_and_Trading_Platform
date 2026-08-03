import fs from 'fs';
import ChatMessage from '../models/ChatMessage.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

export const getChatHistory = async (req, res) => {
  try {
    const { limit = 50, before } = req.query;

    const filter = {};
    if (before) filter.createdAt = { $lt: new Date(before) };

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadChatImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const imageUrl = await uploadToCloudinary(req.file.path);

    // Clean up the local temp copy now that it's safely on Cloudinary
    fs.unlink(req.file.path, (err) => {
      if (err) logger.error(`Failed to delete temp upload file: ${err.message}`);
    });

    res.json({ success: true, imageUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { getChatHistory, uploadChatImage };