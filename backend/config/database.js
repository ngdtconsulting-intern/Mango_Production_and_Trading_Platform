import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  try {
    // Remove deprecation warnings
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options work for both local and Atlas
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);

    // Helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      logger.error('Make sure MongoDB is running locally or check your Atlas connection string');
    }

    if (error.message.includes('authentication failed')) {
      logger.error('Check your database username and password in .env file');
    }

    if (error.message.includes('network')) {
      logger.error('Check your internet connection and IP whitelist in MongoDB Atlas');
    }

    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`Error disconnecting: ${error.message}`);
    process.exit(1);
  }
};

export default mongoose;