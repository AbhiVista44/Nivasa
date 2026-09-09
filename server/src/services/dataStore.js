import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initialSocieties, initialUsers } from '../data/seedData.js';
import { User } from '../models/User.js';
import { Society } from '../models/Society.js';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'nivasa_super_secret_jwt_key_2026_resident_community';

class DataStore {
  constructor() {
    this.societies = [...initialSocieties];
    this.users = initialUsers.map(u => ({
      ...u,
      passwordHash: bcrypt.hashSync(u.password, 10),
    }));
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
