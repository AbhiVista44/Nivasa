import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'resident', 'security', 'vendor'],
    required: true,
    default: 'resident',
  },
  avatar: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'inactive'],
    default: 'active',
  },
  // Resident Specific
  wing: {
    type: String,
    default: '',
  },
  flatNumber: {
    type: String,
    default: '',
  },
  isOwner: {
    type: Boolean,
    default: true,
  },
  familyMembers: [{
    name: String,
    relation: String,
    phone: String,
  }],
  // Security Specific
  gatePost: {
    type: String,
    default: 'Main Gate',
  },
  badgeNumber: {
    type: String,
    default: '',
  },
  // Vendor Specific
  businessName: {
    type: String,
    default: '',
  },
  serviceCategory: {
    type: String,
    enum: ['', 'Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security', 'Appliances', 'Civil & Painting'],
    default: '',
  },
  rating: {
    type: Number,
    default: 5.0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique email per society (or globally)
userSchema.index({ email: 1, societyId: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
