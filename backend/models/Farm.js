import mongoose from 'mongoose';

const farmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmName: { type: String, required: true, trim: true },
    description: String,

    location: {
      ward: Number,
      tole: String,
      district: String,
      municipality: String,
      latitude: Number,
      longitude: Number,
    },

    orchardAreaKatha: Number,
    orchardAreaHectare: Number,
    totalTreeCount: Number,
    bearingTreeCount: Number,

    varieties: [
      {
        name: String,
        percentage: Number,
      },
    ],

    treeAgeDistribution: {
      '1-3': { type: Number, default: 0 },
      '4-5': { type: Number, default: 0 },
      '6-10': { type: Number, default: 0 },
      '11-15': { type: Number, default: 0 },
      '16-25': { type: Number, default: 0 },
      '26-40': { type: Number, default: 0 },
      '40+': { type: Number, default: 0 },
    },

    soilType: {
      type: String,
      enum: ['loamy', 'sandy', 'clay', 'mixed'],
      default: 'loamy',
    },
    terrain: {
      type: String,
      enum: ['flat', 'sloped', 'hilly'],
      default: 'flat',
    },
    irrigationSystem: {
      type: String,
      enum: ['drip', 'flood', 'sprinkler', 'rainfed'],
      default: 'rainfed',
    },

    lastHarvestDate: Date,
    lastHarvestQuantityKg: Number,
    lastHarvestRevenuNPR: Number,

    certifications: [String],

    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// No next() - just use async without it
farmSchema.pre('save', async function () {
  if (this.orchardAreaKatha) {
    this.orchardAreaHectare = parseFloat((this.orchardAreaKatha * 0.0338).toFixed(4));
  }
});

export default mongoose.model('Farm', farmSchema);