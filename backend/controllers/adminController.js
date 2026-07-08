import User from '../models/User.js';
import Survey from '../models/Survey.js';
import BuyingRequirement from '../models/BuyingRequirement.js';
import MarketPrice from '../models/MarketPrice.js';
import logger from '../utils/logger.js';

export const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments({ active: true }),
      totalFarmers: await User.countDocuments({ role: 'farmer', active: true }),
      totalTraders: await User.countDocuments({ role: 'trader', active: true }),
      totalSurveys: await Survey.countDocuments(),
      completedSurveys: await Survey.countDocuments({ status: 'verified' }),
      totalBuyingRequirements: await BuyingRequirement.countDocuments({ status: 'open' }),
    };

    const recentSurveys = await Survey.find()
      .populate('farmerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats,
      recentSurveys,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserManagement = async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { active: true };
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.active = !user.active;
    await user.save();

    logger.info(`User status toggled: ${user.email}`);

    res.json({
      success: true,
      message: 'User status updated',
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAnalyticsReport = async (req, res) => {
  try {
    const surveyStats = await Survey.aggregate([
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          avgProduction: { $avg: '$totalProductionKg' },
          avgEarnings: { $avg: '$totalEarnings2082' },
          avgSatisfaction: { $avg: '$satisfactionLevel' },
        },
      },
    ]);

    const priceStats = await MarketPrice.aggregate([
      {
        $group: {
          _id: '$market',
          avgWholesale: { $avg: '$wholesalePricePerKg' },
          avgRetail: { $avg: '$retailPricePerKg' },
        },
      },
    ]);

    res.json({
      success: true,
      surveyStats: surveyStats[0] || {},
      priceStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  getDashboardStats,
  getUserManagement,
  toggleUserStatus,
  getAnalyticsReport,
};