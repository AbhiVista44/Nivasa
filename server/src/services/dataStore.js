import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initialSocieties, initialUsers, initialFlats, initialComplaints, initialVisitors, initialDeliveries, initialFacilities, initialFacilityBookings } from '../data/seedData.js';
import { User } from '../models/User.js';
import { Society } from '../models/Society.js';
import { Flat } from '../models/Flat.js';
import { Complaint } from '../models/Complaint.js';
import { Visitor } from '../models/Visitor.js';
import { Delivery } from '../models/Delivery.js';
import { FacilityBooking } from '../models/FacilityBooking.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'nivasa_super_secret_jwt_key_2026_resident_community';

class DataStore {
  constructor() {
    this.societies = [...initialSocieties];
    this.users = initialUsers.map(u => ({
      ...u,
      passwordHash: bcrypt.hashSync(u.password, 10),
    }));
    this.flats = [...initialFlats];
    this.complaints = [...initialComplaints];
    this.visitors = [...initialVisitors];
    this.deliveries = [...initialDeliveries];
    this.facilities = [...initialFacilities];
    this.facilityBookings = [...initialFacilityBookings];
    this.auditLogs = [];
    this.isSeeded = false;
  }

  isMongoConnected() {
    return mongoose.connection.readyState === 1;
  }

