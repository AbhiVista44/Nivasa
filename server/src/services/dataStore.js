import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initialSocieties, initialUsers, initialFlats, initialComplaints } from '../data/seedData.js';
import { User } from '../models/User.js';
import { Society } from '../models/Society.js';
import { Flat } from '../models/Flat.js';
import { Complaint } from '../models/Complaint.js';
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
}

export const dataStore = new DataStore();
