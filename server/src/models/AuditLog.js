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
    required: true, // e.g., 'COMPLAINT_CREATED', 'VISITOR_APPROVED', 'DELIVERY_LOGGED'
  },
  targetType: {
    type: String, // 'Complaint', 'Visitor', 'Delivery', 'FacilityBooking', 'User'
  },
  targetId: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
