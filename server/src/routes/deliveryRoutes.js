import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { storageService } from '../services/storageService.js';
import { socketService } from '../services/socketService.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get deliveries (role-scoped, with filters: flatNumber, status, carrier)
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { status, flatNumber, carrier } = req.query;

    const query = { status, flatNumber, carrier };

    // Residents only see parcels for their own flat
    if (req.user.role === 'resident') {
      query.flatNumber = req.user.flatNumber || query.flatNumber;
    }

    const deliveries = await dataStore.getDeliveries(societyId, query);
    res.json({
      success: true,
      count: deliveries.length,
      deliveries,
    });
  } catch (error) {
    console.error('Fetch deliveries error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve deliveries.' });
  }
});

// 2. Get waiting packages count (quick badge query)
router.get('/waiting-count', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const flatNumber = req.user.role === 'resident' ? req.user.flatNumber : req.query.flatNumber;

    const count = await dataStore.getPendingDeliveriesCount(societyId, flatNumber);
    res.json({
      success: true,
      waitingCount: count,
    });
  } catch (error) {
    console.error('Fetch waiting deliveries count error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch waiting count.' });
  }
});

// 3. Security logs incoming delivery parcel
router.post('/', verifyToken, requireRoles('security', 'admin'), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const {
      flatNumber,
      wing,
      residentName,
      carrier,
      packageCount,
      trackingNumber,
      arrivalGate,
      notes,
      photoBase64,
      requiresCourierOtp,
    } = req.body;

    if (!flatNumber) {
      return res.status(400).json({
        success: false,
        message: 'Recipient flat number is required.',
      });
    }

    let photoUrl = '';
    if (photoBase64 && typeof photoBase64 === 'string' && photoBase64.startsWith('data:image/')) {
      try {
        const matches = photoBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.split('/')[1] || 'jpeg';
          const filename = `delivery_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          photoUrl = await storageService.uploadFile(buffer, filename, mimeType, 'deliveries');
        }
      } catch (uploadErr) {
        console.warn('Delivery photo upload failed, continuing without photo:', uploadErr.message);
      }
    }

    const delivery = await dataStore.logDelivery({
      societyId,
      flatNumber,
      wing: wing || '',
      residentName: residentName || '',
      carrier: carrier || 'Amazon',
      packageCount: Number(packageCount) || 1,
      trackingNumber: trackingNumber || '',
      photoUrl,
      requiresCourierOtp: requiresCourierOtp !== undefined ? requiresCourierOtp : true,
      arrivalGate: arrivalGate || 'Main Gate 1',
      notes: notes || '',
    }, req.user);

    // Real-time broadcast to Resident flat
    socketService.broadcastDeliveryArrival(societyId, delivery);

    res.status(201).json({
      success: true,
      message: `Delivery ${delivery.deliveryNumber} logged at gate for flat ${delivery.flatNumber}.`,
      delivery,
    });
  } catch (error) {
    console.error('Log delivery error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to log delivery.' });
  }
});

// 4. Resident shares courier OTP (e.g. Amazon/Flipkart PIN) with Gate Security
router.post('/:id/share-courier-otp', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP is required.',
      });
    }

    const delivery = await dataStore.shareCourierDeliveryOtp(id, otp, req.user);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found.',
      });
    }

    res.json({
      success: true,
      message: `Courier delivery OTP shared with Gate Security.`,
      delivery,
    });
  } catch (error) {
    if (error.code === 'UNAUTHORIZED') {
      return res.status(403).json({ success: false, message: error.message });
    }
    console.error('Share courier OTP error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to share courier OTP.' });
  }
});

// 5. Security marks courier OTP as shared with delivery agent
router.post('/:id/otp-shared', verifyToken, requireRoles('security', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await dataStore.markCourierOtpShared(id, req.user);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found.',
      });
    }

    res.json({
      success: true,
      message: `OTP marked as shared with ${delivery.carrier} courier. Parcel safely stored at gate.`,
      delivery,
    });
  } catch (error) {
    console.error('Mark OTP shared error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update delivery status.' });
  }
});

// 6. Resident or Security confirms pickup / collection
router.post('/:id/pickup', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    const delivery = await dataStore.confirmDeliveryPickup(id, otp, req.user);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found.',
      });
    }

    res.json({
      success: true,
      message: `Parcel ${delivery.deliveryNumber} marked as Picked Up.`,
      delivery,
    });
  } catch (error) {
    if (error.code === 'INVALID_OTP') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Confirm pickup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to confirm delivery pickup.' });
  }
});

export default router;
