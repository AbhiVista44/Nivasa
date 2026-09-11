import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all society facilities / amenities directory
router.get('/', verifyToken, async (req, res) => {
  try {
    const facilities = dataStore.getFacilityList();
    res.json({
      success: true,
      facilities,
    });
  } catch (error) {
    console.error('Fetch facilities directory error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve society facilities.' });
  }
});

// 2. Check facility availability for a specific date (returns booked slots for timeline)
router.get('/availability', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
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

// 3. Get bookings list (role-scoped: resident sees their flat, admin sees all)
router.get('/bookings', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { facilityId, date, status, flatNumber } = req.query;

    const query = { facilityId, date, status };

    if (req.user.role === 'resident') {
      // If resident wants to view all bookings for a facility to see calendar, allow facilityId + date
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

// 4. Create facility booking with atomic conflict prevention and flat quota check
router.post('/book', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
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

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for ${booking.facilityName} (${booking.bookingNumber}).`,
      booking,
    });
  } catch (error) {
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
    res.status(500).json({ success: false, message: error.message || 'Failed to complete facility reservation.' });
  }
});

// 5. Cancel facility booking (Resident owner or Admin)
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
