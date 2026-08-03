import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Survey from '../models/Survey.js';
import ChatMessage from '../models/ChatMessage.js';
import logger from '../utils/logger.js';

const ROOM = 'community';

export const initChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'].filter(Boolean),
      credentials: true,
    },
  });

  // Authenticate every socket connection using the same JWT used for REST requests
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.active) return next(new Error('Invalid or inactive user'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(ROOM);
    logger.info(`Socket connected: ${socket.user.name} (${socket.user.role})`);

   socket.on('send_message', async (payload, callback) => {
  try {
    const text = (payload?.message || '').trim();
    const imageUrl = payload?.imageUrl || undefined;

    if (!text && !imageUrl) return; // don't save completely empty messages

    let district;
    let area;

    if (socket.user.role === 'farmer') {
      const latestSurvey = await Survey.findOne({ farmerId: socket.user._id }).sort({ createdAt: -1 });
      if (latestSurvey) {
        district = latestSurvey.district;
        area = latestSurvey.municipality;
      }
    }

    const savedMessage = await ChatMessage.create({
      senderId: socket.user._id,
      senderName: socket.user.name,
      senderRole: socket.user.role,
      district,
      area,
      message: text || undefined,
      imageUrl,
    });

    io.to(ROOM).emit('new_message', savedMessage);

    if (typeof callback === 'function') callback({ success: true });
  } catch (error) {
    logger.error(`Error sending chat message: ${error.message}`);
    if (typeof callback === 'function') callback({ success: false, message: error.message });
  }
});

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.user?.name}`);
    });
  });

  return io;
};