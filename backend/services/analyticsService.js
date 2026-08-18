import Survey from '../models/Survey.js';
import Farm from '../models/Farm.js';
import MarketPrice from '../models/MarketPrice.js';
import BuyingRequirement from '../models/BuyingRequirement.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { TREE_AGE_BRACKETS } from '../utils/constants.js';

export const calculateProductionStats = async (district = null, startDate = null, endDate = null) => {
  try {
    const filter = {};

    // Survey stores district at the top level, not nested under `address`.
    if (district) {
      filter.district = district;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Survey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$district',
          totalSurveys: { $sum: 1 },
          totalProduction: { $sum: '$totalProductionKg' },
          totalEarnings: { $sum: '$earningsCurrentYearNPR' },
          averageProduction: { $avg: '$totalProductionKg' },
          averageEarnings: { $avg: '$earningsCurrentYearNPR' },
          averageSatisfaction: { $avg: '$satisfactionLevel' },
          totalFarmers: { $addToSet: '$farmerId' },
        },
      },
      {
        $project: {
          _id: 1,
          totalSurveys: 1,
          totalProduction: { $round: ['$totalProduction', 2] },
          totalEarnings: { $round: ['$totalEarnings', 2] },
          averageProduction: { $round: ['$averageProduction', 2] },
          averageEarnings: { $round: ['$averageEarnings', 2] },
          averageSatisfaction: { $round: ['$averageSatisfaction', 1] },
          totalFarmers: { $size: '$totalFarmers' },
        },
      },
      { $sort: { totalProduction: -1 } },
    ]);

    logger.info(`Production stats calculated: ${stats.length} districts`);
    return stats;
  } catch (error) {
    logger.error(`Error calculating production stats: ${error.message}`);
    throw error;
  }
};

export const calculateMarketStats = async (market = null, variety = null, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const filter = { date: { $gte: startDate } };

    if (market) filter.market = market;
    if (variety) filter.variety = variety;

    const stats = await MarketPrice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { market: '$market', variety: '$variety' },
          avgWholesale: { $avg: '$wholesalePricePerKg' },
          avgRetail: { $avg: '$retailPricePerKg' },
          maxWholesale: { $max: '$wholesalePricePerKg' },
          minWholesale: { $min: '$wholesalePricePerKg' },
          maxRetail: { $max: '$retailPricePerKg' },
          minRetail: { $min: '$retailPricePerKg' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          avgWholesale: { $round: ['$avgWholesale', 2] },
          avgRetail: { $round: ['$avgRetail', 2] },
          maxWholesale: { $round: ['$maxWholesale', 2] },
          minWholesale: { $round: ['$minWholesale', 2] },
          maxRetail: { $round: ['$maxRetail', 2] },
          minRetail: { $round: ['$minRetail', 2] },
          priceRange: {
            wholesale: {
              $round: [{ $subtract: ['$maxWholesale', '$minWholesale'] }, 2],
            },
            retail: {
              $round: [{ $subtract: ['$maxRetail', '$minRetail'] }, 2],
            },
          },
          count: 1,
        },
      },
    ]);

    logger.info(`Market stats calculated: ${stats.length} market varieties`);
    return stats;
  } catch (error) {
    logger.error(`Error calculating market stats: ${error.message}`);
    throw error;
  }
};

/**
 * District yield gap: what the recorded tree ages imply the orchards should
 * produce, against what farmers reported.
 *
 * Expected production is read from the stored `expectedProductionKg`, which the
 * Survey pre-save hook derives from TREE_AGE_BRACKETS. That keeps the figure
 * identical to the one the officer saw when verifying the record, instead of
 * re-deriving it here with a second, drifting copy of the table.
 */
export const calculateYieldGap = async (district = null, year = null) => {
  try {
    const filter = {};
    if (district) filter.district = district;
    if (year) filter.surveyYearBS = Number(year);

    const rows = await Survey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$district',
          actualProduction: { $sum: '$totalProductionKg' },
          potentialProduction: { $sum: '$expectedProductionKg' },
          totalTrees: { $sum: '$totalMangoTrees' },
          bearingTrees: { $sum: '$bearingTreeCount' },
          farmCount: { $sum: 1 },
        },
      },
      { $sort: { actualProduction: -1 } },
    ]);

    const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    const yieldGap = rows.map((row) => ({
      district: row._id,
      actualProduction: round2(row.actualProduction),
      potentialProduction: round2(row.potentialProduction),
      totalTrees: row.totalTrees,
      bearingTrees: row.bearingTrees,
      // Positive = producing below what the tree ages suggest.
      yieldGap: row.potentialProduction
        ? round2(
            ((row.potentialProduction - row.actualProduction) / row.potentialProduction) * 100
          )
        : null,
      farmCount: row.farmCount,
      avgYieldPerFarm: row.farmCount ? round2(row.actualProduction / row.farmCount) : 0,
    }));

    logger.info(`Yield gap calculated for ${yieldGap.length} districts`);
    return yieldGap;
  } catch (error) {
    logger.error(`Error calculating yield gap: ${error.message}`);
    throw error;
  }
};

