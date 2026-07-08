import mongoose from 'mongoose';

const treeAgeSchema = new mongoose.Schema({
  ageRange: String,
  numberOfTrees: { type: Number, default: 0 },
});

const surveySchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmerName: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true, min: 18, max: 100 },
    educationLevel: { type: String, required: true },

    // Address
    wardNumber: { type: Number, required: true },
    tole: { type: String, required: true },

    // Household
    householdMembers: { type: Number, required: true, min: 1 },

    // Orchard
    orchardAreaKatha: { type: Number, required: true, min: 0.1 },
    orchardAreaHectare: Number,
    totalMangoTrees: { type: Number, required: true, min: 1 },

    // Tree Age Distribution
    treeAgeDistribution: [treeAgeSchema],

    // Management
    selfManaged: Boolean,
    managementType: String,
    productionCostNPR: Number,

    // Production Data
    totalProductionKg: { type: Number, default: 0 },
    totalProductionMT: { type: Number, default: 0 },
    totalEarnings2082: { type: Number, default: 0 },
    totalEarnings2081: { type: Number, default: 0 },
    earningsGrowth: Number,

    // Satisfaction
    satisfactionLevel: { type: Number, required: true, min: 0, max: 10 },

    // Technical Assistance
    receivedGovernmentAssistance: Boolean,
    governmentOfficeSource: String,
    receivedNonGovernmentAssistance: Boolean,
    nonGovernmentSource: String,

    // Challenges
    productionChallenges: String,
    marketingChallenges: String,
    suggestions: String,

    // Status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'verified', 'rejected'],
      default: 'submitted',
    },
    verificationNotes: String,
  },
  { timestamps: true }
);

// Calculate hectare from katha
surveySchema.pre('save', function (next) {
  this.orchardAreaHectare = (this.orchardAreaKatha * 0.0338).toFixed(4);
  this.totalProductionMT = (this.totalProductionKg * 0.001).toFixed(4);

  if (this.totalEarnings2081 && this.totalEarnings2082) {
    this.earningsGrowth = (
      ((this.totalEarnings2082 - this.totalEarnings2081) / this.totalEarnings2081) *
      100
    ).toFixed(2);
  }

  next();
});

export default mongoose.model('Survey', surveySchema);