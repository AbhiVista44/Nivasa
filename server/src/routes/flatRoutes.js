import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all flats for society (with wing/status/search query)
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { wing, status, search } = req.query;

    const flats = await dataStore.getFlats(societyId, { wing, status, search });
    res.json({
      success: true,
      count: flats.length,
      flats,
    });
  } catch (error) {
    console.error('Fetch flats error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve society flats.' });
  }
});

// Quick flat lookup by number (For Security Gate Intercom & Verification)
router.get('/lookup/:flatNumber', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const flat = await dataStore.getFlatByNumber(societyId, req.params.flatNumber.toUpperCase());
    if (!flat) {
      return res.status(404).json({ success: false, message: `Flat ${req.params.flatNumber} not found in society.` });
    }
    res.json({ success: true, flat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Flat lookup failed.' });
  }
});

// Get single flat by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const flat = await dataStore.getFlatById(req.params.id);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found.' });
    }
    res.json({ success: true, flat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch flat details.' });
  }
});

// Admin endpoint: Create new flat (and optionally provision owner)
router.post('/', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const {
      wing,
      flatNumber,
      floor,
      type,
      areaSqFt,
      allocatedParkingSlot,
      intercomNumber,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    } = req.body;

    if (!wing || !flatNumber || floor === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Wing, flat number, and floor are required.',
      });
    }

    const flat = await dataStore.createFlat(societyId, {
      wing,
      flatNumber,
      floor,
      type,
      areaSqFt,
      allocatedParkingSlot,
      intercomNumber,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    });

    await dataStore.logAction({
      societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'FLAT_CREATED',
      targetType: 'Flat',
      targetId: flat.flatNumber,
      details: {
        wing,
        flatNumber: flat.flatNumber,
        ownerAssigned: !!(ownerEmail && ownerName),
      },
    });

    res.status(201).json({
      success: true,
      message: `Flat ${flat.flatNumber} created successfully.`,
      flat,
    });
  } catch (error) {
    console.error('Create flat error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create flat.' });
  }
});

// Admin endpoint: Assign/Invite owner to an existing flat
router.post('/:id/assign-owner', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { ownerName, ownerEmail, ownerPhone, ownerPassword } = req.body;

    if (!ownerName || !ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Owner name and email are required.',
      });
    }

    const flat = await dataStore.assignFlatOwner(societyId, req.params.id, {
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
    });

    await dataStore.logAction({
      societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'FLAT_OWNER_ASSIGNED',
      targetType: 'Flat',
      targetId: flat.flatNumber,
      details: { flatNumber: flat.flatNumber, ownerName, ownerEmail },
    });

    res.json({
      success: true,
      message: `Owner ${ownerName} assigned to Flat ${flat.flatNumber} successfully.`,
      flat,
    });
  } catch (error) {
    console.error('Assign owner error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to assign owner.' });
  }
});

// Resident endpoint: Add family member to their flat
router.post('/family', verifyToken, async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    if (!name || !relation) {
      return res.status(400).json({ success: false, message: 'Member name and relation are required.' });
    }

    const flatNumber = req.user.flatNumber;
    if (!flatNumber) {
      return res.status(400).json({ success: false, message: 'User is not assigned to a flat.' });
    }

    const societyId = req.user.societyId;
    const updatedFlat = await dataStore.addFamilyMember(societyId, flatNumber, { name, relation, phone });

    await dataStore.logAction({
      societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'FAMILY_MEMBER_ADDED',
      targetType: 'Flat',
      targetId: flatNumber,
      details: { addedName: name, relation },
    });

    res.json({
      success: true,
      message: `${name} added to Flat ${flatNumber}`,
      flat: updatedFlat,
    });
  } catch (error) {
    console.error('Add family error:', error);
    res.status(500).json({ success: false, message: 'Failed to add family member.' });
  }
});

// Resident endpoint: Remove family member
router.delete('/family/:name', verifyToken, async (req, res) => {
  try {
    const memberName = decodeURIComponent(req.params.name);
    const flatNumber = req.user.flatNumber;
    const societyId = req.user.societyId;

    const updatedFlat = await dataStore.removeFamilyMember(societyId, flatNumber, memberName);

    await dataStore.logAction({
      societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'FAMILY_MEMBER_REMOVED',
      targetType: 'Flat',
      targetId: flatNumber,
      details: { removedName: memberName },
    });

    res.json({
      success: true,
      message: `${memberName} removed from Flat ${flatNumber}`,
      flat: updatedFlat,
    });
  } catch (error) {
    console.error('Remove family error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove family member.' });
  }
});

export default router;
