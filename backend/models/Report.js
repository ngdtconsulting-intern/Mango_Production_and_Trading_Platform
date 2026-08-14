import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterName: { type: String, required: true },
    reporterRole: {
      type: String,
      enum: ['farmer', 'trader'],
      required: true,
    },

    // Snapshotted from the reporter's address at submit time, so the report
    // still routes correctly even if they update their address later.
    province: String,
    district: { type: String, required: true },

    message: { type: String, maxlength: 1000 },
    imageUrl: String,

    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    officerNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);