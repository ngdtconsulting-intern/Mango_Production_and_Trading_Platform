import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema(
  {
    surveyId: mongoose.Schema.Types.ObjectId,
    farmId: mongoose.Schema.Types.ObjectId,
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    season: String,
    year: Number,

    // Pre-Flowering Phase (Nov-Dec)
    preFlowering: {
      pruned: Boolean,
      pruningDate: Date,
      organicManureKg: Number,
      chemicalFertilizerKg: Number,
    },

    // Flowering Phase (Feb-Mar)
    flowering: {
      flowerDensity: { type: String, enum: ['high', 'medium', 'low'] },
      pestPresence: Boolean,
      pestType: String,
    },

    // Fruit Development Phase (Apr-May)
    fruitDevelopment: {
      estimatedFruitCount: Number,
      fruitDropPercentage: Number,
      fruitSizeEstimate: String,
    },

    // Harvest Phase
    harvest: {
      harvestDate: Date,
      totalQuantityKg: Number,
      gradeA: Number,
      gradeB: Number,
      gradeC: Number,
    },

    // Yield
    predictedYieldKg: Number,
    actualYieldKg: Number,
    costPerKg: Number,
    revenuePerKg: Number,

    status: {
      type: String,
      enum: ['planning', 'ongoing', 'completed'],
      default: 'planning',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Production', productionSchema);