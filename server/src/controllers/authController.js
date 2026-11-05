import bcrypt from 'bcryptjs';
import { dataStore } from '../services/dataStore.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = await dataStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : user.comparePassword
        ? await user.comparePassword(password)
        : password === user.password;

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = dataStore.generateToken(user);
    const society = await dataStore.getSocietyById(user.societyId);

    // Filter sensitive fields
    const { passwordHash: _passwordHash, password: _pwd, ...safeUser } = user.toObject ? user.toObject() : user;

    await dataStore.logAction({
      societyId: user.societyId,
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { role: user.role, email: user.email },
    });

    res.json({
      success: true,
      token,
      user: safeUser,
      society,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication.' });
  }
};

export const registerSociety = async (req, res) => {
  try {
    const {
      societyName,
      societyCode,
      city,
      address,
      pincode,
      adminName,
      adminEmail,
      adminPhone,
      adminPassword,
    } = req.body;

    if (
      !societyName?.trim() ||
      !adminName?.trim() ||
      !adminEmail?.trim() ||
      !adminPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide society name, admin name, email, and password.',
      });
    }

    const { society, user } = await dataStore.registerSociety({
      societyName: societyName.trim(),
      societyCode: societyCode ? societyCode.trim() : '',
      city: city ? city.trim() : 'Pune',
      address: address ? address.trim() : '',
      pincode: pincode ? pincode.trim() : '',
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      adminPhone: adminPhone ? adminPhone.trim() : '',
      adminPassword,
    });

    const token = dataStore.generateToken(user);

    await dataStore.logAction({
      societyId: society._id,
      actorId: user._id,
      actorName: user.name,
      actorRole: 'admin',
      action: 'SOCIETY_REGISTERED',
      targetType: 'Society',
      targetId: society._id.toString(),
      details: { societyName: society.name, code: society.code },
    });

    res.status(201).json({
      success: true,
      message: 'Society and admin account registered successfully!',
      token,
      user,
      society,
    });
  } catch (error) {
    console.error('Register society error:', error);
    const friendlyMessage = error.errors
      ? Object.values(error.errors).map(e => e.message).join(', ')
      : (error.message || 'Registration failed.');
    res.status(400).json({ success: false, message: friendlyMessage });
  }
};

export const provisionUser = async (req, res) => {
  try {
    const societyId = req.headers['x-society-id'] || req.user.societyId;
    const { name, email, password, phone, role, gatePost, badgeNumber, businessName, serviceCategory } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    const newUser = await dataStore.createStaffUser(societyId, {
      name,
      email,
      password,
      phone,
      role,
      gatePost,
      badgeNumber,
      businessName,
      serviceCategory,
    });

    await dataStore.logAction({
      societyId,
      actorId: req.user._id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_PROVISIONED',
      targetType: 'User',
      targetId: newUser._id.toString(),
      details: { role, email, name },
    });

    res.status(201).json({
      success: true,
      message: `${role.toUpperCase()} account for ${name} created successfully.`,
      user: newUser,
    });
  } catch (error) {
    console.error('Provision user error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to provision user.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await dataStore.findUserById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }
    const society = await dataStore.getSocietyById(user.societyId);
    res.json({
      success: true,
      user,
      society,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    await dataStore.changePassword(userId, currentPassword, newPassword);

    await dataStore.logAction({
      societyId: req.user.societyId,
      actorId: userId,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_PASSWORD_CHANGED',
      targetType: 'User',
      targetId: userId.toString(),
      details: { email: req.user.email, role: req.user.role },
    });

    res.json({
      success: true,
      message: 'Password changed successfully! You can now use your new password.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to change password. Please check your current password.',
    });
  }
};
