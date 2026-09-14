import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. Get vendor directory (all roles)
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { category, status, search, isEmergency } = req.query;

    const filter = {
      category,
      status: req.user.role === 'resident' ? 'active' : status, // residents only see active
      search,
      isEmergency: isEmergency === 'true',
    };

    const vendors = await dataStore.getVendors(societyId, filter);
    res.json({ success: true, count: vendors.length, vendors });
  } catch (error) {
    console.error('Fetch vendors error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve vendor directory.' });
  }
});

// 2. Add vendor (admin only)
router.post('/', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const {
      name, businessName, category, phone, emergencyPhone, email,
      serviceAreas, licenseNumber, description, tags, isEmergencyContact,
    } = req.body;

    if (!name || !category || !phone) {
      return res.status(400).json({ success: false, message: 'Name, category, and phone are required.' });
    }

    const vendor = await dataStore.createVendor(
      {
        societyId, name, businessName, category, phone, emergencyPhone: emergencyPhone || null,
        email: email || null, serviceAreas: serviceAreas || [], licenseNumber: licenseNumber || null,
        description: description || '', tags: tags || [],
        isEmergencyContact: Boolean(isEmergencyContact), status: 'active',
      },
      req.user
    );

    await dataStore.logAction({
      societyId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VENDOR_ADDED',
      targetType: 'Vendor',
      targetId: vendor._id?.toString(),
      details: { name, category },
      severity: 'info',
    });

    res.status(201).json({ success: true, message: `Vendor ${name} added to directory.`, vendor });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to add vendor.' });
  }
});

// 3. Update vendor profile (admin only)
router.put('/:id', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const updated = await dataStore.updateVendor(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Vendor not found.' });

    await dataStore.logAction({
      societyId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VENDOR_UPDATED',
      targetType: 'Vendor',
      targetId: req.params.id,
      details: { name: updated.name },
      severity: 'info',
    });

    res.json({ success: true, message: 'Vendor updated.', vendor: updated });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vendor.' });
  }
});

// 4. Toggle vendor active/inactive (admin only)
router.patch('/:id/status', verifyToken, requireRoles(['admin']), async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or inactive.' });
    }
    const updated = await dataStore.updateVendor(req.params.id, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'Vendor not found.' });

    await dataStore.logAction({
      societyId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: status === 'inactive' ? 'VENDOR_DEACTIVATED' : 'VENDOR_ACTIVATED',
      targetType: 'Vendor',
      targetId: req.params.id,
      details: { name: updated.name, status },
      severity: status === 'inactive' ? 'warning' : 'info',
    });

    res.json({ success: true, message: `Vendor ${status === 'inactive' ? 'deactivated' : 'activated'}.`, vendor: updated });
  } catch (error) {
    console.error('Toggle vendor status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vendor status.' });
  }
});

// 5. Rate a vendor (resident only)
router.post('/:id/rate', verifyToken, requireRoles(['resident']), async (req, res) => {
  try {
    const { score, review } = req.body;
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: 'Rating score must be between 1 and 5.' });
    }
    const vendor = await dataStore.rateVendor(req.params.id, { score: Number(score), review }, req.user);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });

    res.json({
      success: true,
      message: `Your ${score}-star rating for ${vendor.name} has been submitted.`,
      avgRating: vendor.avgRating,
      totalRatings: vendor.totalRatings,
    });
  } catch (error) {
    console.error('Rate vendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit rating.' });
  }
});

export default router;
