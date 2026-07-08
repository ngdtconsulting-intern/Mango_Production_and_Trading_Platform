import BuyingRequirement from '../models/BuyingRequirement.js';
import User from '../models/User.js';
import Survey from '../models/Survey.js';
import logger from '../utils/logger.js';

export const createBuyingRequirement = async (req, res) => {
  try {
    if (req.user.role !== 'trader' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only traders can create buying requirements',
      });
    }

    const requirement = await BuyingRequirement.create({
      ...req.body,
      traderId: req.user.id,
    });

    logger.info(`Buying requirement created: ${requirement._id}`);

    res.status(201).json({
      success: true,
      message: 'Buying requirement posted successfully',
      requirement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBuyingRequirements = async (req, res) => {
  try {
    const { status, variety, district, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { status: { $ne: 'cancelled' } };

    if (status) filter.status = status;
    if (variety) filter.variety = variety;
    if (district) filter['location.district'] = district;

    const requirements = await BuyingRequirement.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await BuyingRequirement.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      requirements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBuyingRequirementById = async (req, res) => {
  try {
    const requirement = await BuyingRequirement.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Buying requirement not found',
      });
    }

    res.json({
      success: true,
      requirement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const addResponse = async (req, res) => {
  try {
    if (req.user.role !== 'farmer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only farmers can respond',
      });
    }

    const requirement = await BuyingRequirement.findById(req.params.id);

    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found',
      });
    }

    const user = await User.findById(req.user.id);

    const response = {
      farmerId: req.user.id,
      farmerName: user.name,
      ...req.body,
    };

    requirement.responses.push(response);
    requirement.responseCount = requirement.responses.length;

    await requirement.save();

    logger.info(`Response added to requirement: ${requirement._id}`);

    res.json({
      success: true,
      message: 'Response submitted successfully',
      requirement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getFarmerDirectory = async (req, res) => {
  try {
    const { district, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'farmer', active: true };
    if (district) filter['address.district'] = district;

    const farmers = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get survey data for each farmer
    const farmersWithData = await Promise.all(
      farmers.map(async (farmer) => {
        const survey = await Survey.findOne({ farmerId: farmer._id }).sort({
          createdAt: -1,
        });
        return {
          ...farmer.toObject(),
          recentProduction: survey?.totalProductionKg,
          recentEarnings: survey?.totalEarnings2082,
        };
      })
    );

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      farmers: farmersWithData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  createBuyingRequirement,
  getBuyingRequirements,
  getBuyingRequirementById,
  addResponse,
  getFarmerDirectory,
};