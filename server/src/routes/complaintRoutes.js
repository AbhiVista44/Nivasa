import express from 'express';
import { dataStore } from '../services/dataStore.js';
import { classifyComplaint } from '../services/aiClassifier.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

// 1. AI Auto-Classification endpoint (can be called live from UI as resident types or clicks "Analyze with AI")
router.post('/classify-ai', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Complaint description is required for AI classification.' });
    }

    const aiResult = await classifyComplaint(description);
    res.json({
      success: true,
      data: aiResult,
    });
  } catch (error) {
    console.error('AI classification error:', error);
    res.status(500).json({ success: false, message: 'AI classification failed.' });
  }
});

// 2. Get complaints for society (with role-based scoping and filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { status, category, priority, flatNumber, search } = req.query;

    const query = { status, category, priority, flatNumber, search };

    // If resident, scope to resident's complaints
    if (req.user.role === 'resident') {
      query.flatNumber = req.user.flatNumber || query.flatNumber;
    }
    // If vendor, scope to complaints assigned to this vendor
    else if (req.user.role === 'vendor') {
      query.vendorId = req.user._id;
    }

    const complaints = await dataStore.getComplaints(societyId, query);
    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Fetch complaints error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve complaints.' });
  }
});

// 3. Get single complaint with full timeline
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const complaint = await dataStore.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }
    res.json({ success: true, complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch complaint details.' });
  }
});

// 4. Create new complaint (Resident / Admin)
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      preferredVisitTime,
      photos = [],
      aiClassification,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const societyId = req.user.societyId;
    const residentId = req.user._id;
    const residentName = req.user.name;
    const residentPhone = req.user.phone || '+91 98221 44556';
    const flatNumber = req.user.flatNumber || 'B-402';
    const wing = req.user.wing || 'Wing B (Sapphire)';

    // If AI classification was not already provided by client, run it automatically
    let finalAiClassification = aiClassification;
    if (!finalAiClassification) {
      const aiResult = await classifyComplaint(description);
      finalAiClassification = {
        isAiAssisted: true,
        suggestedCategory: aiResult.category,
        suggestedPriority: aiResult.priority,
        summary: aiResult.summary,
        confidence: aiResult.confidence,
      };
    }

    const complaintData = {
      societyId,
      residentId,
      residentName,
      residentPhone,
      flatNumber,
      wing,
      title: title.trim(),
      description: description.trim(),
      category: category || finalAiClassification?.suggestedCategory || 'General',
      priority: priority || finalAiClassification?.suggestedPriority || 'Medium',
      preferredVisitTime: preferredVisitTime || 'Anytime during daytime',
      photos,
      aiClassification: finalAiClassification,
    };

    const newComplaint = await dataStore.createComplaint(complaintData, req.user);

    await dataStore.logAction({
      societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'COMPLAINT_CREATED',
      targetType: 'Complaint',
      targetId: newComplaint.complaintNumber,
      details: { title, category: complaintData.category, priority: complaintData.priority },
    });

    res.status(201).json({
      success: true,
      message: `Complaint ${newComplaint.complaintNumber} registered successfully.`,
      complaint: newComplaint,
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ success: false, message: 'Failed to create complaint.' });
  }
});

// 5. Update Status along the 9-stage lifecycle
router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStages = [
      'Created',
      'Under Review',
      'Assigned',
      'Accepted',
      'Scheduled',
      'In Progress',
      'Completed',
      'Resident Confirmed',
      'Closed',
    ];

    if (!validStages.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status stage '${status}'.` });
    }

    const updated = await dataStore.updateComplaintStatus(req.params.id, status, req.user, note);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    await dataStore.logAction({
      societyId: updated.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'COMPLAINT_STATUS_CHANGED',
      targetType: 'Complaint',
      targetId: updated.complaintNumber,
      details: { fromStatus: updated.status, toStatus: status, note },
    });

    res.json({
      success: true,
      message: `Complaint ${updated.complaintNumber} status changed to '${status}'.`,
      complaint: updated,
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// 6. Assign Vendor (Admin only)
router.put('/:id/assign-vendor', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const { vendorId, vendorName, businessName, phone, serviceCategory, priority, note } = req.body;
    if (!vendorName) {
      return res.status(400).json({ success: false, message: 'Vendor details required.' });
    }

    const vendorData = {
      vendorId,
      vendorName,
      businessName: businessName || vendorName,
      phone: phone || '',
      serviceCategory: serviceCategory || 'General',
    };

    const updated = await dataStore.assignVendor(req.params.id, vendorData, req.user, note);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Optionally update priority if admin changed it
    if (priority) {
      updated.priority = priority;
    }

    await dataStore.logAction({
      societyId: updated.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'VENDOR_ASSIGNED',
      targetType: 'Complaint',
      targetId: updated.complaintNumber,
      details: { vendorName, businessName },
    });

    res.json({
      success: true,
      message: `${vendorName} assigned to ${updated.complaintNumber}.`,
      complaint: updated,
    });
  } catch (error) {
    console.error('Assign vendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign vendor.' });
  }
});

// 7. Schedule Visit (Vendor / Admin)
router.put('/:id/schedule-visit', verifyToken, requireRoles('vendor', 'admin'), async (req, res) => {
  try {
    const { visitDate, timeSlot, note } = req.body;
    if (!visitDate || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Visit date and time slot are required.' });
    }

    const updated = await dataStore.scheduleVisit(req.params.id, visitDate, timeSlot, req.user, note);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    res.json({
      success: true,
      message: `Visit scheduled for ${visitDate} (${timeSlot}).`,
      complaint: updated,
    });
  } catch (error) {
    console.error('Schedule visit error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule visit.' });
  }
});

// 8. Update Work Notes (Vendor)
router.put('/:id/work-notes', verifyToken, requireRoles('vendor', 'admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const updated = await dataStore.updateWorkNotes(req.params.id, notes, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    res.json({
      success: true,
      message: 'Work notes updated.',
      complaint: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update work notes.' });
  }
});

// 9. Resident Confirm & Rate Completion (Resident)
router.post('/:id/resident-confirm', verifyToken, async (req, res) => {
  try {
    const { rating = 5, feedback = '' } = req.body;
    const updated = await dataStore.residentConfirm(req.params.id, rating, feedback, req.user);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    await dataStore.logAction({
      societyId: updated.societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'RESIDENT_CONFIRMED_COMPLAINT',
      targetType: 'Complaint',
      targetId: updated.complaintNumber,
      details: { rating, feedback },
    });

    res.json({
      success: true,
      message: `Thank you! Complaint ${updated.complaintNumber} marked as Resident Confirmed & Closed.`,
      complaint: updated,
    });
  } catch (error) {
    console.error('Resident confirm error:', error);
    res.status(500).json({ success: false, message: 'Failed to record resident confirmation.' });
  }
});

export default router;
