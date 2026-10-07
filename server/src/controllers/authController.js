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
      !societyCode?.trim() ||
      !adminName?.trim() ||
      !adminEmail?.trim() ||
      !adminPassword
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide society name, society code, admin name, email, and password.',
      });
    }

    const { society, user } = await dataStore.registerSociety({
      societyName: societyName.trim(),
      societyCode: societyCode.trim(),
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

export const demoLogin = async (req, res) => {
  try {
    const { role = 'admin', societyCode = 'GGH-01' } = req.body;
    const users = await dataStore.getDemoUsers();
    const societies = await dataStore.getSocieties();

    const targetSociety = (societies && societies.find(s => s.code === societyCode)) || (societies && societies[0]) || null;
    const user = users.find(u => u.role === role && targetSociety && u.societyId?.toString() === targetSociety._id?.toString()) ||
                 users.find(u => u.role === role) ||
                 users[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'Demo user not found for requested role.' });
    }

    const token = dataStore.generateToken(user);
    const society = await dataStore.getSocietyById(user.societyId);

    await dataStore.logAction({
      societyId: user.societyId,
      actorId: user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'DEMO_SWITCH_ROLE',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { role: user.role },
    });

    res.json({
      success: true,
      token,
      user,
      society,
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ success: false, message: 'Demo login failed.' });
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

export const getDemoAccounts = async (req, res) => {
  try {
    const users = await dataStore.getDemoUsers();
    const societies = await dataStore.getSocieties();

    const accounts = users.map(u => {
      const society = societies.find(s => s._id.toString() === u.societyId.toString());
      return {
        ...u,
        societyName: society?.name || 'Gulmohar Greens Heights',
        societyCode: society?.code || 'GGH-01',
      };
    });

    res.json({
      success: true,
      accounts,
      societies,
    });
  } catch (error) {
    console.error('Demo accounts error:', error);
    res.status(500).json({ success: false, message: 'Could not fetch demo accounts.' });
  }
};
