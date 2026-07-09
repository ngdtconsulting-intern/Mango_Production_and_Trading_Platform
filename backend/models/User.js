import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['farmer', 'trader', 'admin', 'surveyor'],
      default: 'farmer',
    },
    avatar: String,
    verified: { type: Boolean, default: false },
    active: { type: Boolean, default: true },

    // Address
    address: {
      ward: Number,
      tole: String,
      district: String,
      municipality: String,
    },

    // Farmer specific
    farmCount: { type: Number, default: 0 },

    // Trader specific
    businessName: String,
    businessType: {
      type: String,
      enum: ['wholesaler', 'retailer', 'exporter', 'processor'],
    },

    // Metadata
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Hash password before saving
// DO NOT use async with next - use one or the other
userSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) return;

  const salt = await bcryptjs.genSalt(10);
  this.password = await bcryptjs.hash(this.password, salt);
});

// Compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcryptjs.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);