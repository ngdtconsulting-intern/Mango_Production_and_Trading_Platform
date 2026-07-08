import Farm from '../models/Farm.js';
import logger from '../utils/logger.js';

export const createFarm = async (req, res) => {
  try {
    const farm = await Farm.create({
      ...req.body,
      userId: req.user.id,
    });

    logger.info(`Farm created: ${farm._id}`);

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      farm,
    });
  } catch (error) {
    logger.error(`Farm creation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFarms = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const farms = await Farm.find({ userId: req.user.id })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Farm.countDocuments({ userId: req.user.id });

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      farms,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    // Authorization
    if (farm.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this farm',
      });
    }

    res.json({
      success: true,
      farm,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateFarm = async (req, res) => {
  try {
    let farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    if (farm.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this farm',
      });
    }

    farm = await Farm.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Farm updated successfully',
      farm,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found',
      });
    }

    if (farm.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this farm',
      });
    }

    await Farm.findByIdAndDelete(req.params.id);

    logger.info(`Farm deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Farm deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
};