import mongoose from 'mongoose';

const buyingRequirementSchema = new mongoose.Schema(
  {
    traderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Product
    variety: { type: String, required: true },
    quantityMT: { type: Number, required: true, min: 0.1 },
    quantityKg: Number,

    // Quality & Location
    quality: {
      type: String,
      enum: ['premium', 'good', 'fair'],
      default: 'good',
    },
    location: {
      district: String,
      municipality: String,
      ward: Number,
    },

    // Pricing
    budget: {
      minPricePerKg: Number,
      maxPricePerKg: Number,
      negotiable: { type: Boolean, default: true },
    },

    // Timeline
    requiredByDate: Date,

    // Contact
    contact: {
      phone: String,
      email: String,
    },

    // Responses
    responses: [
      {
        farmerId: mongoose.Schema.Types.ObjectId,
        farmerName: String,
        availableQuantityKg: Number,
        proposedPricePerKg: Number,
        message: String,
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        respondedAt: { type: Date, default: Date.now },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open',
    },

    responseCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true, indexes: [{ traderId: 1 }, { status: 1 }, { variety: 1 }] }
);

// Calculate kg from MT
buyingRequirementSchema.pre('save', function (next) {
  this.quantityKg = this.quantityMT * 1000;
  next();
});

export default mongoose.model('BuyingRequirement', buyingRequirementSchema);