import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  deliveryNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  flatNumber: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  wing: {
    type: String,
    trim: true,
    default: 'Wing B',
  },
  residentName: {
    type: String,
    trim: true,
    default: '',
  },
  carrier: {
    type: String,
    enum: ['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BlueDart', 'DTDC', 'India Post', 'Other'],
    default: 'Amazon',
    required: true,
  },
  packageCount: {
    type: Number,
    default: 1,
    min: 1,
  },
  trackingNumber: {
    type: String,
    trim: true,
    default: '',
  },
  photoUrl: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Waiting for Courier OTP', 'Waiting at Gate', 'Picked Up', 'Returned'],
    default: 'Waiting at Gate',
    index: true,
  },
  requiresCourierOtp: {
    type: Boolean,
    default: true,
  },
  courierDeliveryOtp: {
    type: String,
    default: '',
    trim: true,
  },
  otpSharedWithCourier: {
    type: Boolean,
    default: false,
  },
  otpSharedAt: {
    type: Date,
    default: null,
  },
  arrivalGate: {
    type: String,
    default: 'Main Gate 1',
  },
  securityGuardName: {
    type: String,
    default: 'Gate Security',
  },
  arrivedAt: {
    type: Date,
    default: Date.now,
  },
  pickedUpAt: {
    type: Date,
    default: null,
  },
  pickedUpBy: {
    type: String,
    default: '',
  },
  pickupOtp: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

deliverySchema.index({ societyId: 1, status: 1 });
deliverySchema.index({ societyId: 1, flatNumber: 1, status: 1 });

export const Delivery = mongoose.models.Delivery || mongoose.model('Delivery', deliverySchema);