/**
 * How the district's trees are spread across age brackets, and what each
 * bracket is expected to contribute. This is the age profile of the orchard
 * stock — it says nothing about variety, which surveys do not yet collect.
 */
export const calculateTreeAgeProfile = async (district = null, year = null) => {
  try {
    const filter = {};
    if (district) filter.district = district;
    if (year) filter.surveyYearBS = Number(year);

    const rows = await Survey.aggregate([
      { $match: filter },
      { $unwind: '$treeAgeDistribution' },
      {
        $group: {
          _id: '$treeAgeDistribution.ageRange',
          totalTrees: { $sum: '$treeAgeDistribution.numberOfTrees' },
          farmCount: { $sum: 1 },
        },
      },
    ]);

    // Emit every bracket in canonical order, including ones with no trees, so
    // the caller gets a complete profile rather than a sparse one.
    const profile = TREE_AGE_BRACKETS.map((bracket) => {
      const row = rows.find((r) => r._id === bracket.key);
      const totalTrees = row?.totalTrees || 0;
      return {
        ageRange: bracket.key,
        label: bracket.label,
        kgPerTree: bracket.kgPerTree,
        totalTrees,
        farmCount: row?.farmCount || 0,
        expectedProductionKg: totalTrees * bracket.kgPerTree,
      };
    });

    logger.info(`Tree age profile calculated`);
    return profile;
  } catch (error) {
    logger.error(`Error calculating tree age profile: ${error.message}`);
    throw error;
  }
};

export const generateMonthlyReport = async (month, year) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const filter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const surveyStats = await Survey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSurveys: { $sum: 1 },
          totalProduction: { $sum: '$totalProductionKg' },
          totalEarnings: { $sum: '$earningsCurrentYearNPR' },
          avgSatisfaction: { $avg: '$satisfactionLevel' },
        },
      },
    ]);

    const marketStats = await MarketPrice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$market',
          avgWholesale: { $avg: '$wholesalePricePerKg' },
          avgRetail: { $avg: '$retailPricePerKg' },
        },
      },
    ]);

    const buyingStats = await BuyingRequirement.aggregate([
      { $match: { createdAt: filter.createdAt } },
      {
        $group: {
          _id: null,
          totalRequirements: { $sum: 1 },
          completedRequirements: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalQuantity: { $sum: '$quantityKg' },
        },
      },
    ]);

    const report = {
      month,
      year,
      period: `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
      surveys: surveyStats[0] || {},
      market: marketStats || [],
      buying: buyingStats[0] || {},
      generatedOn: new Date(),
    };

    logger.info(`Monthly report generated for ${month}/${year}`);
    return report;
  } catch (error) {
    logger.error(`Error generating monthly report: ${error.message}`);
    throw error;
  }
};

export const getChallengesAnalysis = async (district = null) => {
  try {
    const filter = {};
    if (district) filter.district = district;

    const challenges = await Survey.aggregate([
      { $match: filter },
      {
        $facet: {
          productionChallenges: [
            { $match: { productionChallenges: { $exists: true, $ne: null } } },
            { $group: { _id: '$productionChallenges', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          marketingChallenges: [
            { $match: { marketingChallenges: { $exists: true, $ne: null } } },
            { $group: { _id: '$marketingChallenges', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ]);

    logger.info(`Challenges analysis completed`);
    return challenges[0];
  } catch (error) {
    logger.error(`Error analyzing challenges: ${error.message}`);
    throw error;
  }
};

export const getUserEngagementStats = async () => {
  try {
    const stats = await User.aggregate([
      {
        $facet: {
          byRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } },
          ],
          byActive: [
            { $group: { _id: '$active', count: { $sum: 1 } } },
          ],
          topActiveUsers: [
            { $match: { active: true } },
            { $sort: { lastLogin: -1 } },
            { $limit: 10 },
            {
              $project: {
                name: 1,
                email: 1,
                role: 1,
                lastLogin: 1,
                loginCount: 1,
              },
            },
          ],
        },
      },
    ]);

    logger.info(`User engagement stats calculated`);
    return stats[0];
  } catch (error) {
    logger.error(`Error calculating user engagement: ${error.message}`);
    throw error;
  }
};

export default {
  calculateProductionStats,
  calculateMarketStats,
  calculateYieldGap,
  calculateTreeAgeProfile,
  generateMonthlyReport,
  getChallengesAnalysis,
  getUserEngagementStats,
};