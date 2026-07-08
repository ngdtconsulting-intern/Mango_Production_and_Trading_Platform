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

    // Location
    location: {
      ward: Number,
      tole: String,
      district: String,
      municipality: String,
      latitude: Number,
      longitude: Number,
    },

    // Area
    orchardAreaKatha: Number,
    orchardAreaHectare: Number,
    totalTreeCount: Number,
    bearingTreeCount: Number,

    // Varieties
    varieties: [
      {
        name: String,
        percentage: Number,
      },
    ],

    // Tree Age Distribution
    treeAgeDistribution: {
      '1-3': { type: Number, default: 0 },
      '4-5': { type: Number, default: 0 },
      '6-10': { type: Number, default: 0 },
      '11-15': { type: Number, default: 0 },
      '16-25': { type: Number, default: 0 },
      '26-40': { type: Number, default: 0 },
      '40+': { type: Number, default: 0 },
    },

    // Environment
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

    // Production
    lastHarvestDate: Date,
    lastHarvestQuantityKg: Number,
    lastHarvestRevenuNPR: Number,

    // Certifications
    certifications: [String],

    // Status
    active: { type: Boolean, default: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Calculate hectare
farmSchema.pre('save', function (next) {
  if (this.orchardAreaKatha) {
    this.orchardAreaHectare = (this.orchardAreaKatha * 0.0338).toFixed(4);
  }
  next();
});

export default mongoose.model('Farm', farmSchema);