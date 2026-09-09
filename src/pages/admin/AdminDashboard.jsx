import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Wrench,
  ShieldCheck,
  CalendarDays,
  Plus,
  ArrowUpRight,
  Building2,
  Users
} from 'lucide-react';
import { ResidentsFlatsDirectory } from '../../components/admin/ResidentsFlatsDirectory';
import { AdminComplaintsPanel } from '../../components/complaints/AdminComplaintsPanel';

export const AdminDashboard = ({ activeTab, onNavigate }) => {
  const { society } = useAuth();

  if (activeTab === 'residents') {
    return <ResidentsFlatsDirectory />;
  }

  if (activeTab === 'complaints') {
    return <AdminComplaintsPanel />;
  }

  const stats = [
    { title: 'Total Registered Flats', value: '160 / 160', sub: '100% occupied', icon: Building2, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { title: 'Active Complaints', value: '4 Pending', sub: '1 AI priority: High', icon: Wrench, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { title: 'Visitors Today', value: '38 Entries', sub: '6 currently inside', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { title: 'Facility Bookings', value: '5 Reserved', sub: 'Clubhouse & Tennis', icon: CalendarDays, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  ];

  const recentComplaints = [
    { id: 'CMP-104', flat: 'B-402', category: 'Plumbing', title: 'Water leakage from bathroom ceiling', priority: 'High', status: 'Assigned (Apex Plumbing)', time: '20m ago' },
    { id: 'CMP-103', flat: 'A-801', category: 'Electrical', title: 'Power fluctuation in corridor circuit', priority: 'Medium', status: 'In Progress', time: '2h ago' },
    { id: 'CMP-102', flat: 'C-204', category: 'Civil', title: 'Balcony drainage blockage', priority: 'Low', status: 'Under Review', time: 'Yesterday' },
  ];

  const auditEvents = [
    { id: 1, action: 'Vendor Assigned', by: 'Priya Sharma (Admin)', details: 'Sunil Kumar (Apex Plumbing) assigned to CMP-104', time: '18m ago' },
    { id: 2, action: 'Visitor Approved', by: 'Rahul Verma (Flat B-402)', details: 'Passcode #492019 verified at Main Gate', time: '42m ago' },
    { id: 3, action: 'Facility Reserved', by: 'Deepak Joshi (Flat A-502)', details: 'Clubhouse booked for Saturday 6:00 PM', time: '2h ago' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg shadow-teal-950/20 border border-teal-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Society Governance Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-0.5">
            {society?.name || 'Gulmohar Greens Heights'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time management for all {society?.totalFlats || 160} units across {society?.city || 'Pune'}. All data strictly isolated under tenant key <span className="font-mono text-amber-300 font-bold">{society?.code}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition">
            <Plus className="w-4 h-4" />
            New Notice
          </button>
          <button
            onClick={() => onNavigate?.('residents')}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition"
          >
            <Users className="w-4 h-4" />
            Flats & Resident Directory
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{s.title}</span>
                <div className={`p-2 rounded-xl border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 font-display mt-2">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Maintenance Complaints */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Active Maintenance Complaints
              </h2>
              <p className="text-xs text-slate-500">
                Managed via 9-stage lifecycle & AI prioritization
              </p>
            </div>
            <button className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentComplaints.map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-teal-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">{c.id}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                      Flat {c.flat}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      c.priority === 'High' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{c.title}</p>
                  <p className="text-[11px] text-slate-500">Status: <span className="font-semibold text-teal-800">{c.status}</span></p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">{c.time}</span>
                  <button className="mt-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-teal-400 text-slate-700 rounded-lg shadow-2xs">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Society Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable activity records
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {auditEvents.map((a) => (
              <div key={a.id} className="relative pl-5 border-l-2 border-teal-200 pb-2 text-xs">
                <div className="absolute -left-[5px] top-0.5 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{a.action}</span>
                  <span className="text-[10px] text-slate-400">{a.time}</span>
                </div>
                <p className="text-slate-600 mt-0.5">{a.details}</p>
                <p className="text-[10px] text-teal-700 font-medium mt-0.5">By: {a.by}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
