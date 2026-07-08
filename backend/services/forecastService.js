import Survey from '../models/Survey.js';
import Farm from '../models/Farm.js';
import MarketPrice from '../models/MarketPrice.js';
import logger from '../utils/logger.js';
import { TREE_AGE_BRACKETS } from '../utils/constants.js';

export const calculateYieldForecast = async (farmId) => {
  try {
    const farm = await Farm.findById(farmId);
    if (!farm) {
      throw new Error('Farm not found');
    }

    // Base yield calculation from tree age distribution
    let totalProductionPotential = 0;

    TREE_AGE_BRACKETS.forEach((bracket) => {
      const treeCount = farm.treeAgeDistribution[bracket.label.split(' ')[0]] || 0;
      const yieldPerTree = 40; // kg per tree average
      const productivity = bracket.productivityPercent / 100;
      totalProductionPotential += treeCount * yieldPerTree * productivity;
    });

    // Apply management multiplier
    let managementMultiplier = 1;
    const recentSurvey = Survey.findOne({ farmId }).sort({ createdAt: -1 });

    if (recentSurvey) {
      // Good management practices increase yield
      if (recentSurvey.selfManaged) managementMultiplier = 1.1;
      // Pest/disease reduces yield
      if (recentSurvey.productionChallenges) managementMultiplier *= 0.9;
    }

    const adjustedForecast = totalProductionPotential * managementMultiplier;

    logger.info(`Yield forecast calculated for farm ${farmId}: ${adjustedForecast} kg`);

    return {
      farmId,
      farmName: farm.farmName,
      baselineProduction: totalProductionPotential,
      adjustedForecast: Math.round(adjustedForecast),
      confidenceLevel: 85, // percentage
      factors: {
        treeAge: 'High impact',
        management: 'Moderate impact',
        weather: 'Not included in this calculation',
      },
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Error calculating yield forecast: ${error.message}`);
    throw error;
  }
};

export const forecastDistrictProduction = async (district) => {
  try {
    const surveys = await Survey.find({ 'address.district': district });

    if (surveys.length === 0) {
      throw new Error('No surveys found for this district');
    }

    let totalForecast = 0;
    let totalActual = 0;
    let farmCount = surveys.length;

    surveys.forEach((survey) => {
      // Calculate potential based on tree age distribution
      let potential = 0;
      survey.treeAgeDistribution.forEach((tree) => {
        const bracket = TREE_AGE_BRACKETS.find((b) => b.label === tree.ageRange);
        if (bracket) {
          potential += tree.numberOfTrees * 40 * (bracket.productivityPercent / 100);
        }
      });

      totalForecast += potential;
      totalActual += survey.totalProductionKg;
    });

    const yieldGap = totalForecast - totalActual;
    const yieldGapPercentage = (yieldGap / totalForecast) * 100;

    logger.info(`District production forecast: ${district}`);

    return {
      district,
      forecastedProduction: Math.round(totalForecast),
      actualProduction: Math.round(totalActual),
      yieldGap: Math.round(yieldGap),
      yieldGapPercentage: Math.round(yieldGapPercentage * 100) / 100,
      farmCount,
      avgForecastPerFarm: Math.round(totalForecast / farmCount),
      avgActualPerFarm: Math.round(totalActual / farmCount),
      recommendations: generateRecommendations(yieldGapPercentage),
    };
  } catch (error) {
    logger.error(`Error forecasting district production: ${error.message}`);
    throw error;
  }
};

export const predictMarketPrice = async (variety, market, daysAhead = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90); // Last 90 days of data

    const historicalPrices = await MarketPrice.find({
      variety,
      market,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    if (historicalPrices.length < 5) {
      throw new Error('Insufficient historical data for prediction');
    }

    // Simple linear regression
    const prices = historicalPrices.map((p) => p.avgPrice).reverse();

    // Calculate average and trend
    const avgPrice = prices.reduce((a, b) => a + b) / prices.length;

    // Calculate trend (simple slope)
    let sumXY = 0;
    let sumX = 0;
    let sumX2 = 0;
    let sumY = 0;

    prices.forEach((price, index) => {
      sumXY += index * price;
      sumX += index;
      sumX2 += index * index;
      sumY += price;
    });

    const n = prices.length;
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict price for daysAhead
    const predictedPrice = intercept + slope * (n + daysAhead);

    // Confidence level (inverse of variance)
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const confidenceLevel = Math.max(50, Math.min(95, 100 - (stdDev / avgPrice) * 100));

    logger.info(`Price prediction for ${variety} at ${market}`);

    return {
      variety,
      market,
      currentPrice: prices[prices.length - 1],
      averagePrice: Math.round(avgPrice * 100) / 100,
      predictedPrice: Math.max(0, Math.round(predictedPrice * 100) / 100),
      priceChange: Math.round((predictedPrice - prices[prices.length - 1]) * 100) / 100,
      priceChangePercentage: Math.round(((predictedPrice - prices[prices.length - 1]) / prices[prices.length - 1]) * 10000) / 100,
      daysAhead,
      confidenceLevel: Math.round(confidenceLevel * 100) / 100,
      trend: slope > 0 ? 'Increasing' : 'Decreasing',
      dataPoints: prices.length,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Error predicting market price: ${error.message}`);
    throw error;
  }
};

