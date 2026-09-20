import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// Get list of societies (public for registration/switching)
router.get('/', async (req, res) => {
  try {
    const societies = await dataStore.getSocieties();
    res.json({ success: true, societies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch societies.' });
  }
});

// Get specific society details
router.get('/:id', async (req, res) => {
  try {
    const society = await dataStore.getSocietyById(req.params.id);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }
    res.json({ success: true, society });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch society.' });
  }
});

// Add a wing to society (Admin only)
router.post('/:id/wings', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const { name, totalFloors, flatsPerFloor } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Wing name is required.' });
    }
    const updated = await dataStore.addWing(req.params.id, { name, totalFloors, flatsPerFloor });
    
    await dataStore.logAction({
      societyId: req.params.id,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WING_ADDED',
      targetType: 'Society',
      targetId: req.params.id,
      details: { wingName: name, totalFloors, flatsPerFloor },
    });

    res.status(201).json({ success: true, message: `Wing "${name}" added successfully.`, wings: updated.wings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to add wing.' });
  }
});

// Get wings for society
router.get('/:id/wings', verifyToken, async (req, res) => {
  try {
    const society = await dataStore.getSocietyById(req.params.id);
    if (!society) {
      return res.status(404).json({ success: false, message: 'Society not found.' });
    }
    res.json({ success: true, wings: society.wings || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wings.' });
  }
});

// Get audit logs for current society (Admin only)
router.get('/:id/audit-logs', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const logs = await dataStore.getAuditLogs(req.params.id);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
});

export default router;
