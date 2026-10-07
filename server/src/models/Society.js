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
    default: '',
    trim: true,
  },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  pincode: {
    type: String,
    default: '000000',
    trim: true,
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
