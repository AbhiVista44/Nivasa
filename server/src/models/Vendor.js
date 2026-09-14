import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flatNumber: { type: String },
  score: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, trim: true, maxlength: 300 },
  date: { type: Date, default: Date.now },
});

const vendorSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  businessName: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Plumbing', 'Electrical', 'Civil', 'Carpentry', 'Pest Control', 'Cleaning', 'Painting', 'Appliance Repair', 'Other'],
    required: true,
    index: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  emergencyPhone: {
    type: String,
    trim: true, // 24/7 emergency line
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  serviceAreas: {
    type: [String],
    default: [],
  },
  licenseNumber: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 400,
  },
  tags: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
  isEmergencyContact: {
    type: Boolean,
    default: false,
  },
  ratings: [ratingSchema],
  avgRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  addedBy: {
    type: String, // admin name
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

vendorSchema.index({ societyId: 1, category: 1, status: 1 });

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);
