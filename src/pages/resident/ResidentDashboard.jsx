import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Wrench,
  QrCode,
  Package,
  CalendarDays,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { MyFlatHub } from '../../components/resident/MyFlatHub';
import { ComplaintsPanel } from '../../components/complaints/ComplaintsPanel';
import { ComplaintSubmitForm } from '../../components/complaints/ComplaintSubmitForm';
import { ResidentVisitorsPanel } from '../../components/visitors/ResidentVisitorsPanel';
import { ResidentApprovalsBanner } from '../../components/visitors/ResidentApprovalsBanner';
import { DeliveriesPanel } from '../../components/deliveries/DeliveriesPanel';
import { FacilityBookingHub } from '../../components/facilities/FacilityBookingHub';
import { NoticeBoardHub } from '../../components/notices/NoticeBoardHub';
import { VendorDirectoryHub } from '../../components/vendors/VendorDirectoryHub';
import { AuditLogViewer } from '../../components/audit/AuditLogViewer';

export const ResidentDashboard = ({ activeTab, onNavigate }) => {
  const { user, society } = useAuth();
  const [complaintView, setComplaintView] = useState('list'); // 'list' | 'form'
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [expectedVisitors, setExpectedVisitors] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (activeTab === 'overview' || !activeTab) {
      fetchOverviewData();
    }
  }, [activeTab]);

  const fetchOverviewData = async () => {
    setLoadingData(true);
    try {
      const [complaintsRes, visitorsRes] = await Promise.allSettled([
        api.get('/complaints?limit=1&status=active'),
        api.get('/visitors?status=expected&limit=3'),
      ]);

      if (complaintsRes.status === 'fulfilled' && complaintsRes.value.data?.success) {
        const active = (complaintsRes.value.data.complaints || []).find(
          c => !['Closed', 'Resident Confirmed'].includes(c.status)
        );
        setActiveComplaint(active || null);
      }

      if (visitorsRes.status === 'fulfilled' && visitorsRes.value.data?.success) {
        setExpectedVisitors(visitorsRes.value.data.visitors || []);
      }
    } catch (err) {
      console.warn('Overview data fetch error:', err.message);
    } finally {
      setLoadingData(false);
    }
  };

  if (activeTab === 'home') return <MyFlatHub />;

  if (activeTab === 'complaints') {
    if (complaintView === 'form') {
      return (
        <ComplaintSubmitForm
          onBack={() => setComplaintView('list')}
          onSuccess={() => setComplaintView('list')}
        />
      );
    }
    return <ComplaintsPanel onRaiseNew={() => setComplaintView('form')} />;
  }

  if (activeTab === 'visitors') return <ResidentVisitorsPanel />;
  if (activeTab === 'deliveries') return <DeliveriesPanel />;
  if (activeTab === 'facilities') return <FacilityBookingHub />;
  if (activeTab === 'notices') return <NoticeBoardHub />;
  if (activeTab === 'vendors') return <VendorDirectoryHub />;
  if (activeTab === 'history') return <AuditLogViewer />;

  const quickActions = [
    {
      title: 'Raise Maintenance Request',
      desc: 'Groq AI suggests category & priority instantly',
      icon: Wrench,
      aiBadge: 'Groq AI Assisted',
      badgeColor: 'bg-teal-100 text-teal-800',
      action: () => onNavigate?.('complaints'),
      accent: 'border-teal-200 hover:border-teal-400 bg-teal-50/20',
    },
    {
      title: 'Pre-Authorize Visitor',
      desc: 'Generate instant QR pass & 6-digit gate code',
      icon: QrCode,
      aiBadge: 'Gate Fast-Track',
      badgeColor: 'bg-amber-100 text-amber-800',
      action: () => onNavigate?.('visitors'),
      accent: 'border-amber-200 hover:border-amber-400 bg-amber-50/20',
    },
    {
      title: 'Book Society Amenities',
      desc: 'Clubhouse, Gym, Swimming Pool & Courts',
      icon: CalendarDays,
      aiBadge: 'Zero Conflict Engine',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      action: () => onNavigate?.('facilities'),
      accent: 'border-indigo-200 hover:border-indigo-400 bg-indigo-50/20',
    },
    {
      title: 'Delivery Pickup Desk',
      desc: 'Check and collect your pending deliveries',
      icon: Package,
      aiBadge: 'Gate Log',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      action: () => onNavigate?.('deliveries'),
      accent: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/20',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Real-Time Gate Approvals Alert */}
      <ResidentApprovalsBanner />

      {/* Resident Flat Card Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-teal-950/20 border border-teal-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-700">
              Verified Resident Profile
            </span>
            <span className="text-xs text-teal-200">
              {society?.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
            Welcome home, {user?.name?.split(' ')[0] || 'Resident'}
          </h1>
          <p className="text-xs text-teal-100/80">
            Residence:{' '}
            <strong className="text-amber-300 font-mono text-sm">
              {user?.flatNumber || '—'}
            </strong>
            {user?.wing ? ` • ${user.wing}` : ''} • Status:{' '}
            <strong className="text-emerald-300 font-medium">
              {user?.isOwner ? 'Active Resident (Owner)' : 'Active Resident'}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/60 p-3 rounded-xl border border-teal-700/60 shrink-0">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 font-medium">Gate Pass Status</p>
            <p className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Auto-Approval Active
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <div
              key={idx}
              onClick={action.action}
              className={`p-5 rounded-2xl border bg-white shadow-xs hover:shadow-md cursor-pointer transition group flex flex-col justify-between ${action.accent}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-teal-800 shadow-2xs group-hover:scale-105 transition">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${action.badgeColor}`}>
                    {action.aiBadge}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-teal-800 transition">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                <span>Access</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Activity & Complaint Status Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Active Complaint 9-Step Lifecycle Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Active Maintenance Workflow
              </span>
              <h2 className="text-base font-bold text-slate-900 font-display">
                {activeComplaint ? activeComplaint.complaintNumber + ': ' + activeComplaint.title : 'No Active Request'}
              </h2>
            </div>
            {activeComplaint && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800">
                Stage: {activeComplaint.status}
              </span>
            )}
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : activeComplaint ? (
            <>
              <div className="py-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2 flex-wrap gap-1">
                  {['Created','Under Review','Assigned','Scheduled','In Progress','Completed','Closed'].map((stage, i) => {
                    const stages = ['Created','Under Review','Assigned','Scheduled','In Progress','Completed','Resident Confirmed','Closed'];
                    const currentIdx = stages.indexOf(activeComplaint.status);
                    const thisIdx = stages.indexOf(stage);
                    const done = thisIdx < currentIdx;
                    const active = thisIdx === currentIdx;
                    return (
                      <span key={stage} className={
                        active ? 'text-amber-700 font-extrabold ring-2 ring-amber-400 bg-amber-50 px-1.5 py-0.5 rounded' :
                        done ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }>
                        {i + 1}. {stage}
                      </span>
                    );
                  })}
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-amber-500 h-full" style={{
                    width: `${Math.min(100, (['Created','Under Review','Assigned','Scheduled','In Progress','Completed','Resident Confirmed','Closed'].indexOf(activeComplaint.status) + 1) / 8 * 100)}%`
                  }} />
                </div>
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  {activeComplaint.assignedVendor && (
                    <p className="font-semibold text-slate-800">
                      Assigned Vendor: {activeComplaint.assignedVendor.vendorName}
                      {activeComplaint.assignedVendor.businessName ? ` (${activeComplaint.assignedVendor.businessName})` : ''}
                    </p>
                  )}
                  <p className="text-slate-500 text-[11px]">
                    {activeComplaint.scheduledVisit?.visitDate
                      ? `Visit: ${activeComplaint.scheduledVisit.visitDate} • ${activeComplaint.scheduledVisit.timeSlot}`
                      : 'No visit scheduled yet'}
                  </p>
                </div>
                <button
                  onClick={() => onNavigate?.('complaints')}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg text-xs transition cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No active maintenance requests</p>
              <p className="text-xs mt-1">Use the quick action above to raise a new complaint.</p>
            </div>
          )}
        </div>

        {/* Expected Visitors & Gate Passes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 font-display">
              Expected Visitors
            </h2>
            <button
              onClick={() => onNavigate?.('visitors')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              + New Pass
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : expectedVisitors.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <QrCode className="w-7 h-7 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No expected visitors</p>
              <p className="text-xs mt-1">Pre-authorize visitors to generate gate passes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expectedVisitors.map((v) => (
                <div key={v._id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{v.name || v.visitorName}</span>
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                      #{v.passcode || v.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {v.expectedTime ? `Expected: ${new Date(v.expectedTime).toLocaleString()}` : 'Anytime'} • {v.purpose || 'Guest Entry'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-teal-800 font-semibold">
                    <QrCode className="w-3.5 h-3.5" /> QR Passcode Active
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
