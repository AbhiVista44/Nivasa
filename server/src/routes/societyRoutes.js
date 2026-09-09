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
