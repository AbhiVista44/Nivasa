import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const DEFAULT_SOCIETY = {
  _id: '67a800000000000000000001',
  name: 'Gulmohar Greens Heights',
  code: 'GGH-01',
  city: 'Pune',
  address: 'Plot 42, Palm Avenue, Sector 18, Kharadi',
  totalFlats: 160,
};

const DEFAULT_USERS = {
  admin: {
    _id: '67a800000000000000000010',
    societyId: '67a800000000000000000001',
    name: 'Priya Sharma',
    email: 'admin@gulmohar.com',
    role: 'admin',
    phone: '+91 98230 11223',
    flatNumber: 'Admin Suite A-101',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  resident: {
    _id: '67a800000000000000000011',
    societyId: '67a800000000000000000001',
    name: 'Rahul & Ananya Verma',
    email: 'resident@gulmohar.com',
    role: 'resident',
    phone: '+91 98221 44556',
    wing: 'Wing B (Sapphire)',
    flatNumber: 'B-402',
    isOwner: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  security: {
    _id: '67a800000000000000000012',
    societyId: '67a800000000000000000001',
    name: 'Ramesh Singh',
    email: 'security@gulmohar.com',
    role: 'security',
    phone: '+91 98110 77889',
    gatePost: 'Main Gate 1 (North Arch)',
    badgeNumber: 'SEC-089',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  vendor: {
    _id: '67a800000000000000000013',
    societyId: '67a800000000000000000001',
    name: 'Sunil Kumar',
    email: 'vendor@gulmohar.com',
    role: 'vendor',
    phone: '+91 98901 33445',
    businessName: 'Apex Plumbing & Sanitation',
    serviceCategory: 'Plumbing',
    rating: 4.85,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nivasa_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS.resident;
  });

  const [society, setSociety] = useState(() => {
    const saved = localStorage.getItem('nivasa_society');
    return saved ? JSON.parse(saved) : DEFAULT_SOCIETY;
  });

  const [societies, setSocieties] = useState([
    DEFAULT_SOCIETY,
    {
      _id: '67a800000000000000000002',
      name: 'Palm Crest Enclave',
      code: 'PCE-02',
      city: 'Mumbai',
      address: 'Link Road, Andheri West',
      totalFlats: 240,
    },
  ]);

  const [token, setToken] = useState(() => localStorage.getItem('nivasa_token') || 'demo_jwt_token_resident');
  const [loading, setLoading] = useState(false);

  // Sync state with storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('nivasa_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('nivasa_user');
    }
  }, [user]);

  useEffect(() => {
    if (society) {
      localStorage.setItem('nivasa_society', JSON.stringify(society));
      localStorage.setItem('nivasa_society_id', society._id);
    }
  }, [society]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('nivasa_token', token);
    } else {
      localStorage.removeItem('nivasa_token');
    }
  }, [token]);

  // Try fetching fresh societies list from backend API
  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get('/societies');
        if (res.data?.societies?.length > 0) {
          setSocieties(res.data.societies);
        }
      } catch (err) {
        // Fall back to default societies
      }
    };
    fetchSocieties();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setSociety(res.data.society);
        setToken(res.data.token);
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      // Local fallback for offline testing
      const found = Object.values(DEFAULT_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setUser(found);
        setSociety(DEFAULT_SOCIETY);
        setToken(`mock_token_${found.role}`);
        return { success: true };
      }
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (targetRole) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/demo-login', {
        role: targetRole,
        societyCode: society.code || 'GGH-01',
      });
      if (res.data.success) {
        setUser(res.data.user);
        setSociety(res.data.society);
        setToken(res.data.token);
      }
    } catch (err) {
      // Fallback
      if (DEFAULT_USERS[targetRole]) {
        setUser(DEFAULT_USERS[targetRole]);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchSociety = (targetSocietyId) => {
    const found = societies.find(s => s._id === targetSocietyId);
    if (found) {
      setSociety(found);
      // If user is resident, adapt flat/society
      setUser(prev => ({
        ...prev,
        societyId: found._id,
      }));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('nivasa_token');
    localStorage.removeItem('nivasa_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        society,
        societies,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role || 'resident',
        login,
        logout,
        switchRole,
        switchSociety,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
