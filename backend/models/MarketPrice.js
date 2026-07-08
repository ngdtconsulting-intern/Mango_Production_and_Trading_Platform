import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema(
  {
    market: {
      type: String,
      required: true,
      enum: ['Kalimati', 'Balkhu', 'Lahan', 'Janakpur', 'Hetauda', 'Bhaktapur', 'Kathmandu'],
    },
    variety: { type: String, required: true },
    date: { type: Date, default: Date.now },

    wholesalePricePerKg: { type: Number, required: true, min: 0 },
    retailPricePerKg: { type: Number, required: true, min: 0 },
    avgPrice: Number,

    quality: {
      type: String,
      enum: ['premium', 'good', 'fair', 'poor'],
      default: 'good',
    },
    supply: {
      type: String,
      enum: ['abundant', 'normal', 'scarce'],
      default: 'normal',
    },

    source: {
      type: String,
      enum: ['manual', 'api', 'survey'],
      default: 'manual',
    },
    verifiedBy: mongoose.Schema.Types.ObjectId,
  },
  { timestamps: true, indexes: [{ market: 1, variety: 1, date: -1 }] }
);

// Calculate average price
marketPriceSchema.pre('save', function (next) {
  this.avgPrice = (this.wholesalePricePerKg + this.retailPricePerKg) / 2;
  next();
});

export default mongoose.model('MarketPrice', marketPriceSchema);