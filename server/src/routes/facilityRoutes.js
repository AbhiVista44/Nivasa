import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all society facilities / amenities directory
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = (req.user.role === 'superadmin' && req.headers['x-society-id']) || req.user.societyId;
    const facilities = await dataStore.getFacilityList(societyId);
    res.json({
      success: true,
      facilities,
    });
  } catch (error) {
    console.error('Fetch facilities directory error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve society facilities.' });
  }
});

// 2. Admin sets/updates facility capacity
router.put('/:id/capacity', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const societyId = (req.user.role === 'superadmin' && req.headers['x-society-id']) || req.user.societyId;
    const { id } = req.params;
    const { capacity } = req.body;

    if (!capacity || parseInt(capacity, 10) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a valid number greater than 0.',
      });
    }

    const updated = await dataStore.updateFacilityCapacity(societyId, id, capacity, req.user);
    res.json({
      success: true,
      message: `Capacity for ${updated.name || id} updated to ${updated.capacity} guests.`,
      facility: updated,
    });
  } catch (error) {
    console.error('Update facility capacity error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update capacity.' });
  }
});

// 3. Check facility availability for a specific date (returns booked/pending slots for timeline)
router.get('/availability', verifyToken, async (req, res) => {
  try {
    const societyId = (req.user.role === 'superadmin' && req.headers['x-society-id']) || req.user.societyId;
    const { facilityId, date } = req.query;

    if (!facilityId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Both facilityId and date parameters are required.',
      });
    }

    const bookedSlots = await dataStore.checkFacilityAvailability(societyId, facilityId, date);
    res.json({
      success: true,
      facilityId,
      date,
      bookedSlots,
    });
  } catch (error) {
    console.error('Check facility availability error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify slot availability.' });
  }
});

// 4. Get bookings list (role-scoped: resident sees their flat, admin sees all)
router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const societyId = (req.user.role === 'superadmin' && req.headers['x-society-id']) || req.user.societyId;
    const { facilityId, date, status, flatNumber } = req.query;

    const query = { facilityId, date, status };

    if (req.user.role === 'resident') {
      if (!facilityId && !date) {
        query.flatNumber = req.user.flatNumber;
      }
    } else if (flatNumber) {
      query.flatNumber = flatNumber;
    }

    const bookings = await dataStore.getFacilityBookings(societyId, query);
    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('Fetch facility bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

// 5. Create facility booking with atomic conflict prevention and flat quota check
router.post('/book', verifyToken, async (req, res) => {
  try {
    const societyId = (req.user.role === 'superadmin' && req.headers['x-society-id']) || req.user.societyId;
    const {
      facilityId,
      facilityName,
      date,
      startTime,
      endTime,
      purpose,
      guestCount,
      flatNumber,
      residentName,
    } = req.body;

    const targetFlat = req.user.role === 'resident'
      ? req.user.flatNumber
      : (flatNumber || 'Admin Suite');
    const targetResident = req.user.role === 'resident'
      ? req.user.name
      : (residentName || req.user.name);

    const booking = await dataStore.createFacilityBooking({
      societyId,
      facilityId,
      facilityName,
      date,
      startTime,
      endTime,
      purpose,
      guestCount,
      flatNumber: targetFlat,
      residentName: targetResident,
      wing: req.user.wing || '',
    }, req.user);

    const confirmationMsg = booking.status === 'Pending'
      ? `Booking request submitted for ${booking.facilityName} (${booking.bookingNumber}). Awaiting admin approval.`
      : `Reservation confirmed for ${booking.facilityName} (${booking.bookingNumber}).`;

    res.status(201).json({
      success: true,
      message: confirmationMsg,
      booking,
    });
  } catch (error) {
    if (error.code === 'CAPACITY_EXCEEDED') {
      return res.status(400).json({
        success: false,
        code: 'CAPACITY_EXCEEDED',
        message: error.message,
      });
    }
    if (error.code === 'SLOT_CONFLICT') {
      return res.status(409).json({
        success: false,
        code: 'SLOT_CONFLICT',
        message: error.message,
      });
    }
    if (error.code === 'QUOTA_EXCEEDED') {
      return res.status(400).json({
        success: false,
        code: 'QUOTA_EXCEEDED',
        message: error.message,
      });
    }
    console.error('Facility booking error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to complete facility reservation.' });
  }
});

// 6. Admin approves facility booking request
router.post('/bookings/:id/approve', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const approved = await dataStore.approveFacilityBooking(id, req.user);
    if (!approved) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }
    res.json({
      success: true,
      message: `Booking request ${approved.bookingNumber} for ${approved.facilityName} has been approved.`,
      booking: approved,
    });
  } catch (error) {
    console.error('Approve facility booking error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve booking.' });
  }
});

// 7. Admin rejects facility booking request
router.post('/bookings/:id/reject', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejected = await dataStore.rejectFacilityBooking(id, reason, req.user);
    if (!rejected) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }
    res.json({
      success: true,
      message: `Booking request ${rejected.bookingNumber} for ${rejected.facilityName} has been rejected.`,
      booking: rejected,
    });
  } catch (error) {
    console.error('Reject facility booking error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reject booking.' });
  }
});

// 8. Cancel facility booking (Resident owner or Admin)
router.post('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const cancelledBooking = await dataStore.cancelFacilityBooking(id, reason, req.user);
    if (!cancelledBooking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    res.json({
      success: true,
      message: `Booking ${cancelledBooking.bookingNumber} has been successfully cancelled.`,
      booking: cancelledBooking,
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to cancel booking.' });
  }
});

export default router;