  async ensureSeeded() {
    if (!this.isMongoConnected() || this.isSeeded) return;
    try {
      const societyCount = await Society.countDocuments();
      if (societyCount === 0) {
        console.log('🌱 Empty MongoDB detected. Auto-seeding initial societies...');
        for (const s of initialSocieties) {
          await Society.create(s);
        }
      }

      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('🌱 Auto-seeding initial multi-role users into MongoDB...');
        for (const u of initialUsers) {
          await User.create(u);
        }
      }

      const flatCount = await Flat.countDocuments();
      if (flatCount === 0) {
        console.log('🌱 Auto-seeding initial society flats & resident units into MongoDB...');
        for (const f of initialFlats) {
          await Flat.create(f);
        }
      }

      const complaintCount = await Complaint.countDocuments();
      if (complaintCount === 0) {
        console.log('🌱 Auto-seeding initial maintenance complaints with 9-stage lifecycle into MongoDB...');
        for (const c of initialComplaints) {
          await Complaint.create(c);
        }
      }

      const visitorCount = await Visitor.countDocuments();
      if (visitorCount === 0) {
        console.log('🌱 Auto-seeding initial gate visitors & passes into MongoDB...');
        for (const v of initialVisitors) {
          await Visitor.create(v);
        }
      }

      const deliveryCount = await Delivery.countDocuments();
      if (deliveryCount === 0) {
        console.log('🌱 Auto-seeding initial gate deliveries & parcels into MongoDB...');
        for (const d of initialDeliveries) {
          await Delivery.create(d);
        }
      }

      const bookingCount = await FacilityBooking.countDocuments();
      if (bookingCount === 0) {
        console.log('🌱 Auto-seeding initial facility bookings into MongoDB...');
        for (const b of initialFacilityBookings) {
          await FacilityBooking.create(b);
        }
      }

      this.isSeeded = true;
      console.log('✅ MongoDB seed sync completed.');
    } catch (err) {
      console.warn('⚠️  Auto-seed warning:', err.message);
    }
  }

  generateToken(user) {
    const id = user._id || user.id;
    return jwt.sign(
      {
        id,
        role: user.role,
        societyId: user.societyId,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  async findUserByEmail(email) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await User.findById(id).select('-password');
    }
    const u = this.users.find(user => user._id.toString() === id.toString());
    if (!u) return null;
    const { passwordHash: _hash, password: _pwd, ...rest } = u;
    return rest;
  }

  async getSocieties() {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const dbSocieties = await Society.find({ status: 'active' });
      if (dbSocieties.length > 0) return dbSocieties;
    }
    return this.societies;
  }

  async getSocietyById(id) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const s = await Society.findById(id);
      if (s) return s;
    }
    return this.societies.find(s => s._id.toString() === id.toString());
  }

  async getDemoUsers() {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const dbUsers = await User.find().select('-password');
      if (dbUsers.length > 0) return dbUsers;
    }
    return this.users.map(({ passwordHash: _h, password: _p, ...rest }) => rest);
  }

  // --- Flats Management (Milestone 2) ---
  async getFlats(societyId, query = {}) {
    await this.ensureSeeded();
    const { wing, status, search } = query;

    if (this.isMongoConnected()) {
      const filter = { societyId };
      if (wing && wing !== 'all') {
        filter.wing = new RegExp(wing, 'i');
      }
      if (status && status !== 'all') {
        filter.status = status;
      }
      if (search) {
        filter.$or = [
          { flatNumber: new RegExp(search, 'i') },
          { 'primaryResident.name': new RegExp(search, 'i') },
          { 'primaryResident.phone': new RegExp(search, 'i') },
        ];
      }
      return await Flat.find(filter).sort({ wing: 1, floor: 1, flatNumber: 1 });
    }

    // In-Memory fallback
    return this.flats.filter(f => {
      if (societyId && f.societyId.toString() !== societyId.toString()) return false;
      if (wing && wing !== 'all' && !f.wing.toLowerCase().includes(wing.toLowerCase())) return false;
      if (status && status !== 'all' && f.status !== status) return false;
      if (search) {
        const s = search.toLowerCase();
        const matchFlat = f.flatNumber.toLowerCase().includes(s);
        const matchName = f.primaryResident?.name?.toLowerCase().includes(s);
        const matchPhone = f.primaryResident?.phone?.includes(s);
        if (!matchFlat && !matchName && !matchPhone) return false;
      }
      return true;
    });
  }

  async getFlatByNumber(societyId, flatNumber) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await Flat.findOne({ societyId, flatNumber });
    }
    return this.flats.find(f => f.societyId.toString() === societyId.toString() && f.flatNumber === flatNumber);
  }

  async getFlatById(id) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await Flat.findById(id);
    }
    return this.flats.find(f => f._id.toString() === id.toString());
  }

  async addFamilyMember(societyId, flatNumber, member) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const flat = await Flat.findOne({ societyId, flatNumber });
      if (!flat) return null;
      flat.familyMembers.push(member);
      await flat.save();
      return flat;
    }

    const flat = this.flats.find(f => f.societyId.toString() === societyId.toString() && f.flatNumber === flatNumber);
    if (!flat) return null;
    flat.familyMembers = flat.familyMembers || [];
    flat.familyMembers.push(member);
    return flat;
  }

  async removeFamilyMember(societyId, flatNumber, memberName) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const flat = await Flat.findOne({ societyId, flatNumber });
      if (!flat) return null;
      flat.familyMembers = flat.familyMembers.filter(m => m.name !== memberName);
      await flat.save();
      return flat;
    }

    const flat = this.flats.find(f => f.societyId.toString() === societyId.toString() && f.flatNumber === flatNumber);
    if (!flat) return null;
    flat.familyMembers = (flat.familyMembers || []).filter(m => m.name !== memberName);
    return flat;
  }

  // --- Complaint Management (Milestone 3) ---
  async getComplaints(societyId, query = {}) {
    await this.ensureSeeded();
    const { status, category, priority, flatNumber, vendorId, residentId, search } = query;

    if (this.isMongoConnected()) {
      const filter = { societyId };
      if (status && status !== 'all') filter.status = status;
      if (category && category !== 'all') filter.category = category;
      if (priority && priority !== 'all') filter.priority = priority;
      if (flatNumber) filter.flatNumber = flatNumber;
      if (vendorId) filter['assignedVendor.vendorId'] = vendorId;
      if (residentId) filter.residentId = residentId;
      if (search) {
        filter.$or = [
          { complaintNumber: new RegExp(search, 'i') },
          { title: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { flatNumber: new RegExp(search, 'i') },
          { residentName: new RegExp(search, 'i') },
        ];
      }
      return await Complaint.find(filter).sort({ createdAt: -1 });
    }

    // In-memory fallback
    return this.complaints.filter(c => {
      if (societyId && c.societyId.toString() !== societyId.toString()) return false;
      if (status && status !== 'all' && c.status !== status) return false;
      if (category && category !== 'all' && c.category !== category) return false;
      if (priority && priority !== 'all' && c.priority !== priority) return false;
      if (flatNumber && c.flatNumber !== flatNumber) return false;
      if (vendorId && c.assignedVendor?.vendorId?.toString() !== vendorId.toString()) return false;
      if (residentId && c.residentId?.toString() !== residentId.toString()) return false;
      if (search) {
        const s = search.toLowerCase();
        const matchNum = c.complaintNumber?.toLowerCase().includes(s);
        const matchTitle = c.title?.toLowerCase().includes(s);
        const matchDesc = c.description?.toLowerCase().includes(s);
        const matchFlat = c.flatNumber?.toLowerCase().includes(s);
        const matchRes = c.residentName?.toLowerCase().includes(s);
        if (!matchNum && !matchTitle && !matchDesc && !matchFlat && !matchRes) return false;
      }
      return true;
    });
  }

  async getComplaintById(id) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await Complaint.findById(id);
    }
    return this.complaints.find(c => c._id.toString() === id.toString() || c.complaintNumber === id);
  }

  async createComplaint(complaintData, actor) {
    await this.ensureSeeded();
    const count = this.isMongoConnected()
      ? await Complaint.countDocuments({ societyId: complaintData.societyId })
      : this.complaints.filter(c => c.societyId.toString() === complaintData.societyId.toString()).length;

    const complaintNumber = `CMP-${105 + count}`;
    const newComplaint = {
      ...complaintData,
      complaintNumber,
      status: 'Created',
      createdAt: new Date(),
      updatedAt: new Date(),
      timeline: [
        {
          stage: 'Created',
          updatedBy: actor.name,
          role: actor.role,
          note: 'Maintenance complaint logged by resident.',
          timestamp: new Date(),
        },
      ],
    };

    if (this.isMongoConnected()) {
      return await Complaint.create(newComplaint);
    }

    newComplaint._id = 'cmp_' + Date.now();
    this.complaints.unshift(newComplaint);
    return newComplaint;
  }

  async updateComplaintStatus(id, newStatus, actor, note = '') {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: newStatus,
      updatedBy: actor.name,
      role: actor.role,
      note: note || `Status transitioned to ${newStatus}`,
      timestamp: new Date(),
    };

    if (this.isMongoConnected()) {
      const complaint = await Complaint.findById(id);
      if (!complaint) return null;
      complaint.status = newStatus;
      complaint.updatedAt = new Date();
      complaint.timeline.push(timelineEvent);
      await complaint.save();
      return complaint;
    }

    const complaint = this.complaints.find(c => c._id.toString() === id.toString() || c.complaintNumber === id);
    if (!complaint) return null;
    complaint.status = newStatus;
    complaint.updatedAt = new Date();
    complaint.timeline = complaint.timeline || [];
    complaint.timeline.push(timelineEvent);
    return complaint;
  }

  async assignVendor(id, vendorData, actor, note = '') {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: 'Assigned',
      updatedBy: actor.name,
      role: actor.role,
      note: note || `Assigned to ${vendorData.vendorName} (${vendorData.businessName || vendorData.serviceCategory})`,
      timestamp: new Date(),
    };

    if (this.isMongoConnected()) {
      const complaint = await Complaint.findById(id);
      if (!complaint) return null;
      complaint.assignedVendor = vendorData;
      complaint.status = 'Assigned';
      complaint.updatedAt = new Date();
      complaint.timeline.push(timelineEvent);
      await complaint.save();
      return complaint;
    }

    const complaint = this.complaints.find(c => c._id.toString() === id.toString() || c.complaintNumber === id);
    if (!complaint) return null;
    complaint.assignedVendor = vendorData;
    complaint.status = 'Assigned';
    complaint.updatedAt = new Date();
    complaint.timeline = complaint.timeline || [];
    complaint.timeline.push(timelineEvent);
    return complaint;
  }

  async scheduleVisit(id, visitDate, timeSlot, actor, note = '') {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: 'Scheduled',
      updatedBy: actor.name,
      role: actor.role,
      note: note || `Visit scheduled for ${visitDate} during ${timeSlot}`,
      timestamp: new Date(),
    };

    if (this.isMongoConnected()) {
      const complaint = await Complaint.findById(id);
      if (!complaint) return null;
      complaint.scheduledVisitDate = visitDate;
      complaint.scheduledTimeSlot = timeSlot;
      complaint.status = 'Scheduled';
      complaint.updatedAt = new Date();
      complaint.timeline.push(timelineEvent);
      await complaint.save();
      return complaint;
    }

    const complaint = this.complaints.find(c => c._id.toString() === id.toString() || c.complaintNumber === id);
    if (!complaint) return null;
    complaint.scheduledVisitDate = visitDate;
    complaint.scheduledTimeSlot = timeSlot;
    complaint.status = 'Scheduled';
    complaint.updatedAt = new Date();
    complaint.timeline = complaint.timeline || [];
    complaint.timeline.push(timelineEvent);
    return complaint;
  }

  async updateWorkNotes(id, notes, actor) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const complaint = await Complaint.findById(id);
      if (!complaint) return null;
      complaint.vendorWorkNotes = notes;
      complaint.updatedAt = new Date();
      await complaint.save();
      return complaint;
    }

    const complaint = this.complaints.find(c => c._id.toString() === id.toString() || c.complaintNumber === id);
    if (!complaint) return null;
    complaint.vendorWorkNotes = notes;
    complaint.updatedAt = new Date();
    return complaint;
  }

  async residentConfirm(id, rating, feedback, actor) {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: 'Resident Confirmed',
      updatedBy: actor.name,
      role: actor.role,
      note: `Resident confirmed work completion with ${rating} ★ rating. Feedback: "${feedback || 'Satisfied'}"`,
      timestamp: new Date(),
    };

    if (this.isMongoConnected()) {
      const complaint = await Complaint.findById(id);
      if (!complaint) return null;
      complaint.status = 'Resident Confirmed';
      complaint.residentRating = rating;
      complaint.residentFeedback = feedback;
      complaint.updatedAt = new Date();
      complaint.timeline.push(timelineEvent);
      // Auto close or leave for admin closing
      complaint.timeline.push({
        stage: 'Closed',
        updatedBy: 'Nivasa System',
        role: 'system',
        note: 'Order successfully resolved and archived.',
        timestamp: new Date(),
      });
      complaint.status = 'Closed';
      await complaint.save();
      return complaint;
    }

    const complaint = this.complaints.find(c => c._id.toString() === id.toString() || c.complaintNumber === id);
    if (!complaint) return null;
    complaint.status = 'Closed';
    complaint.residentRating = rating;
    complaint.residentFeedback = feedback;
    complaint.updatedAt = new Date();
    complaint.timeline = complaint.timeline || [];
    complaint.timeline.push(timelineEvent);
    complaint.timeline.push({
      stage: 'Closed',
      updatedBy: 'Nivasa System',
      role: 'system',
      note: 'Order successfully resolved and archived.',
      timestamp: new Date(),
    });
    return complaint;
  }

  async logAction(actionData) {
    const entry = {
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date(),
      ...actionData,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) this.auditLogs.pop();
    return entry;
  }

  async getAuditLogs(societyId, limit = 50) {
    return this.auditLogs
      .filter(l => !societyId || l.societyId.toString() === societyId.toString())
      .slice(0, limit);
  }

  // --- Visitor Management & Gate Operations (Milestone 4) ---

  async getVisitors(societyId, query = {}) {
    await this.ensureSeeded();
    const { status, flatNumber, type, search } = query;

    if (this.isMongoConnected()) {
      const filter = { societyId };
      if (status && status !== 'all') {
        if (status === 'inside') filter.status = 'Inside';
        else if (status === 'pre-approved') filter.status = 'Pre-Approved';
        else if (status === 'pending') filter.status = 'Pending Approval';
        else filter.status = status;
      }
      if (flatNumber) filter.flatNumber = flatNumber;
      if (type && type !== 'all') filter.type = type;
      if (search) {
        filter.$or = [
          { name: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') },
          { visitorNumber: new RegExp(search, 'i') },
          { passcode: new RegExp(search, 'i') },
          { vehicleNumber: new RegExp(search, 'i') },
          { flatNumber: new RegExp(search, 'i') },
        ];
      }
      return await Visitor.find(filter).sort({ createdAt: -1 });
    }

    // In-memory fallback
    return this.visitors
      .filter(v => {
        if (societyId && v.societyId.toString() !== societyId.toString()) return false;
        if (status && status !== 'all') {
          if (status === 'inside' && v.status !== 'Inside') return false;
          if (status === 'pre-approved' && v.status !== 'Pre-Approved') return false;
          if (status === 'pending' && v.status !== 'Pending Approval') return false;
          if (!['inside', 'pre-approved', 'pending'].includes(status) && v.status !== status) return false;
        }
        if (flatNumber && v.flatNumber !== flatNumber) return false;
        if (type && type !== 'all' && v.type !== type) return false;
        if (search) {
          const s = search.toLowerCase();
          const matchName = v.name?.toLowerCase().includes(s);
          const matchPhone = v.phone?.includes(s);
          const matchNum = v.visitorNumber?.toLowerCase().includes(s);
          const matchCode = v.passcode?.includes(s);
          const matchFlat = v.flatNumber?.toLowerCase().includes(s);
          if (!matchName && !matchPhone && !matchNum && !matchCode && !matchFlat) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || b.entryTime || Date.now()) - new Date(a.createdAt || a.entryTime || Date.now()));
  }

  async getInsideVisitors(societyId) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await Visitor.find({ societyId, status: 'Inside' }).sort({ entryTime: -1 });
    }
    return this.visitors
      .filter(v => v.status === 'Inside' && (!societyId || v.societyId.toString() === societyId.toString()))
      .sort((a, b) => new Date(b.entryTime || Date.now()) - new Date(a.entryTime || Date.now()));
  }

  async getPendingApprovals(societyId, flatNumber) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const filter = { societyId, status: 'Pending Approval' };
      if (flatNumber) filter.flatNumber = flatNumber;
      return await Visitor.find(filter).sort({ createdAt: -1 });
    }
    return this.visitors
      .filter(v => {
        if (v.status !== 'Pending Approval') return false;
        if (societyId && v.societyId.toString() !== societyId.toString()) return false;
        if (flatNumber && v.flatNumber !== flatNumber) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()));
  }

  async getVisitorById(id) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return mongoose.isValidObjectId(id)
        ? await Visitor.findById(id)
        : await Visitor.findOne({ visitorNumber: id });
    }
    return this.visitors.find(v => v._id?.toString() === id?.toString() || v.visitorNumber === id);
  }

  async createPreAuthorization(data, resident) {
    await this.ensureSeeded();
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    const visitorNumber = `VIS-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const societyId = resident.societyId && mongoose.isValidObjectId(resident.societyId)
      ? resident.societyId
      : new mongoose.Types.ObjectId('67a800000000000000000001');

    const hostResidentId = (resident._id || resident.id) && mongoose.isValidObjectId(resident._id || resident.id)
      ? (resident._id || resident.id)
      : null;

    const newVisitor = {
      societyId,
      visitorNumber,
      passcode,
      name: data.name,
      phone: data.phone || '',
      vehicleNumber: data.vehicleNumber || '',
      photoUrl: data.photoUrl || '',
      flatNumber: resident.flatNumber || data.flatNumber || 'B-402',
      wing: resident.wing || data.wing || 'Wing B',
      hostResidentId,
      hostResidentName: resident.name || 'Resident',
      type: data.type || 'Guest',
      status: 'Pre-Approved',
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : new Date(),
      expectedTimeSlot: data.expectedTimeSlot || 'Anytime',
      entryGate: 'Gate 1',
      timeline: [
        {
          stage: 'Pre-Approved',
          timestamp: new Date(),
          actor: resident.name || 'Resident',
          role: 'resident',
          note: `Pre-authorized pass generated by ${resident.name || 'Resident'} for ${data.name}. Passcode: ${passcode}`,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.isMongoConnected()) {
      const dbVisitor = await Visitor.create(newVisitor);
      return dbVisitor.toObject ? dbVisitor.toObject() : dbVisitor;
    }

    newVisitor._id = new mongoose.Types.ObjectId().toString();
    this.visitors.unshift(newVisitor);
    return newVisitor;
  }

  async registerWalkInVisitor(data, guard) {
    await this.ensureSeeded();
    const passcode = Math.floor(100000 + Math.random() * 900000).toString();
    const visitorNumber = `WLK-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;

    const societyId = (guard?.societyId || data.societyId) && mongoose.isValidObjectId(guard?.societyId || data.societyId)
      ? (guard?.societyId || data.societyId)
      : new mongoose.Types.ObjectId('67a800000000000000000001');

    const initialStatus = data.autoApprove ? 'Inside' : 'Pending Approval';
    const timeline = [
      {
        stage: 'Walk-In Registered',
        timestamp: new Date(),
        actor: guard?.name || 'Gate Security',
        role: 'security',
        note: `Registered at ${guard?.gatePost || 'Gate 1'}. Destination: Flat ${data.flatNumber}.`,
      },
    ];

    if (data.autoApprove) {
      timeline.push({
        stage: 'Gate Entry Authorized',
        timestamp: new Date(),
        actor: guard?.name || 'Gate Security',
        role: 'security',
        note: `Direct entry authorized by security for ${data.type || 'Visitor'}.`,
      });
    }

    const newVisitor = {
      societyId,
      visitorNumber,
      passcode,
      name: data.name,
      phone: data.phone || '',
      vehicleNumber: data.vehicleNumber || '',
      photoUrl: data.photoUrl || '',
      flatNumber: data.flatNumber,
      wing: data.wing || '',
      hostResidentName: data.hostResidentName || '',
      type: data.type || 'Guest',
      status: initialStatus,
      entryTime: data.autoApprove ? new Date() : null,
      entryGate: guard?.gatePost || 'Gate 1',
      securityGuardName: guard?.name || 'Vikram Singh',
      securityGuardBadge: guard?.badgeNumber || 'SEC-089',
      timeline,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.isMongoConnected()) {
      const dbVisitor = await Visitor.create(newVisitor);
      return dbVisitor.toObject ? dbVisitor.toObject() : dbVisitor;
    }

    newVisitor._id = new mongoose.Types.ObjectId().toString();
    this.visitors.unshift(newVisitor);
    return newVisitor;
  }

  async verifyPasscode(societyId, code) {
    await this.ensureSeeded();
    const trimmed = (code || '').trim();

    if (this.isMongoConnected()) {
      return await Visitor.findOne({
        societyId,
        passcode: trimmed,
        status: { $in: ['Pre-Approved', 'Approved'] },
      });
    }

    return this.visitors.find(v =>
      v.passcode === trimmed &&
      (!societyId || v.societyId.toString() === societyId.toString()) &&
      ['Pre-Approved', 'Approved'].includes(v.status)
    );
  }

  async recordEntry(id, guard) {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: 'Gate Entry Authorized',
      timestamp: new Date(),
      actor: guard?.name || 'Security Officer',
      role: 'security',
      note: `Gate pass verified at ${guard?.gatePost || 'Gate 1'}. Visitor entered society.`,
    };

    if (this.isMongoConnected()) {
      const visitor = mongoose.isValidObjectId(id)
        ? await Visitor.findById(id)
        : await Visitor.findOne({ visitorNumber: id });
      if (!visitor) return null;
      visitor.status = 'Inside';
      visitor.entryTime = new Date();
      visitor.entryGate = guard?.gatePost || visitor.entryGate || 'Gate 1';
      visitor.securityGuardName = guard?.name || visitor.securityGuardName;
      visitor.securityGuardBadge = guard?.badgeNumber || visitor.securityGuardBadge;
      visitor.timeline.push(timelineEvent);
      visitor.updatedAt = new Date();
      await visitor.save();
      return visitor.toObject ? visitor.toObject() : visitor;
    }

    const visitor = this.visitors.find(v => v._id?.toString() === id?.toString() || v.visitorNumber === id);
    if (!visitor) return null;
    visitor.status = 'Inside';
    visitor.entryTime = new Date();
    visitor.entryGate = guard?.gatePost || visitor.entryGate || 'Gate 1';
    visitor.securityGuardName = guard?.name || visitor.securityGuardName;
    visitor.securityGuardBadge = guard?.badgeNumber || visitor.securityGuardBadge;
    visitor.timeline = visitor.timeline || [];
    visitor.timeline.push(timelineEvent);
    visitor.updatedAt = new Date();
    return visitor;
  }

  async recordExit(id, guard) {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: 'Gate Exit Recorded',
      timestamp: new Date(),
      actor: guard?.name || 'Security Officer',
      role: 'security',
      note: `Logged exit at ${guard?.gatePost || 'Gate 1'}. Society departure recorded.`,
    };

    if (this.isMongoConnected()) {
      const visitor = mongoose.isValidObjectId(id)
        ? await Visitor.findById(id)
        : await Visitor.findOne({ visitorNumber: id });
      if (!visitor) return null;
      visitor.status = 'Exited';
      visitor.exitTime = new Date();
      visitor.exitGate = guard?.gatePost || 'Gate 1';
      visitor.timeline.push(timelineEvent);
      visitor.updatedAt = new Date();
      await visitor.save();
      return visitor.toObject ? visitor.toObject() : visitor;
    }

    const visitor = this.visitors.find(v => v._id?.toString() === id?.toString() || v.visitorNumber === id);
    if (!visitor) return null;
    visitor.status = 'Exited';
    visitor.exitTime = new Date();
    visitor.exitGate = guard?.gatePost || 'Gate 1';
    visitor.timeline = visitor.timeline || [];
    visitor.timeline.push(timelineEvent);
    visitor.updatedAt = new Date();
    return visitor;
  }

  async respondToApproval(id, approved, notes, resident) {
    await this.ensureSeeded();
    const stage = approved ? 'Approved' : 'Rejected';
    const timelineEvent = {
      stage: `Resident ${stage}`,
      timestamp: new Date(),
      actor: resident?.name || 'Resident',
      role: 'resident',
      note: notes || (approved ? 'Entry approved by resident.' : 'Entry denied by resident.'),
    };

    if (this.isMongoConnected()) {
      const visitor = mongoose.isValidObjectId(id)
        ? await Visitor.findById(id)
        : await Visitor.findOne({ visitorNumber: id });
      if (!visitor) return null;
      visitor.status = stage;
      visitor.approvalNotes = notes || '';
      visitor.timeline.push(timelineEvent);
      visitor.updatedAt = new Date();
      await visitor.save();
      return visitor.toObject ? visitor.toObject() : visitor;
    }

    const visitor = this.visitors.find(v => v._id?.toString() === id?.toString() || v.visitorNumber === id);
    if (!visitor) return null;
    visitor.status = stage;
    visitor.approvalNotes = notes || '';
    visitor.timeline = visitor.timeline || [];
    visitor.timeline.push(timelineEvent);
    visitor.updatedAt = new Date();
    return visitor;
  }

  async revokePass(id, resident) {
    await this.ensureSeeded();
    const timelineEvent = {
      stage: 'Pass Revoked',
      timestamp: new Date(),
      actor: resident?.name || 'Resident',
      role: 'resident',
      note: 'Pre-authorized pass cancelled by resident before arrival.',
    };

    if (this.isMongoConnected()) {
      const visitor = mongoose.isValidObjectId(id)
        ? await Visitor.findById(id)
        : await Visitor.findOne({ visitorNumber: id });
      if (!visitor) return null;
      visitor.status = 'Revoked';
      visitor.timeline.push(timelineEvent);
      visitor.updatedAt = new Date();
      await visitor.save();
      return visitor.toObject ? visitor.toObject() : visitor;
    }

    const visitor = this.visitors.find(v => v._id?.toString() === id?.toString() || v.visitorNumber === id);
    if (!visitor) return null;
    visitor.status = 'Revoked';
    visitor.timeline = visitor.timeline || [];
    visitor.timeline.push(timelineEvent);
    visitor.updatedAt = new Date();
    return visitor;
  }

  // ==========================================
  // MILESTONE 5: DELIVERIES MANAGEMENT
  // ==========================================

  async getDeliveries(societyId, filter = {}) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const query = { societyId };
      if (filter.flatNumber) query.flatNumber = filter.flatNumber;
      if (filter.status) query.status = filter.status;
      if (filter.carrier) query.carrier = filter.carrier;
      return await Delivery.find(query).sort({ arrivedAt: -1 });
    }

    return this.deliveries
      .filter(d => {
        if (d.societyId?.toString() !== societyId?.toString()) return false;
        if (filter.flatNumber && d.flatNumber !== filter.flatNumber) return false;
        if (filter.status && d.status !== filter.status) return false;
        if (filter.carrier && d.carrier !== filter.carrier) return false;
        return true;
      })
      .sort((a, b) => new Date(b.arrivedAt) - new Date(a.arrivedAt));
  }

  async getPendingDeliveriesCount(societyId, flatNumber) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const query = { societyId, status: { $in: ['Waiting at Gate', 'Waiting for Courier OTP'] } };
      if (flatNumber) query.flatNumber = flatNumber;
      return await Delivery.countDocuments(query);
    }

    return this.deliveries.filter(d => {
      if (d.societyId?.toString() !== societyId?.toString()) return false;
      if (!['Waiting at Gate', 'Waiting for Courier OTP'].includes(d.status)) return false;
      if (flatNumber && d.flatNumber !== flatNumber) return false;
      return true;
    }).length;
  }

  async logDelivery(data, guard) {
    await this.ensureSeeded();
    const deliveryNumber = `DEL-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const requiresCourierOtp = data.requiresCourierOtp !== undefined ? Boolean(data.requiresCourierOtp) : true;
    const initialStatus = requiresCourierOtp ? 'Waiting for Courier OTP' : 'Waiting at Gate';

    const deliveryPayload = {
      societyId: data.societyId,
      deliveryNumber,
      flatNumber: data.flatNumber,
      wing: data.wing || 'Wing B',
      residentName: data.residentName || '',
      carrier: data.carrier || 'Amazon',
      packageCount: Number(data.packageCount) || 1,
      trackingNumber: data.trackingNumber || '',
      photoUrl: data.photoUrl || '',
      status: data.status || initialStatus,
      requiresCourierOtp,
      courierDeliveryOtp: '',
      otpSharedWithCourier: false,
      otpSharedAt: null,
      arrivalGate: data.arrivalGate || 'Main Gate 1',
      securityGuardName: guard?.name || 'Gate Security',
      arrivedAt: new Date(),
      pickupOtp,
      notes: data.notes || '',
    };

    if (this.isMongoConnected()) {
      const delivery = await Delivery.create(deliveryPayload);
      return delivery.toObject ? delivery.toObject() : delivery;
    }

    const inMemDelivery = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...deliveryPayload,
    };
    this.deliveries.unshift(inMemDelivery);
    return inMemDelivery;
  }

  async shareCourierDeliveryOtp(id, otp, residentUser) {
    await this.ensureSeeded();
    if (!otp || typeof otp !== 'string' || !otp.trim()) {
      const err = new Error('Courier delivery OTP cannot be empty.');
      err.code = 'INVALID_OTP';
      throw err;
    }

    const trimmedOtp = otp.trim();

    if (this.isMongoConnected()) {
      const delivery = mongoose.isValidObjectId(id)
        ? await Delivery.findById(id)
        : await Delivery.findOne({ deliveryNumber: id });
      if (!delivery) return null;

      if (residentUser?.role === 'resident' && residentUser.flatNumber && delivery.flatNumber !== residentUser.flatNumber) {
        const err = new Error('Unauthorized to provide OTP for another flat.');
        err.code = 'UNAUTHORIZED';
        throw err;
      }

      delivery.courierDeliveryOtp = trimmedOtp;
      await delivery.save();
      return delivery.toObject ? delivery.toObject() : delivery;
    }

    const delivery = this.deliveries.find(d => d._id?.toString() === id?.toString() || d.deliveryNumber === id);
    if (!delivery) return null;
    if (residentUser?.role === 'resident' && residentUser.flatNumber && delivery.flatNumber !== residentUser.flatNumber) {
      const err = new Error('Unauthorized to provide OTP for another flat.');
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    delivery.courierDeliveryOtp = trimmedOtp;
    return delivery;
  }

  async markCourierOtpShared(id, securityUser) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const delivery = mongoose.isValidObjectId(id)
        ? await Delivery.findById(id)
        : await Delivery.findOne({ deliveryNumber: id });
      if (!delivery) return null;

      delivery.otpSharedWithCourier = true;
      delivery.otpSharedAt = new Date();
      delivery.status = 'Waiting at Gate';
      await delivery.save();
      return delivery.toObject ? delivery.toObject() : delivery;
    }

    const delivery = this.deliveries.find(d => d._id?.toString() === id?.toString() || d.deliveryNumber === id);
    if (!delivery) return null;
    delivery.otpSharedWithCourier = true;
    delivery.otpSharedAt = new Date();
    delivery.status = 'Waiting at Gate';
    return delivery;
  }

  async confirmDeliveryPickup(id, otp, actor) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const delivery = mongoose.isValidObjectId(id)
        ? await Delivery.findById(id)
        : await Delivery.findOne({ deliveryNumber: id });
      if (!delivery) return null;
      if (otp && delivery.pickupOtp && delivery.pickupOtp.trim() !== otp.trim()) {
        const err = new Error('Invalid 4-digit pickup verification code.');
        err.code = 'INVALID_OTP';
        throw err;
      }
      delivery.status = 'Picked Up';
      delivery.pickedUpAt = new Date();
      delivery.pickedUpBy = actor?.name || (actor?.role === 'resident' ? `${actor?.name || 'Resident'} (Flat ${actor?.flatNumber})` : 'Resident');
      await delivery.save();
      return delivery.toObject ? delivery.toObject() : delivery;
    }

    const delivery = this.deliveries.find(d => d._id?.toString() === id?.toString() || d.deliveryNumber === id);
    if (!delivery) return null;
    if (otp && delivery.pickupOtp && delivery.pickupOtp.trim() !== otp.trim()) {
      const err = new Error('Invalid 4-digit pickup verification code.');
      err.code = 'INVALID_OTP';
      throw err;
    }
    delivery.status = 'Picked Up';
    delivery.pickedUpAt = new Date();
    delivery.pickedUpBy = actor?.name || (actor?.role === 'resident' ? `${actor?.name || 'Resident'} (Flat ${actor?.flatNumber})` : 'Resident');
    return delivery;
  }

  // ==========================================
  // MILESTONE 5: FACILITY BOOKINGS & ENGINE
  // ==========================================

  getFacilityList() {
    return this.facilities;
  }

  async getFacilityBookings(societyId, filter = {}) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const query = { societyId };
      if (filter.facilityId) query.facilityId = filter.facilityId;
      if (filter.flatNumber) query.flatNumber = filter.flatNumber;
      if (filter.date) query.date = filter.date;
      if (filter.status) query.status = filter.status;
      return await FacilityBooking.find(query).sort({ date: 1, startTime: 1 });
    }

    return this.facilityBookings
      .filter(b => {
        if (b.societyId?.toString() !== societyId?.toString()) return false;
        if (filter.facilityId && b.facilityId !== filter.facilityId) return false;
        if (filter.flatNumber && b.flatNumber !== filter.flatNumber) return false;
        if (filter.date && b.date !== filter.date) return false;
        if (filter.status && b.status !== filter.status) return false;
        return true;
      })
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  }

  async checkFacilityAvailability(societyId, facilityId, date) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      return await FacilityBooking.find({
        societyId,
        facilityId,
        date,
        status: 'Booked',
      }).select('startTime endTime bookingNumber residentName flatNumber');
    }

    return this.facilityBookings
      .filter(b =>
        b.societyId?.toString() === societyId?.toString() &&
        b.facilityId === facilityId &&
        b.date === date &&
        b.status === 'Booked'
      )
      .map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        bookingNumber: b.bookingNumber,
        residentName: b.residentName,
        flatNumber: b.flatNumber,
      }));
  }

  async createFacilityBooking(data, resident) {
    await this.ensureSeeded();
    const { societyId, facilityId, facilityName, date, startTime, endTime, purpose, guestCount } = data;
    const flatNumber = resident?.flatNumber || data.flatNumber;
    const residentName = resident?.name || data.residentName || 'Resident';
    const wing = resident?.wing || data.wing || '';
    const residentId = resident?._id || resident?.id || null;

    if (!societyId || !facilityId || !date || !startTime || !endTime || !flatNumber) {
      const err = new Error('Missing required booking parameters (facility, date, time slot, flat).');
      err.code = 'VALIDATION_ERROR';
      throw err;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (this.isMongoConnected()) {
      // 1. Strict zero-overlap atomic conflict check
      const conflict = await FacilityBooking.findOne({
        societyId,
        facilityId,
        date,
        status: 'Booked',
        $and: [
          { startTime: { $lt: endTime } },
          { endTime: { $gt: startTime } },
        ],
      });

      if (conflict) {
        const err = new Error(`Time slot conflict: ${facilityName || 'Facility'} is already reserved from ${conflict.startTime} to ${conflict.endTime} on ${date}.`);
        err.code = 'SLOT_CONFLICT';
        throw err;
      }

      // 2. Check flat quota (max 2 active future/current bookings)
      const activeBookingsCount = await FacilityBooking.countDocuments({
        societyId,
        flatNumber,
        status: 'Booked',
        date: { $gte: todayStr },
      });

      if (activeBookingsCount >= 2) {
        const err = new Error('Flat booking quota exceeded. Each residence is limited to a maximum of 2 active facility reservations to ensure fair community access.');
        err.code = 'QUOTA_EXCEEDED';
        throw err;
      }

      // 3. Create booking
      const bookingNumber = `BKG-${Math.floor(1000 + Math.random() * 9000)}`;
      const newBooking = await FacilityBooking.create({
        societyId,
        bookingNumber,
        facilityId,
        facilityName: facilityName || facilityId,
        residentId,
        residentName,
        flatNumber,
        wing,
        date,
        startTime,
        endTime,
        purpose: purpose || 'Recreation & Fitness',
        guestCount: Number(guestCount) || 1,
        status: 'Booked',
        bookedAt: new Date(),
      });

      return newBooking.toObject ? newBooking.toObject() : newBooking;
    }

    // In-Memory Fallback
    const conflict = this.facilityBookings.find(b =>
      b.societyId?.toString() === societyId?.toString() &&
      b.facilityId === facilityId &&
      b.date === date &&
      b.status === 'Booked' &&
      b.startTime < endTime &&
      b.endTime > startTime
    );

    if (conflict) {
      const err = new Error(`Time slot conflict: ${facilityName || 'Facility'} is already reserved from ${conflict.startTime} to ${conflict.endTime} on ${date}.`);
      err.code = 'SLOT_CONFLICT';
      throw err;
    }

    const activeBookingsCount = this.facilityBookings.filter(b =>
      b.societyId?.toString() === societyId?.toString() &&
      b.flatNumber === flatNumber &&
      b.status === 'Booked' &&
      b.date >= todayStr
    ).length;

    if (activeBookingsCount >= 2) {
      const err = new Error('Flat booking quota exceeded. Each residence is limited to a maximum of 2 active facility reservations to ensure fair community access.');
      err.code = 'QUOTA_EXCEEDED';
      throw err;
    }

    const bookingNumber = `BKG-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      _id: new mongoose.Types.ObjectId().toString(),
      societyId,
      bookingNumber,
      facilityId,
      facilityName: facilityName || facilityId,
      residentId,
      residentName,
      flatNumber,
      wing,
      date,
      startTime,
      endTime,
      purpose: purpose || 'Recreation & Fitness',
      guestCount: Number(guestCount) || 1,
      status: 'Booked',
      bookedAt: new Date(),
    };

    this.facilityBookings.unshift(newBooking);
    return newBooking;
  }

  async cancelFacilityBooking(id, reason, actor) {
    await this.ensureSeeded();
    if (this.isMongoConnected()) {
      const booking = mongoose.isValidObjectId(id)
        ? await FacilityBooking.findById(id)
        : await FacilityBooking.findOne({ bookingNumber: id });
      if (!booking) return null;
      booking.status = 'Cancelled';
      booking.cancelledAt = new Date();
      booking.cancelledBy = actor?.name || 'Resident';
      booking.cancellationReason = reason || 'Cancelled by resident';
      await booking.save();
      return booking.toObject ? booking.toObject() : booking;
    }

    const booking = this.facilityBookings.find(b => b._id?.toString() === id?.toString() || b.bookingNumber === id);
    if (!booking) return null;
    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = actor?.name || 'Resident';
    booking.cancellationReason = reason || 'Cancelled by resident';
    return booking;
  }
}

export const dataStore = new DataStore();
