import mongoose from 'mongoose';

const facilityBookingSchema = new mongoose.Schema({
  societyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true,
  },
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  facilityId: {
    type: String,
    required: true,
    index: true,
  },
  facilityName: {
    type: String,
    required: true,
  },
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  residentName: {
    type: String,
    required: true,
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
    default: '',
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true,
    index: true,
  },
  startTime: {
    type: String, // 'HH:MM' (24-hour)
    required: true,
  },
  endTime: {
    type: String, // 'HH:MM' (24-hour)
    required: true,
  },
  purpose: {
    type: String,
    default: 'Recreation & Fitness',
  },
  guestCount: {
    type: Number,
    default: 1,
    min: 1,
  },
  status: {
    type: String,
    enum: ['Booked', 'Cancelled', 'Completed'],
    default: 'Booked',
    index: true,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelledBy: {
    type: String,
    default: '',
  },
  cancellationReason: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

facilityBookingSchema.index({ societyId: 1, facilityId: 1, date: 1, status: 1 });
facilityBookingSchema.index({ societyId: 1, flatNumber: 1, status: 1 });

export const FacilityBooking = mongoose.models.FacilityBooking || mongoose.model('FacilityBooking', facilityBookingSchema);
