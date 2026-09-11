import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { storageService } from '../services/storageService.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get visitors (role-scoped, with filters: status, flatNumber, type, search)
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { status, flatNumber, type, search } = req.query;

    const query = { status, flatNumber, type, search };

    // Residents only see visitors for their flat
    if (req.user.role === 'resident') {
      query.flatNumber = req.user.flatNumber || query.flatNumber;
    }

    const visitors = await dataStore.getVisitors(societyId, query);
    res.json({
      success: true,
      count: visitors.length,
      visitors,
    });
  } catch (error) {
    console.error('Fetch visitors error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve visitors.' });
  }
});

// 2. Get visitors currently inside society ("Active In-Society Roster")
router.get('/inside', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const insideVisitors = await dataStore.getInsideVisitors(societyId);
    res.json({
      success: true,
      count: insideVisitors.length,
      visitors: insideVisitors,
    });
  } catch (error) {
    console.error('Fetch inside visitors error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve inside visitors.' });
  }
});

// 3. Get pending approvals (residents see for their flat, security sees all)
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const flatNumber = req.user.role === 'resident' ? req.user.flatNumber : req.query.flatNumber;

    const pending = await dataStore.getPendingApprovals(societyId, flatNumber);
    res.json({
      success: true,
      count: pending.length,
      visitors: pending,
    });
  } catch (error) {
    console.error('Fetch pending approvals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending approvals.' });
  }
});

// 4. Resident pre-authorizes visitor (creates digital pass with 6-digit PIN)
router.post('/pre-authorize', verifyToken, requireRoles('resident', 'admin'), async (req, res) => {
  try {
    const { name, phone, vehicleNumber, type, expectedDate, expectedTimeSlot, flatNumber, wing } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Guest name and phone number are required.' });
    }

    const pass = await dataStore.createPreAuthorization(
      {
        name,
        phone,
        vehicleNumber,
        type: type || 'Guest',
        expectedDate,
        expectedTimeSlot,
        flatNumber: flatNumber || req.user.flatNumber,
        wing: wing || req.user.wing,
      },
      req.user
    );

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'PRE_AUTHORIZE_VISITOR',
      targetType: 'Visitor',
      targetId: pass._id?.toString() || pass.visitorNumber,
      details: { guestName: name, flatNumber: req.user.flatNumber, passcode: pass.passcode },
    });

    res.status(201).json({
      success: true,
      message: 'Visitor pass pre-authorized successfully.',
      pass,
    });
  } catch (error) {
    console.error('Pre-authorization error:', error);
    res.status(500).json({ success: false, message: 'Failed to pre-authorize visitor pass.' });
  }
});

// 5. Security Guard registers walk-in visitor
router.post('/walk-in', verifyToken, requireRoles('security', 'admin'), async (req, res) => {
  try {
    const { name, phone, vehicleNumber, flatNumber, wing, type, autoApprove, photoUrl } = req.body;

    if (!name || !flatNumber) {
      return res.status(400).json({ success: false, message: 'Visitor name and destination flat are required.' });
    }

    // If photo is captured via webcam as base64 Data URI, upload to Backblaze B2
    let resolvedPhotoUrl = photoUrl || '';
    if (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('data:image')) {
      try {
        const uploadResult = await storageService.uploadImage({
          dataUri: photoUrl,
          folder: 'visitors',
        });
        resolvedPhotoUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('Visitor photo upload to storage failed:', uploadErr.message);
      }
    }

    const visitor = await dataStore.registerWalkInVisitor(
      {
        name,
        phone: phone || '',
        vehicleNumber: vehicleNumber || '',
        flatNumber,
        wing: wing || '',
        type: type || 'Guest',
        autoApprove: !!autoApprove,
        photoUrl: resolvedPhotoUrl,
        societyId: req.user.societyId,
      },
      req.user
    );

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'REGISTER_WALKIN_VISITOR',
      targetType: 'Visitor',
      targetId: visitor._id?.toString() || visitor.visitorNumber,
      details: { visitorName: name, flatNumber, status: visitor.status },
    });

    res.status(201).json({
      success: true,
      message: visitor.status === 'Inside'
        ? 'Walk-in visitor approved and inside.'
        : 'Walk-in visitor registered. Resident approval requested.',
      visitor,
    });
  } catch (error) {
    console.error('Walk-in registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to register walk-in visitor.' });
  }
});

