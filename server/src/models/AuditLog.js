import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  actorName: {
    type: String,
    required: true,
  },
  actorRole: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true, // e.g., 'NOTICE_CREATED', 'VENDOR_ADDED', 'COMPLAINT_CLOSED'
  },
  targetType: {
    type: String, // 'Notice', 'Vendor', 'Complaint', 'Visitor', 'Delivery', 'FacilityBooking', 'User'
  },
  targetId: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
    index: true,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for efficient society-scoped chronological queries
auditLogSchema.index({ societyId: 1, timestamp: -1 });
auditLogSchema.index({ societyId: 1, severity: 1, timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

