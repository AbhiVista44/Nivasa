import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NotificationTray } from '../notifications/NotificationTray';
import { NotificationPreferencesModal } from '../notifications/NotificationPreferencesModal';
import {
  Building2,
  ChevronDown,
  Bell,
  LogOut,
  MapPin,
  Check
} from 'lucide-react';

export const Navbar = () => {
  const { user, society, societies, role, switchSociety, logout } = useAuth();
  const { unreadCount, connected } = useSocket();
  const [societyDropdownOpen, setSocietyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Society Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-900 to-teal-700 text-amber-400 flex items-center justify-center shadow-md shadow-teal-900/10">
              <Building2 className="w-5 h-5 text-amber-300 stroke-[2.2]" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display font-bold text-xl tracking-tight text-slate-900">
                Nivasa
              </span>
              <span className="text-xs block text-teal-700 font-medium -mt-1 tracking-wide">
                Community OS
              </span>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />

          {/* Active Society Indicator / Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                if (societies.length > 1) {
                  setSocietyDropdownOpen(!societyDropdownOpen);
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-xs text-slate-700 font-medium transition"
              title="Active Society"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-semibold max-w-[160px] truncate">{society?.name || 'Nivasa Society'}</span>
              {society?.code && (
                <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  {society.code}
                </span>
              )}
              {societies.length > 1 && (
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>

            {societyDropdownOpen && societies.length > 1 && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1.5 border-b border-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Select Society / Tenant
                  </p>
                </div>
                {societies.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => {
                      switchSociety(s._id);
                      setSocietyDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-teal-50 transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-[11px] text-slate-500">{s.city} • {s.totalFlats || 0} flats</p>
                    </div>
                    {society?._id === s._id && (
                      <Check className="w-4 h-4 text-teal-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Real-Time Notifications Hub */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2 rounded-xl transition cursor-pointer ${
                notificationsOpen
                  ? 'bg-teal-50 text-teal-800'
                  : 'text-slate-600 hover:text-teal-700 hover:bg-slate-100'
              }`}
              aria-label="Real-time notifications"
              title={connected ? 'Real-Time Sync Active' : 'Connecting to Live Hub...'}
            >
              <Bell className="w-5 h-5" />

              {/* Live Connection Indicator */}
              <span
                className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ring-2 ring-white ${
                  connected ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'
                }`}
                title={connected ? 'Connected' : 'Connecting'}
              />

              {/* Unread Count Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-900 font-extrabold text-[10px] rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-in zoom-in-50">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <NotificationTray
                onClose={() => setNotificationsOpen(false)}
                onOpenPreferences={() => {
                  setNotificationsOpen(false);
                  setPreferencesOpen(true);
                }}
              />
            )}
          </div>

          {preferencesOpen && (
            <NotificationPreferencesModal onClose={() => setPreferencesOpen(false)} />
          )}

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition cursor-pointer"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-teal-800 text-amber-300 font-bold flex items-center justify-center text-xs shadow-xs">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {role} {user?.flatNumber ? `• ${user.flatNumber}` : ''}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-teal-100 text-teal-800">
                      {role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