// 6. Security verifies 6-digit passcode or QR payload
router.post('/verify', verifyToken, requireRoles('security', 'admin'), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { passcode } = req.body;

    if (!passcode || !passcode.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a 6-digit passcode to verify.' });
    }

    const pass = await dataStore.verifyPasscode(societyId, passcode.trim());

    if (!pass) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or Expired Passcode. No active pre-authorized entry found.',
      });
    }

    res.json({
      success: true,
      message: `Passcode Verified! Pre-authorized for Flat ${pass.flatNumber}`,
      pass,
    });
  } catch (error) {
    console.error('Passcode verify error:', error);
    res.status(500).json({ success: false, message: 'Passcode verification failed.' });
  }
});

// 7. Security authorizes gate entry
router.post('/:id/entry', verifyToken, requireRoles('security', 'admin'), async (req, res) => {
  try {
    const updated = await dataStore.recordEntry(req.params.id, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Visitor pass not found.' });
    }

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'GATE_ENTRY_RECORDED',
      targetType: 'Visitor',
      targetId: updated._id?.toString() || updated.visitorNumber,
      details: { visitorName: updated.name, flatNumber: updated.flatNumber },
    });

    res.json({
      success: true,
      message: `${updated.name} authorized into society.`,
      visitor: updated,
    });
  } catch (error) {
    console.error('Gate entry error:', error);
    res.status(500).json({ success: false, message: 'Failed to record gate entry.' });
  }
});

// 8. Security records visitor exit
router.post('/:id/exit', verifyToken, requireRoles('security', 'admin'), async (req, res) => {
  try {
    const updated = await dataStore.recordExit(req.params.id, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Visitor record not found.' });
    }

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'GATE_EXIT_RECORDED',
      targetType: 'Visitor',
      targetId: updated._id?.toString() || updated.visitorNumber,
      details: { visitorName: updated.name, flatNumber: updated.flatNumber },
    });

    res.json({
      success: true,
      message: `Exit recorded for ${updated.name}.`,
      visitor: updated,
    });
  } catch (error) {
    console.error('Gate exit error:', error);
    res.status(500).json({ success: false, message: 'Failed to record gate exit.' });
  }
});

// 9. Resident approves walk-in visitor
router.post('/:id/approve', verifyToken, requireRoles('resident', 'admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await dataStore.respondToApproval(req.params.id, true, notes, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Visitor request not found.' });
    }

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RESIDENT_APPROVED_VISITOR',
      targetType: 'Visitor',
      targetId: updated._id?.toString() || updated.visitorNumber,
      details: { visitorName: updated.name, flatNumber: updated.flatNumber },
    });

    res.json({
      success: true,
      message: `Gate entry approved for ${updated.name}.`,
      visitor: updated,
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve visitor entry.' });
  }
});

// 10. Resident denies walk-in visitor
router.post('/:id/reject', verifyToken, requireRoles('resident', 'admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await dataStore.respondToApproval(req.params.id, false, notes, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Visitor request not found.' });
    }

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RESIDENT_REJECTED_VISITOR',
      targetType: 'Visitor',
      targetId: updated._id?.toString() || updated.visitorNumber,
      details: { visitorName: updated.name, flatNumber: updated.flatNumber },
    });

    res.json({
      success: true,
      message: `Gate entry denied for ${updated.name}.`,
      visitor: updated,
    });
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({ success: false, message: 'Failed to deny visitor entry.' });
  }
});

// 11. Resident revokes pre-authorized pass
router.post('/:id/revoke', verifyToken, requireRoles('resident', 'admin'), async (req, res) => {
  try {
    const updated = await dataStore.revokePass(req.params.id, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Pass not found.' });
    }

    res.json({
      success: true,
      message: 'Visitor pass revoked.',
      visitor: updated,
    });
  } catch (error) {
    console.error('Revoke pass error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke pass.' });
  }
});

export default router;
