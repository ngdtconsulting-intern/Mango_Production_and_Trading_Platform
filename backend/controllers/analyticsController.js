import Analytics from '../models/Analytics.js';
import Survey from '../models/Survey.js';
import MarketPrice from '../models/MarketPrice.js';
import logger from '../utils/logger.js';

export const generateAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can generate analytics',
      });
    }

    const { period = 'daily', district } = req.body;

    const startDate = new Date();
    if (period === 'daily') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const filter = { createdAt: { $gte: startDate } };
    if (district) filter['address.district'] = district;

    const surveyData = await Survey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          totalProduction: { $sum: '$totalProductionKg' },
          avgSatisfaction: { $avg: '$satisfactionLevel' },
        },
      },
    ]);

    const analyticsRecord = new Analytics({
      period,
      date: new Date(),
      district,
      totalSurveys: surveyData[0]?.totalSurveys || 0,
      totalProduction: surveyData[0]?.totalProduction || 0,
    });

    await analyticsRecord.save();

    logger.info(`Analytics generated for ${period}`);

    res.json({
      success: true,
      message: 'Analytics generated successfully',
      analytics: analyticsRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { period, district } = req.query;

    const filter = {};
    if (period) filter.period = period;
    if (district) filter.district = district;

    const analytics = await Analytics.find(filter).sort({ date: -1 });

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  generateAnalytics,
  getAnalytics,
};