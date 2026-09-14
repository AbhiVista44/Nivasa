import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { socketService } from '../services/socketService.js';
import { emailService } from '../services/emailService.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get all notices (resident sees published only scoped by wing; admin sees all)
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { type, search } = req.query;
    const filter = { type, search };

    // Residents only see published notices relevant to their wing
    if (req.user.role === 'resident') {
      filter.isPublished = true;
      filter.wing = req.user.wing || null;
    }

    const notices = await dataStore.getNotices(societyId, filter);

    // Annotate each notice with hasRead for the current user
    const userId = req.user.id || req.user._id;
    const annotated = notices.map(n => {
      const obj = n.toObject ? n.toObject() : { ...n };
      obj.hasRead = (obj.readBy || []).some(
        r => r.userId?.toString() === userId?.toString()
      );
      return obj;
    });

    res.json({ success: true, count: annotated.length, notices: annotated });
  } catch (error) {
    console.error('Fetch notices error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notices.' });
  }
});

// 2. Create a notice (admin only)
router.post('/', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { title, body, type, targetWing, scheduledAt } = req.body;

    if (!title || !body || !type) {
      return res.status(400).json({ success: false, message: 'Title, body, and type are required.' });
    }

    const notice = await dataStore.createNotice(
      { societyId, title, body, type, targetWing: targetWing || null, scheduledAt: scheduledAt || null },
      req.user
    );

    await dataStore.logAction({
      societyId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'NOTICE_CREATED',
      targetType: 'Notice',
      targetId: notice._id?.toString(),
      details: { title, type },
      severity: type === 'urgent' ? 'critical' : 'info',
    });

    // Real-time broadcast to all connected residents
    if (notice.isPublished) {
      socketService.broadcastNotice(societyId, notice);

      // If urgent, dispatch email alert to community
      if (type === 'urgent') {
        emailService.sendUrgentNoticeEmail('residents@gulmohargreens.org', notice, { name: 'Gulmohar Greens Heights' });
      }
    }

    res.status(201).json({ success: true, message: 'Notice published successfully.', notice });
  } catch (error) {
    console.error('Create notice error:', error);
    res.status(500).json({ success: false, message: 'Failed to create notice.' });
  }
});

// 3. Mark notice as read (resident)
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const notice = await dataStore.markNoticeRead(req.params.id, userId);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (error) {
    console.error('Mark notice read error:', error);
    res.status(500).json({ success: false, message: 'Failed to update read status.' });
  }
});

// 4. Update notice (admin only)
router.put('/:id', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { title, body, type, targetWing, isPublished, scheduledAt } = req.body;
    const updated = await dataStore.updateNotice(req.params.id, {
      title, body, type, targetWing, isPublished, scheduledAt,
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Notice not found.' });

    await dataStore.logAction({
      societyId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'NOTICE_UPDATED',
      targetType: 'Notice',
      targetId: req.params.id,
      details: { title: updated.title, type: updated.type },
      severity: 'info',
    });

    res.json({ success: true, message: 'Notice updated.', notice: updated });
  } catch (error) {
    console.error('Update notice error:', error);
    res.status(500).json({ success: false, message: 'Failed to update notice.' });
  }
});

// 5. Delete notice (admin only)
router.delete('/:id', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const deleted = await dataStore.deleteNotice(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Notice not found.' });

    await dataStore.logAction({
      societyId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'NOTICE_DELETED',
      targetType: 'Notice',
      targetId: req.params.id,
      details: { title: deleted.title },
      severity: 'warning',
    });

    res.json({ success: true, message: 'Notice deleted.' });
  } catch (error) {
    console.error('Delete notice error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notice.' });
  }
});

export default router;
