import mongoose from 'mongoose';

const flatSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  wing: {
    type: String,
    required: true, // e.g., 'Wing A', 'Wing B', 'Wing C'
    trim: true,
  },
  flatNumber: {
    type: String,
    required: true, // e.g., 'A-101', 'B-402'
    trim: true,
  },
  floor: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Penthouse', 'Admin Suite'],
    default: '3 BHK',
  },
  areaSqFt: {
    type: Number,
    default: 1450,
  },
  status: {
    type: String,
    enum: ['occupied', 'vacant', 'maintenance'],
    default: 'occupied',
  },
  occupancyType: {
    type: String,
    enum: ['owner', 'tenant', 'vacant'],
    default: 'owner',
  },
  primaryResident: {
    name: String,
    email: String,
    phone: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  familyMembers: [{
    name: String,
    relation: String,
    phone: String,
  }],
  vehicles: [{
    type: { type: String, enum: ['4-Wheeler', '2-Wheeler'] },
    model: String,
    regNumber: String,
  }],
  allocatedParkingSlot: {
    type: String, // e.g., 'P-114 (Basement 1)'
    default: '',
  },
  intercomNumber: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound unique index per society
flatSchema.index({ societyId: 1, flatNumber: 1 }, { unique: true });

export const Flat = mongoose.models.Flat || mongoose.model('Flat', flatSchema);
