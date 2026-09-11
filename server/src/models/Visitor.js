import mongoose from 'mongoose';

const visitorTimelineSchema = new mongoose.Schema({
  stage: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  actor: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['resident', 'security', 'admin', 'system'],
    default: 'system',
  },
  note: {
    type: String,
    default: '',
  },
}, { _id: false });

const visitorSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  visitorNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  passcode: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  vehicleNumber: {
    type: String,
    trim: true,
    default: '',
  },
  photoUrl: {
    type: String,
    default: '',
  },
  flatNumber: {
    type: String,
    required: true,
    trim: true,
  },
  wing: {
    type: String,
    trim: true,
    default: 'Wing B',
  },
  hostResidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  hostResidentName: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['Guest', 'Delivery', 'Service', 'Cab', 'Other'],
    default: 'Guest',
  },
  status: {
    type: String,
    enum: ['Pre-Approved', 'Pending Approval', 'Approved', 'Rejected', 'Inside', 'Exited', 'Expired', 'Revoked'],
    default: 'Pre-Approved',
    index: true,
  },
  expectedDate: {
    type: Date,
    default: Date.now,
  },
  expectedTimeSlot: {
    type: String,
    default: 'Anytime',
  },
  entryTime: {
    type: Date,
    default: null,
  },
  exitTime: {
    type: Date,
    default: null,
  },
  entryGate: {
    type: String,
    default: 'Gate 1',
  },
  exitGate: {
    type: String,
    default: null,
  },
  securityGuardName: {
    type: String,
    default: '',
  },
  securityGuardBadge: {
    type: String,
    default: '',
  },
  approvalNotes: {
    type: String,
    default: '',
  },
  timeline: [visitorTimelineSchema],
}, {
  timestamps: true,
});

visitorSchema.index({ societyId: 1, status: 1 });
visitorSchema.index({ societyId: 1, flatNumber: 1 });

export const Visitor = mongoose.model('Visitor', visitorSchema);
