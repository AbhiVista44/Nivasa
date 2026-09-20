import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Wrench,
  ShieldCheck,
  CalendarDays,
  Plus,
  ArrowUpRight,
  Building2,
  Users,
  Loader2,
  Settings
} from 'lucide-react';
import { ResidentsFlatsDirectory } from '../../components/admin/ResidentsFlatsDirectory';
import { AdminComplaintsPanel } from '../../components/complaints/AdminComplaintsPanel';
import { AdminVisitorsView } from '../../components/admin/AdminVisitorsView';
import { DeliveriesPanel } from '../../components/deliveries/DeliveriesPanel';
import { FacilityBookingHub } from '../../components/facilities/FacilityBookingHub';
import { NoticeBoardHub } from '../../components/notices/NoticeBoardHub';
import { VendorDirectoryHub } from '../../components/vendors/VendorDirectoryHub';
import { AuditLogViewer } from '../../components/audit/AuditLogViewer';

export const AdminDashboard = ({ activeTab, onNavigate }) => {
  const { society } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [complaintsRes, auditRes] = await Promise.allSettled([
        api.get('/complaints?limit=3'),
        api.get('/audit?limit=5'),
      ]);

      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data?.success) {
        setRecentComplaints(complaintsRes.value.data.complaints || []);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value.data?.success) {
        setAuditEvents(auditRes.value.data.events || []);
      }

      // Build stats from society object (populated by auth) + fallback to query
      setStats({
        totalFlats: society?.totalFlats ?? 0,
        activeComplaints: complaintsRes.status === 'fulfilled'
          ? (complaintsRes.value.data?.complaints || []).filter(c => !['Closed', 'Resident Confirmed'].includes(c.status)).length
          : 0,
      });
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'residents') return <ResidentsFlatsDirectory />;
  if (activeTab === 'complaints') return <AdminComplaintsPanel />;
  if (activeTab === 'gate') return <AdminVisitorsView />;
  if (activeTab === 'deliveries') return <DeliveriesPanel />;
  if (activeTab === 'facilities') return <FacilityBookingHub />;
  if (activeTab === 'notices') return <NoticeBoardHub />;
  if (activeTab === 'vendors') return <VendorDirectoryHub />;
  if (activeTab === 'audit') return <AuditLogViewer />;

  const statCards = [
    {
      title: 'Total Registered Flats',
      value: stats ? `${stats.totalFlats}` : '—',
      sub: stats?.totalFlats === 0 ? 'Add flats to get started' : 'Registered units',
      icon: Building2,
      color: 'text-teal-700 bg-teal-50 border-teal-200',
      tab: 'residents',
    },
    {
      title: 'Active Complaints',
      value: stats ? `${stats.activeComplaints} Open` : '—',
      sub: 'Unresolved maintenance requests',
      icon: Wrench,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      tab: 'complaints',
    },
    {
      title: 'Security & Visitors',
      value: 'Gate Live',
      sub: 'View visitor log & gate status',
      icon: ShieldCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      tab: 'gate',
    },
    {
      title: 'Facility Bookings',
      value: 'Manage',
      sub: 'Amenity reservations calendar',
      icon: CalendarDays,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      tab: 'facilities',
    },
  ];

  const isNewSociety = stats?.totalFlats === 0;

  return (
    <div className="space-y-6">

      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg shadow-teal-950/20 border border-teal-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Society Governance Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-0.5">
            {society?.name || 'Your Society'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time management for all {society?.totalFlats || 0} units
            {society?.city ? ` across ${society.city}` : ''}. Tenant key:{' '}
            <span className="font-mono text-amber-300 font-bold">{society?.code}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate?.('notices')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
          >
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

      {/* New Society Onboarding Banner */}
      {!loading && isNewSociety && (
        <div className="bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl border border-amber-200 shrink-0">
              <Settings className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                Welcome! Let's configure your society.
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-lg">
                Start by creating your Wings/Buildings, then add flat units and assign owners.
                Once flats are set up, residents can log in and manage their accounts.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('residents')}
            className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            Set Up Wings & Flats
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate?.(s.tab)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-300 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{s.title}</span>
                <div className={`p-2 rounded-xl border ${s.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 mt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span className="text-xs text-slate-400">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-2xl font-bold text-slate-900 font-display mt-2">{s.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
                </>
              )}
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
            <button
              onClick={() => onNavigate?.('complaints')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading complaints...</span>
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No active complaints</p>
              <p className="text-xs mt-1">Complaints submitted by residents will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentComplaints.map((c) => (
                <div key={c._id} className="p-3.5 rounded-xl border border-slate-100 hover:border-teal-200 bg-slate-50/50 hover:bg-teal-50/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">{c.complaintNumber}</span>
                      {c.flatNumber && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                          Flat {c.flatNumber}
                        </span>
                      )}
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
                    <button
                      onClick={() => onNavigate?.('complaints')}
                      className="mt-1 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:border-teal-400 text-slate-700 rounded-lg shadow-2xs cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            <button
              onClick={() => onNavigate?.('audit')}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : auditEvents.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm font-medium">No audit events yet</p>
              <p className="text-xs mt-1">Society actions will be logged here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditEvents.map((a) => (
                <div key={a._id || a.id} className="relative pl-5 border-l-2 border-teal-200 pb-2 text-xs">
                  <div className="absolute -left-[5px] top-0.5 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{a.action}</span>
                    <span className="text-[10px] text-slate-400">{a.time || new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{a.details || a.description}</p>
                  {a.by && <p className="text-[10px] text-teal-700 font-medium mt-0.5">By: {a.by}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
