import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Shield,
  Home,
  Wrench,
  ChevronDown,
  Bell,
  LogOut,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';

export const Navbar = () => {
  const { user, society, societies, role, switchRole, switchSociety, logout } = useAuth();
  const [societyDropdownOpen, setSocietyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const rolesConfig = [
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100', activeRing: 'ring-2 ring-indigo-500' },
    { id: 'resident', label: 'Resident', icon: Home, color: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100', activeRing: 'ring-2 ring-emerald-600' },
    { id: 'security', label: 'Security', icon: Shield, color: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100', activeRing: 'ring-2 ring-amber-500' },
    { id: 'vendor', label: 'Vendor', icon: Wrench, color: 'text-orange-800 bg-orange-50 border-orange-200 hover:bg-orange-100', activeRing: 'ring-2 ring-orange-500' },
  ];

  const demoNotifications = [
    { id: 1, title: 'Gate Alert: Amazon Delivery', desc: 'Package arrived at Main Gate for Flat B-402', time: '5m ago', unread: true },
    { id: 2, title: 'Complaint Status Updated', desc: 'Plumbing request moved to "In Progress"', time: '25m ago', unread: true },
    { id: 3, title: 'Society Notice', desc: 'Annual Clubhouse Maintenance on Saturday', time: '2h ago', unread: false },
  ];

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

          {/* Multi-Tenant Society Switcher */}
          <div className="relative">
            <button
              onClick={() => setSocietyDropdownOpen(!societyDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-xs text-slate-700 font-medium transition"
              title="Switch Active Society (Tenant Isolation Demo)"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-semibold max-w-[150px] truncate">{society?.name}</span>
              <span className="bg-teal-100 text-teal-800 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                {society?.code}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {societyDropdownOpen && (
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
                      <p className="text-[11px] text-slate-500">{s.city} • {s.totalFlats} flats</p>
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

        {/* Center: 1-Click Role Switcher Pill Bar (Paired Dev Testing Feature) */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
          <span className="text-[11px] font-semibold text-slate-500 uppercase px-2 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Demo Role:
          </span>
          {rolesConfig.map((r) => {
            const Icon = r.icon;
            const isActive = role === r.id;
            return (
              <button
                key={r.id}
                onClick={() => switchRole(r.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${r.color} ${
                  isActive ? `${r.activeRing} shadow-xs font-bold scale-102` : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800">Notifications</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                    2 New
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {demoNotifications.map((n) => (
                    <div key={n.id} className={`p-3 hover:bg-slate-50 text-xs transition ${n.unread ? 'bg-amber-50/40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 transition"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
              />
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 font-medium capitalize flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {role} {user?.flatNumber ? `• ${user.flatNumber}` : ''}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full uppercase bg-teal-100 text-teal-800">
                      {role}
                    </span>
                  </div>
                </div>

                {/* Mobile Quick Role Selector */}
                <div className="lg:hidden px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1.5">Switch Role</p>
                  <div className="grid grid-cols-2 gap-1">
                    {rolesConfig.map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          switchRole(r.id);
                          setUserDropdownOpen(false);
                        }}
                        className={`text-left px-2 py-1 rounded text-xs font-medium ${role === r.id ? 'bg-teal-50 text-teal-800 font-bold' : 'text-slate-600'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    logout();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition font-medium"
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
