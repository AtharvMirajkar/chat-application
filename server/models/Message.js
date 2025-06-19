import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    default: 'general',
  },
  type: {
    type: String,
    enum: ['text', 'system'],
    default: 'text',
  },
  isGuest: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Message', messageSchema);