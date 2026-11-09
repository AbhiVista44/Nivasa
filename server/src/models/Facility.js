import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: false,
    index: true,
  },
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: 'General',
  },
  icon: {
    type: String,
    default: 'Building2',
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 50,
  },
  openingHours: {
    type: String,
    default: '06:00 - 22:00',
  },
  slotDurationMinutes: {
    type: Number,
    default: 60,
  },
  rules: [{
    type: String,
  }],
  pricing: {
    type: String,
    default: 'Complimentary for residents',
  },
  imageUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

facilitySchema.index({ societyId: 1, id: 1 }, { unique: true });

export const Facility = mongoose.models.Facility || mongoose.model('Facility', facilitySchema);

