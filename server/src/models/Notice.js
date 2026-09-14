import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150,
  },
  body: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['urgent', 'society-wide', 'wing-specific', 'scheduled'],
    default: 'society-wide',
    index: true,
  },
  targetWing: {
    type: String,
    default: null, // null = all wings
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  authorName: {
    type: String,
    required: true,
  },
  authorRole: {
    type: String,
    default: 'admin',
  },
  // For scheduled notices - publish after this datetime
  scheduledAt: {
    type: Date,
    default: null,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  // Array of userIds who have read this notice
  readBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      readAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

noticeSchema.index({ societyId: 1, type: 1, createdAt: -1 });

export const Notice = mongoose.models.Notice || mongoose.model('Notice', noticeSchema);
