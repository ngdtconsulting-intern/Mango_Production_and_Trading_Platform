import mongoose from 'mongoose';

const productionSchema = new mongoose.Schema(
  {
    surveyId: mongoose.Schema.Types.ObjectId,
    farmId: mongoose.Schema.Types.ObjectId,
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    season: String,
    year: Number,

    preFlowering: {
      pruned: Boolean,
      pruningDate: Date,
      organicManureKg: Number,
      chemicalFertilizerKg: Number,
    },

    flowering: {
      flowerDensity: { type: String, enum: ['high', 'medium', 'low'] },
      pestPresence: Boolean,
      pestType: String,
    },

    fruitDevelopment: {
      estimatedFruitCount: Number,
      fruitDropPercentage: Number,
      fruitSizeEstimate: String,
    },

    harvest: {
      harvestDate: Date,
      totalQuantityKg: Number,
      gradeA: Number,
      gradeB: Number,
      gradeC: Number,
    },

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

// No pre-save hook needed for this model

export default mongoose.model('Production', productionSchema);