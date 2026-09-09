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
