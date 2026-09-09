import mongoose from 'mongoose';

const timelineEventSchema = new mongoose.Schema({
  stage: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  complaintNumber: {
    type: String,
    required: true,
    trim: true,
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  residentName: {
    type: String,
    required: true,
  },
  residentPhone: {
    type: String,
    required: true,
  },
  flatNumber: {
    type: String,
    required: true, // e.g. 'B-402'
  },
  wing: {
    type: String,
    required: true, // e.g. 'Wing B (Sapphire)'
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Civil & Painting', 'Appliances', 'Security', 'General'],
    default: 'General',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium',
  },
  aiClassification: {
    isAiAssisted: { type: Boolean, default: false },
    suggestedCategory: { type: String, default: '' },
    suggestedPriority: { type: String, default: '' },
    summary: { type: String, default: '' },
    confidence: { type: Number, default: 0.9 },
  },
  preferredVisitTime: {
    type: String,
    default: 'Anytime during daytime',
  },
  photos: [{
    type: String, // URLs
  }],
  status: {
    type: String,
    enum: [
      'Created',
      'Under Review',
      'Assigned',
      'Accepted',
      'Scheduled',
      'In Progress',
      'Completed',
      'Resident Confirmed',
      'Closed'
    ],
    default: 'Created',
  },
  assignedVendor: {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    vendorName: String,
    businessName: String,
    phone: String,
    serviceCategory: String,
  },
  scheduledVisitDate: {
    type: String,
    default: '',
  },
  scheduledTimeSlot: {
    type: String,
    default: '',
  },
  vendorWorkNotes: {
    type: String,
    default: '',
  },
  residentRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  residentFeedback: {
    type: String,
    default: '',
  },
  timeline: [timelineEventSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

complaintSchema.index({ societyId: 1, complaintNumber: 1 }, { unique: true });
complaintSchema.index({ societyId: 1, status: 1 });
complaintSchema.index({ societyId: 1, flatNumber: 1 });

export const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
