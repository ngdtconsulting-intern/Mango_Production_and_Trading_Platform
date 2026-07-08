import Survey from '../models/Survey.js';
import Farm from '../models/Farm.js';
import MarketPrice from '../models/MarketPrice.js';
import BuyingRequirement from '../models/BuyingRequirement.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const calculateProductionStats = async (district = null, startDate = null, endDate = null) => {
  try {
    const filter = {};

    if (district) {
      filter['address.district'] = district;
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
          _id: '$address.district',
          totalSurveys: { $sum: 1 },
          totalProduction: { $sum: '$totalProductionKg' },
          totalEarnings: { $sum: '$totalEarnings2082' },
          averageProduction: { $avg: '$totalProductionKg' },
          averageEarnings: { $avg: '$totalEarnings2082' },
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

export const calculateYieldGap = async (district = null) => {
  try {
    const filter = {};
    if (district) filter['location.district'] = district;

    // Get actual yields
    const actualYields = await Survey.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$address.district',
          actualProduction: { $sum: '$totalProductionKg' },
          totalTrees: { $sum: '$totalMangoTrees' },
          farmCount: { $sum: 1 },
        },
      },
    ]);

    // Get potential yields based on tree age distribution
    const potentialYields = await Survey.aggregate([
      { $match: filter },
      {
        $project: {
          district: '$address.district',
          potentialYield: {
            $add: [
              { $multiply: ['$treeAgeDistribution.0.numberOfTrees', 0] }, // 1-3 years: 0%
              { $multiply: ['$treeAgeDistribution.1.numberOfTrees', 10] }, // 4-5 years: 10%
              { $multiply: ['$treeAgeDistribution.2.numberOfTrees', 35] }, // 6-10 years: 35%
              { $multiply: ['$treeAgeDistribution.3.numberOfTrees', 60] }, // 11-15 years: 60%
              { $multiply: ['$treeAgeDistribution.4.numberOfTrees', 80] }, // 16-25 years: 80%
              { $multiply: ['$treeAgeDistribution.5.numberOfTrees', 70] }, // 26-40 years: 70%
              { $multiply: ['$treeAgeDistribution.6.numberOfTrees', 50] }, // 40+ years: 50%
            ],
          },
        },
      },
      {
        $group: {
          _id: '$district',
          potentialProduction: { $sum: '$potentialYield' },
        },
      },
    ]);

    // Calculate gap
    const yieldGap = actualYields.map((actual) => {
      const potential = potentialYields.find((p) => p._id === actual._id);
      const gap = potential
        ? ((potential.potentialProduction - actual.actualProduction) /
            potential.potentialProduction) *
          100
        : 0;

      return {
        district: actual._id,
        actualProduction: { $round: [actual.actualProduction, 2] },
        potentialProduction: potential
          ? { $round: [potential.potentialProduction, 2] }
          : 0,
        yieldGap: Math.round(gap * 100) / 100,
        farmCount: actual.farmCount,
        avgYieldPerFarm: Math.round((actual.actualProduction / actual.farmCount) * 100) / 100,
      };
    });

    logger.info(`Yield gap calculated for ${yieldGap.length} districts`);
    return yieldGap;
  } catch (error) {
    logger.error(`Error calculating yield gap: ${error.message}`);
    throw error;
  }
};

export const calculateVarietyDistribution = async () => {
  try {
    const distribution = await Survey.aggregate([
      {
        $unwind: '$treeAgeDistribution',
      },
      {
        $group: {
          _id: {
            ageRange: '$treeAgeDistribution.ageRange',
            variety: '$treeAgeDistribution.ageRange', // This would need to be updated based on actual variety data
          },
          totalTrees: { $sum: '$treeAgeDistribution.numberOfTrees' },
          farmCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalTrees: -1 },
      },
    ]);

    logger.info(`Variety distribution calculated`);
    return distribution;
  } catch (error) {
    logger.error(`Error calculating variety distribution: ${error.message}`);
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
          totalEarnings: { $sum: '$totalEarnings2082' },
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
    if (district) filter['address.district'] = district;

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
  calculateVarietyDistribution,
  generateMonthlyReport,
  getChallengesAnalysis,
  getUserEngagementStats,
};