import mongoose from 'mongoose';

const societySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  pincode: {
    type: String,
    required: true,
  },
  wings: [{
    name: String, // e.g. "Wing A", "Wing B"
    totalFloors: Number,
    flatsPerFloor: Number,
  }],
  totalFlats: {
    type: Number,
    default: 0,
  },
  amenities: [{
    name: String,
    icon: String,
    availableHours: String,
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'onboarding'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Society = mongoose.models.Society || mongoose.model('Society', societySchema);
