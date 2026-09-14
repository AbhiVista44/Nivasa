import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext(null);

// Audio tone synthesizer using standard Web Audio API (zero external mp3 file dependencies)
const playAudioTone = (type = 'chime') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'chime') {
      // Pleasant dual-frequency soft chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } else if (type === 'gate') {
      // Classic Ding-Dong gate chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.35); // C5
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.1);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.35);
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 1.1);
    } else if (type === 'siren') {
      // Emergency alert oscillating siren
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.25);
      osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.5);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.75);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.0);
    }
  } catch (err) {
    // AudioContext autoplay restrictions are handled gracefully
  }
};

const DEFAULT_PREFERENCES = {
  soundEnabled: true,
  visitorAlerts: true,
  complaintAlerts: true,
  deliveryAlerts: true,
  noticeAlerts: true,
};

export const SocketProvider = ({ children }) => {
  const { user, society, role } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'init-1',
      category: 'visitor',
      title: 'Dr. Rajesh Kulkarni Approved',
      message: 'Gate pass #718902 is active for Flat B-402',
      priority: 'normal',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'init-2',
      category: 'delivery',
      title: 'Amazon Package at Gate',
      message: 'Held at Main Gate 1 • Pickup OTP: 4821',
      priority: 'normal',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      read: false,
    },
  ]);

  // Active visitor popup for resident approval
  const [activeGateApproval, setActiveGateApproval] = useState(null);

  // User notification preferences (persisted in localStorage)
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('nivasa_notification_prefs');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const savePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem('nivasa_notification_prefs', JSON.stringify(newPrefs));
    } catch {}
  };

  const addNotification = useCallback((item) => {
    const newNotif = {
      id: item.id || 'notif_' + Date.now() + Math.random().toString(36).slice(2, 6),
      category: item.category || 'general',
      title: item.title,
      message: item.message,
      priority: item.priority || 'normal',
      data: item.data || null,
      timestamp: item.timestamp || new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);

    // Audio cues based on preferences
    if (preferences.soundEnabled) {
      if (item.category === 'emergency' || item.priority === 'urgent') {
        playAudioTone('siren');
      } else if (item.category === 'visitor') {
        playAudioTone('gate');
      } else {
        playAudioTone('chime');
      }
    }
  }, [preferences.soundEnabled]);

  // Connect Socket.IO
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('nivasa_token'),
        societyId: society?._id || '67a800000000000000000001',
        flatNumber: user?.flatNumber || 'B-402',
        role: role || 'resident',
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('⚡ Connected to Nivasa Real-Time Socket Hub');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Real-time Event Handlers
    newSocket.on('notification:new', (data) => {
      addNotification(data);
    });

    // Gate arrival event
    newSocket.on('gate:visitor_arrived', (payload) => {
      addNotification({
        category: 'visitor',
        title: 'Visitor at Gate: ' + payload.visitor?.name,
        message: `${payload.visitor?.name} reached ${payload.visitor?.entryGate || 'Main Gate 1'} for Flat ${payload.visitor?.flatNumber}`,
        priority: 'high',
        data: payload.visitor,
      });

      // If resident of that flat, show high-priority interactive popup
      if (role === 'resident' && (!user?.flatNumber || user?.flatNumber === payload.visitor?.flatNumber)) {
        setActiveGateApproval(payload.visitor);
      }
    });

    // Gate approval event
    newSocket.on('gate:visitor_approval_changed', (payload) => {
      addNotification({
        category: 'visitor',
        title: payload.title,
        message: payload.message,
        data: payload.visitor,
      });
    });

    // Complaint update event
    newSocket.on('complaint:updated', (payload) => {
      addNotification({
        category: 'complaint',
        title: payload.title,
        message: payload.message,
        data: payload.complaint,
      });
    });

    // Delivery parcel arrival event
    newSocket.on('delivery:arrived', (payload) => {
      addNotification({
        category: 'delivery',
        title: payload.title,
        message: payload.message,
        data: payload.delivery,
      });
    });

    // Notice broadcast event
    newSocket.on('notice:new', (payload) => {
      addNotification({
        category: 'notice',
        title: payload.title,
        message: payload.message,
        priority: payload.notice?.type === 'urgent' ? 'urgent' : 'normal',
        data: payload.notice,
      });
    });

    // Emergency alert
    newSocket.on('emergency:siren', (payload) => {
      addNotification({
        category: 'emergency',
        title: payload.title,
        message: payload.message,
        priority: 'urgent',
        data: payload.alert,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, society?._id, role, user?.flatNumber, addNotification]);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const respondToGateApproval = async (visitorId, approve) => {
    try {
      const endpoint = approve ? `/visitors/${visitorId}/approve` : `/visitors/${visitorId}/reject`;
      await api.post(endpoint, { notes: approve ? 'Approved via real-time gate pass popup.' : 'Denied by resident.' });
      setActiveGateApproval(null);
      addNotification({
        category: 'visitor',
        title: approve ? 'Gate Entry Approved' : 'Gate Entry Denied',
        message: `You have ${approve ? 'approved' : 'denied'} entry.`,
      });
    } catch (err) {
      console.error('Gate approval response failed:', err);
      setActiveGateApproval(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearAll,
        addNotification,
        activeGateApproval,
        dismissGateApproval: () => setActiveGateApproval(null),
        respondToGateApproval,
        preferences,
        savePreferences,
        playTestTone: playAudioTone,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
