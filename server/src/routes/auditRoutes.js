import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get society audit logs (admin only)
router.get('/', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { severity, action, search, limit } = req.query;

    const logs = await dataStore.getAuditLogs(
      societyId,
      { severity, action, search },
      parseInt(limit) || 100
    );

    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    console.error('Fetch audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

export default router;
