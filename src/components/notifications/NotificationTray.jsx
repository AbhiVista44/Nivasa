import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Bell,
  Check,
  Trash2,
  QrCode,
  Wrench,
  Package,
  Megaphone,
  AlertTriangle,
  Clock,
  Settings,
  X,
  Volume2
} from 'lucide-react';

const CATEGORY_CONFIG = {
  visitor: { label: 'Visitor', icon: QrCode, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  complaint: { label: 'Complaint', icon: Wrench, color: 'text-teal-600 bg-teal-50 border-teal-200' },
  delivery: { label: 'Delivery', icon: Package, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  notice: { label: 'Notice', icon: Megaphone, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  emergency: { label: 'Emergency', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  general: { label: 'General', icon: Bell, color: 'text-slate-600 bg-slate-50 border-slate-200' },
};

function timeAgo(date) {
  if (!date) return 'Just now';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const NotificationTray = ({ onClose, onOpenPreferences }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
    connected,
  } = useSocket();

  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    return n.category === activeFilter;
  });

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Notifications</h3>
            <p className="text-[10px] text-teal-200 flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {connected ? 'Real-Time Sync Active' : 'Connecting to Hub...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPreferences}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Notification Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-2 bg-slate-50 border-b border-slate-100 overflow-x-auto text-[11px] font-semibold">
        {[
          { key: 'all', label: 'All' },
          { key: 'visitor', label: 'Visitors' },
          { key: 'complaint', label: 'Complaints' },
          { key: 'delivery', label: 'Deliveries' },
          { key: 'notice', label: 'Notices' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`px-2.5 py-1 rounded-lg transition shrink-0 ${
              activeFilter === tab.key
                ? 'bg-teal-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <Bell className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-600">No notifications</p>
            <p className="text-[10px]">Real-time events will pop up here instantly.</p>
          </div>
        ) : (
          filtered.map(item => {
            const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
            const Icon = cfg.icon;

            return (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={`p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 ${
                  !item.read ? 'bg-teal-50/30' : ''
                }`}
              >
                <div className={`p-2 rounded-xl border shrink-0 ${cfg.color}`}>
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className={`text-xs font-bold truncate ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-snug">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{timeAgo(item.timestamp)}</span>
                    <span className="capitalize">• {cfg.label}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Actions */}
      {notifications.length > 0 && (
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold px-2 py-1 rounded-lg hover:bg-teal-50 transition"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>

          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-slate-400 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
