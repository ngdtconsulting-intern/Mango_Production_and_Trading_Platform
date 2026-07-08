import Survey from '../models/Survey.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const createSurvey = async (req, res) => {
  try {
    const surveyData = {
      ...req.body,
      farmerId: req.user.id,
    };

    const survey = await Survey.create(surveyData);

    // Update user farm count
    await User.findByIdAndUpdate(req.user.id, { $inc: { farmCount: 1 } });

    logger.info(`Survey created: ${survey._id}`);

    res.status(201).json({
      success: true,
      message: 'Survey created successfully',
      survey,
    });
  } catch (error) {
    logger.error(`Survey creation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSurveys = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.user.role === 'farmer') {
      filter.farmerId = req.user.id;
    }

    if (status) filter.status = status;

    const surveys = await Survey.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Survey.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      surveys,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSurveyById = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).populate(
      'farmerId',
      'name email phone'
    );

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
      });
    }

    // Authorization
    if (
      req.user.role === 'farmer' &&
      survey.farmerId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this survey',
      });
    }

    res.json({
      success: true,
      survey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSurvey = async (req, res) => {
  try {
    let survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
      });
    }

    // Authorization
    if (
      req.user.role === 'farmer' &&
      survey.farmerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this survey',
      });
    }

    survey = await Survey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Survey updated successfully',
      survey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteSurvey = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);

    if (!survey) {
      return res.status(404).json({
        success: false,
        message: 'Survey not found',
      });
    }

    // Authorization
    if (
      req.user.role === 'farmer' &&
      survey.farmerId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this survey',
      });
    }

    await Survey.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(req.user.id, { $inc: { farmCount: -1 } });

    logger.info(`Survey deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Survey deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifySurvey = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can verify surveys',
      });
    }

    const { status, verificationNotes } = req.body;

    const survey = await Survey.findByIdAndUpdate(
      req.params.id,
      { status, verificationNotes },
      { new: true }
    );

    logger.info(`Survey verified: ${survey._id}`);

    res.json({
      success: true,
      message: 'Survey verified successfully',
      survey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSurveyStats = async (req, res) => {
  try {
    const stats = await Survey.aggregate([
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          averageProduction: { $avg: '$totalProductionKg' },
          averageEarnings: { $avg: '$totalEarnings2082' },
          averageSatisfaction: { $avg: '$satisfactionLevel' },
        },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default {
  createSurvey,
  getSurveys,
  getSurveyById,
  updateSurvey,
  deleteSurvey,
  verifySurvey,
  getSurveyStats,
};