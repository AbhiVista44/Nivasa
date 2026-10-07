import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nivasa_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [society, setSociety] = useState(() => {
    try {
      const saved = localStorage.getItem('nivasa_society');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [societies, setSocieties] = useState([]);
  const [token, setToken] = useState(() => localStorage.getItem('nivasa_token') || null);
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
    } else {
      localStorage.removeItem('nivasa_society');
      localStorage.removeItem('nivasa_society_id');
    }
  }, [society]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('nivasa_token', token);
    } else {
      localStorage.removeItem('nivasa_token');
    }
  }, [token]);

  // Fetch societies list from backend API
  const refreshSocieties = async () => {
    try {
      const res = await api.get('/societies');
      if (res.data?.societies) {
        setSocieties(res.data.societies);
      }
    } catch (err) {
      console.warn('Could not fetch societies list:', err.message);
    }
  };

  useEffect(() => {
    refreshSocieties();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data.user);
        setSociety(res.data.society);
        setToken(res.data.token);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      const networkMsg = !err.response
        ? 'Cannot reach backend server. Please make sure the Nivasa backend is running on port 5000.'
        : null;
      return {
        success: false,
        message: serverMsg || networkMsg || err.message || 'Login failed. Please verify your credentials and network connection.',
      };
    } finally {
      setLoading(false);
    }
  };

  const registerSociety = async (registrationData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register-society', registrationData);
      if (res.data.success) {
        setUser(res.data.user);
        setSociety(res.data.society);
        setToken(res.data.token);
        await refreshSocieties();
        return { success: true, user: res.data.user, society: res.data.society };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      const networkMsg = !err.response
        ? 'Cannot reach backend server. Please make sure the Nivasa backend is running on port 5000.'
        : null;
      return {
        success: false,
        message: serverMsg || networkMsg || err.message || 'Failed to register society. Please check your inputs.',
      };
    } finally {
      setLoading(false);
    }
  };

  const switchSociety = (targetSocietyId) => {
    const found = societies.find(s => s._id === targetSocietyId);
    if (found) {
      setSociety(found);
      setUser(prev => prev ? {
        ...prev,
        societyId: found._id,
      } : null);
    }
  };

  const logout = () => {
    setUser(null);
    setSociety(null);
    setToken(null);
    localStorage.removeItem('nivasa_token');
    localStorage.removeItem('nivasa_user');
    localStorage.removeItem('nivasa_society');
    localStorage.removeItem('nivasa_society_id');
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
        registerSociety,
        refreshSocieties,
        logout,
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
