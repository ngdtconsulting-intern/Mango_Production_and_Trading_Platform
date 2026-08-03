import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    district: String,
    area: String,
    message: { type: String, maxlength: 1000 }, // no longer strictly required — a message can be image-only
    imageUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);