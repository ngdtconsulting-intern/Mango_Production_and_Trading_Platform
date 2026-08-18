import mongoose from 'mongoose';
import {
  calculateExpectedProduction,
  calculateYieldGap,
  getCurrentBsYear,
  kathaToHectare,
  kgToMetricTonnes,
  MIN_CENSUS_YEAR_BS,
} from '../utils/constants.js';

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

    // Census year (Bikram Sambat). One survey per farmer per year — this is
    // what makes the survey an annual census rather than a one-off form.
    surveyYearBS: {
      type: Number,
      required: true,
      min: MIN_CENSUS_YEAR_BS,
      default: () => getCurrentBsYear(),
      index: true,
    },

    age: { type: Number, required: true, min: 18, max: 100 },
    educationLevel: { type: String, required: true },

    // Farm location (may differ from farmer's home address)
    province: { type: String, required: true },
    district: { type: String, required: true },
    municipality: { type: String, required: true },

    // Household
    householdMembers: { type: Number, required: true, min: 1 },

    // Orchard
    orchardAreaKatha: { type: Number, required: true, min: 0.1 },
    orchardAreaHectare: Number,
    totalMangoTrees: { type: Number, required: true, min: 1 },

    // Tree Age Distribution
    treeAgeDistribution: [treeAgeSchema],

    // Derived from treeAgeDistribution via the TREE_AGE_BRACKETS table.
    // Stored rather than computed on read so each census year keeps the
    // figures it was verified against, even if the table is revised later.
    bearingTreeCount: { type: Number, default: 0 },
    expectedProductionKg: { type: Number, default: 0 },
    expectedProductionMinKg: { type: Number, default: 0 },
    expectedProductionMaxKg: { type: Number, default: 0 },
    yieldGapKg: { type: Number, default: 0 },
    yieldGapPercent: Number,
    yieldFlag: String,

    // Management
    selfManaged: Boolean,
    managementType: String,
    productionCostNPR: Number,

    // Production Data
    totalProductionKg: { type: Number, default: 0 },
    totalProductionMT: { type: Number, default: 0 },

    // Earnings, keyed relative to the census year rather than to hard-coded
    // BS years, so next year's census needs no schema change.
    earningsCurrentYearNPR: { type: Number, default: 0 },
    earningsPreviousYearNPR: { type: Number, default: 0 },

    // Legacy fields kept in sync by the pre-save hook so surveys recorded
    // before the census rework keep rendering. Prefer the fields above.
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
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
  },
  { timestamps: true }
);

// One census record per farmer per year.
surveySchema.index({ farmerId: 1, surveyYearBS: 1 }, { unique: true });

// District roll-ups for a given year are the officer's most common query.
surveySchema.index({ surveyYearBS: 1, district: 1, status: 1 });

/**
 * Recompute every derived field from the raw answers. Kept in one place so
 * create and update produce identical results.
 */
surveySchema.methods.recalculateDerivedFields = function () {
  this.orchardAreaHectare = kathaToHectare(this.orchardAreaKatha);
  this.totalProductionMT = kgToMetricTonnes(this.totalProductionKg);

  // Bridge legacy and generic earnings fields in whichever direction has data.
  if (!this.earningsCurrentYearNPR && this.totalEarnings2082) {
    this.earningsCurrentYearNPR = this.totalEarnings2082;
  }
  if (!this.earningsPreviousYearNPR && this.totalEarnings2081) {
    this.earningsPreviousYearNPR = this.totalEarnings2081;
  }
  this.totalEarnings2082 = this.earningsCurrentYearNPR || 0;
  this.totalEarnings2081 = this.earningsPreviousYearNPR || 0;

  if (this.earningsPreviousYearNPR > 0) {
    this.earningsGrowth = parseFloat(
      (
        ((this.earningsCurrentYearNPR - this.earningsPreviousYearNPR) /
          this.earningsPreviousYearNPR) *
        100
      ).toFixed(2)
    );
  } else {
    this.earningsGrowth = undefined;
  }

  // Expected production from the tree-age table, and the gap against what
  // the farmer actually reported.
  const expected = calculateExpectedProduction(this.treeAgeDistribution);
  this.bearingTreeCount = expected.bearingTrees;
  this.expectedProductionKg = expected.expectedKg;
  this.expectedProductionMinKg = expected.minKg;
  this.expectedProductionMaxKg = expected.maxKg;

  const gap = calculateYieldGap(
    expected.expectedKg,
    this.totalProductionKg,
    expected.totalTrees
  );
  this.yieldGapKg = gap.gapKg;
  this.yieldGapPercent = gap.gapPercent ?? undefined;
  this.yieldFlag = gap.flag;
};

surveySchema.pre('save', async function () {
  this.recalculateDerivedFields();
});

export default mongoose.model('Survey', surveySchema);
