import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    period: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    date: { type: Date, required: true },

    // Production Metrics
    totalProduction: Number,
    averageProductionPerFarm: Number,
    totalFarms: Number,
    totalFarmers: Number,

    // Market Metrics
    averageWholesalePrice: Number,
    averageRetailPrice: Number,
    totalMarketTransactions: Number,

    // District-wise
    district: String,

    // Variety Analysis
    varietyAnalysis: [
      {
        variety: String,
        production: Number,
        averagePrice: Number,
        marketShare: Number,
      },
    ],

    // Challenges
    commonChallenges: [
      {
        challenge: String,
        frequency: Number,
      },
    ],

    // Survey Stats
    totalSurveys: Number,
    averageSatisfaction: Number,
  },
  { timestamps: true, indexes: [{ date: -1 }, { district: 1 }] }
);

export default mongoose.model('Analytics', analyticsSchema);