import cloudinary from 'cloudinary';
import logger from '../utils/logger.js';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.v2.uploader.upload(file, {
      folder: 'mango-platform',
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
    logger.error(`Cloudinary upload error: ${error.message}`);
    throw error;
  }
};

export default cloudinary;