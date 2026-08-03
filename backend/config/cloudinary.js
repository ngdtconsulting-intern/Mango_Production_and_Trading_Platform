import cloudinary from 'cloudinary';
import logger from '../utils/logger.js';

let configured = false;

const ensureConfigured = () => {
  if (!configured) {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_NAME?.trim(),
      api_key: process.env.CLOUDINARY_API_KEY?.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
    });
    configured = true;
  }
};

export const uploadToCloudinary = async (file) => {
  ensureConfigured();
  try {
    const result = await cloudinary.v2.uploader.upload(file, {
      folder: 'mango-platform',
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (error) {
  logger.error(`Cloudinary upload error: ${JSON.stringify(error, null, 2)}`);
  throw error;
}
};

export default cloudinary;