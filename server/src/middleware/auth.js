import jwt from 'jsonwebtoken';
import { dataStore } from '../services/dataStore.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nivasa_super_secret_jwt_key_2026_resident_community');

    const user = await dataStore.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session expired.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is inactive or pending approval.' });
    }

    req.user = user;
    req.societyId = user.societyId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

export const requireRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated user.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles [${roles.join(', ')}]. Your role is '${req.user.role}'.`
      });
    }

    next();
  };
};

export const requireTenant = (req, res, next) => {
  const headerSocietyId = req.headers['x-society-id'];
  if (headerSocietyId && req.user.role !== 'admin') {
    if (req.user.societyId.toString() !== headerSocietyId.toString()) {
      return res.status(403).json({ success: false, message: 'Cross-tenant access forbidden.' });
    }
  }
  next();
};
