import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
    },
    date: { type: Date, required: true },

    totalProduction: Number,
    averageProductionPerFarm: Number,
    totalFarms: Number,
    totalFarmers: Number,

    averageWholesalePrice: Number,
    averageRetailPrice: Number,
    totalMarketTransactions: Number,

    district: String,

    varietyAnalysis: [
      {
        variety: String,
        production: Number,
        averagePrice: Number,
        marketShare: Number,
      },
    ],

    commonChallenges: [
      {
        challenge: String,
        frequency: Number,
      },
    ],

    totalSurveys: Number,
    averageSatisfaction: Number,
  },
  { timestamps: true, indexes: [{ date: -1 }, { district: 1 }] }
);

// No pre-save hook needed

export default mongoose.model('Analytics', analyticsSchema);