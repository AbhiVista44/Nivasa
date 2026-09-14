import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ShieldCheck,
  Package,
  CalendarDays,
  Megaphone,
  Briefcase,
  History,
  QrCode,
  UserCheck,
  Building,
  AlertTriangle,
  Clock
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab }) => {
  const { role, society } = useAuth();

  const navConfigs = {
    admin: [
      { id: 'overview', label: 'Overview & Stats', icon: LayoutDashboard },
      { id: 'residents', label: 'Residents & Flats', icon: Users },
      { id: 'complaints', label: 'Maintenance Complaints', icon: Wrench, badge: 'AI Assumed' },
      { id: 'gate', label: 'Security & Visitors', icon: ShieldCheck },
      { id: 'deliveries', label: 'Delivery Log', icon: Package },
      { id: 'facilities', label: 'Facility Bookings', icon: CalendarDays },
      { id: 'notices', label: 'Notices & Broadcasts', icon: Megaphone },
      { id: 'vendors', label: 'Vendor Directory', icon: Briefcase },
      { id: 'audit', label: 'Society Audit Trail', icon: History },
    ],
    resident: [
      { id: 'home', label: 'My Flat & Family', icon: Building },
      { id: 'complaints', label: 'Complaints (+ Groq AI)', icon: Wrench, highlight: true },
      { id: 'visitors', label: 'Visitor Gate Passes', icon: QrCode },
      { id: 'deliveries', label: 'Delivery Arrivals', icon: Package },
      { id: 'facilities', label: 'Book Amenities', icon: CalendarDays },
      { id: 'notices', label: 'Society Notices', icon: Megaphone },
      { id: 'vendors', label: 'Approved Vendors', icon: Briefcase },
      { id: 'history', label: 'My Activity Log', icon: Clock },
    ],
    security: [
      { id: 'gate-console', label: 'Gate Console', icon: ShieldCheck },
      { id: 'scan-pass', label: 'Scan QR / Passcode', icon: QrCode },
      { id: 'walk-in', label: 'Walk-In Registration', icon: UserCheck },
      { id: 'deliveries', label: 'Delivery Entry', icon: Package },
      { id: 'inside-roster', label: 'Inside Society (Live)', icon: Users, badge: 'Live' },
      { id: 'emergency', label: 'Emergency Alert', icon: AlertTriangle, danger: true },
    ],
    vendor: [
      { id: 'assigned-jobs', label: 'Assigned Jobs', icon: Wrench, badge: '3 Open' },
      { id: 'schedule', label: 'Visit Schedule', icon: CalendarDays },
      { id: 'history', label: 'Completed Services', icon: History },
      { id: 'profile', label: 'Business Profile & Ratings', icon: Briefcase },
    ],
  };

  const navItems = navConfigs[role] || navConfigs.resident;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-4rem)]">
      
      {/* Role Banner Accent */}
      <div className="px-4 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">
            Active Workspace
          </span>
          <p className="text-xs font-semibold text-white capitalize">
            {role} Portal
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
          v1.0
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-950/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive
                      ? 'text-amber-300 stroke-[2.2]'
                      : 'text-slate-400 group-hover:text-teal-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-amber-400 text-slate-900 font-extrabold'
                      : 'bg-slate-800 text-teal-300 border border-teal-900/60'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Tenant Footer Card */}
      <div className="p-3 m-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] font-medium text-slate-300 truncate">
            {society?.name || 'Gulmohar Greens'}
          </p>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          {society?.city} • Code: <span className="font-mono text-teal-400">{society?.code}</span>
        </p>
      </div>
    </aside>
  );
};