export const forecastRevenue = async (farmId, expectedYieldKg, varietyMix) => {
  try {
    // Get current market prices
    const prices = await MarketPrice.aggregate([
      { $sort: { date: -1 } },
      {
        $group: {
          _id: '$variety',
          avgPrice: { $avg: '$avgPrice' },
        },
      },
    ]);

    let totalRevenue = 0;
    let totalQuantity = 0;

    varietyMix.forEach((variety) => {
      const priceData = prices.find((p) => p._id === variety.name);
      const avgPrice = priceData ? priceData.avgPrice : 0;
      const quantityForVariety = (expectedYieldKg * variety.percentage) / 100;
      totalRevenue += quantityForVariety * avgPrice;
      totalQuantity += quantityForVariety;
    });

    // Subtract estimated costs (rough estimate: 30% of revenue)
    const estimatedCosts = totalRevenue * 0.3;
    const expectedProfit = totalRevenue - estimatedCosts;

    logger.info(`Revenue forecast calculated for farm ${farmId}`);

    return {
      farmId,
      expectedYieldKg,
      expectedRevenue: Math.round(totalRevenue),
      estimatedCosts: Math.round(estimatedCosts),
      expectedProfit: Math.round(expectedProfit),
      profitMargin: Math.round((expectedProfit / totalRevenue) * 100),
      varietyMix,
      forecastDate: new Date(),
    };
  } catch (error) {
    logger.error(`Error forecasting revenue: ${error.message}`);
    throw error;
  }
};

export const identifyopportunities = async (district) => {
  try {
    // Get market demand
    const demandData = await MarketPrice.aggregate([
      {
        $group: {
          _id: '$variety',
          avgPrice: { $avg: '$avgPrice' },
          priceVolatility: { $stdDevPop: '$avgPrice' },
        },
      },
      { $sort: { avgPrice: -1 } },
    ]);

    // Get supply from surveys
    const supplyData = await Survey.aggregate([
      { $match: { 'address.district': district } },
      {
        $group: {
          _id: null,
          totalProduction: { $sum: '$totalProductionKg' },
          farmCount: { $sum: 1 },
        },
      },
    ]);

    // Identify high-demand, low-supply opportunities
    const opportunities = demandData.map((demand) => ({
      variety: demand._id,
      priceLevel: 'High',
      profitability: demand.avgPrice > 50 ? 'High' : 'Medium',
      marketStability: demand.priceVolatility < 10 ? 'Stable' : 'Volatile',
      recommendation: demand.avgPrice > 50 ? 'Recommended for cultivation' : 'Monitor market',
    }));

    logger.info(`Opportunities identified for ${district}`);

    return {
      district,
      opportunities,
      supplyInfo: supplyData[0] || {},
      analysisDate: new Date(),
    };
  } catch (error) {
    logger.error(`Error identifying opportunities: ${error.message}`);
    throw error;
  }
};

const generateRecommendations = (yieldGapPercentage) => {
  if (yieldGapPercentage > 30) {
    return [
      'High yield gap detected. Improve farming practices through better pest management.',
      'Consider farmer training programs on scientific management techniques.',
      'Increase investment in irrigation infrastructure.',
      'Promote organic farming to increase productivity.',
    ];
  } else if (yieldGapPercentage > 15) {
    return [
      'Moderate yield gap. Focus on optimizing fertilizer application.',
      'Implement integrated pest management practices.',
      'Regular soil testing and amendment.',
    ];
  } else {
    return [
      'Yield gap is within acceptable range. Maintain current practices.',
      'Continue monitoring and regular updates.',
      'Share best practices with neighboring farmers.',
    ];
  }
};

export default {
  calculateYieldForecast,
  forecastDistrictProduction,
  predictMarketPrice,
  forecastRevenue,
  identifyOpportunities,
};