import React, { useState, useEffect } from 'react';
import {
  QrCode,
  UserPlus,
  Search,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Users,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import { PreAuthorizeModal } from './PreAuthorizeModal';
import { VisitorPassCard } from './VisitorPassCard';
import { ResidentApprovalsBanner } from './ResidentApprovalsBanner';

export const ResidentVisitorsPanel = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPreAuthModalOpen, setIsPreAuthModalOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('active'); // 'active' | 'inside' | 'history'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/visitors');
      if (res.data.success) {
        setVisitors(res.data.visitors || []);
      }
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this pre-authorized pass?')) return;
    try {
      const res = await api.post(`/visitors/${id}/revoke`);
      if (res.data.success) {
        fetchVisitors();
        setSelectedPass(null);
      }
    } catch (err) {
      console.error('Revoke pass error:', err);
    }
  };

  const filteredVisitors = visitors.filter(v => {
    if (activeSubTab === 'active') {
      if (!['Pre-Approved', 'Approved'].includes(v.status)) return false;
    } else if (activeSubTab === 'inside') {
      if (v.status !== 'Inside') return false;
    } else if (activeSubTab === 'history') {
      if (!['Exited', 'Revoked', 'Rejected'].includes(v.status)) return false;
    }

    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const matchName = v.name?.toLowerCase().includes(s);
      const matchNum = v.visitorNumber?.toLowerCase().includes(s);
      const matchCode = v.passcode?.includes(s);
      const matchVeh = v.vehicleNumber?.toLowerCase().includes(s);
      if (!matchName && !matchNum && !matchCode && !matchVeh) return false;
    }

    return true;
  });

  const activeCount = visitors.filter(v => ['Pre-Approved', 'Approved'].includes(v.status)).length;
  const insideCount = visitors.filter(v => v.status === 'Inside').length;
  const historyCount = visitors.filter(v => ['Exited', 'Revoked', 'Rejected'].includes(v.status)).length;

  return (
    <div className="space-y-6">
      
      {/* Real-time Walk-in Gate Approvals Alert */}
      <ResidentApprovalsBanner onActionCompleted={fetchVisitors} />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-teal-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-700">
              Milestone 4 • Gate Security
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">
            Visitor Gate Passes
          </h1>
          <p className="text-xs text-teal-100/80 mt-1 max-w-lg">
            Pre-authorize your guests with QR passes and 6-digit access codes for swift, seamless gate clearance.
          </p>
        </div>

        <button
          onClick={() => setIsPreAuthModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-2xl text-xs shadow-lg transition self-start md:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Pre-Authorize Guest
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setActiveSubTab('active')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeSubTab === 'active'
              ? 'bg-teal-50/80 border-teal-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
            Active Pre-Approvals
          </p>
          <p className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {activeCount}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Ready for gate arrival</p>
        </div>

        <div
          onClick={() => setActiveSubTab('inside')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeSubTab === 'inside'
              ? 'bg-blue-50/80 border-blue-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
            Currently Inside
          </p>
          <p className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {insideCount}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Checked in at gate</p>
        </div>

        <div
          onClick={() => setActiveSubTab('history')}
          className={`p-4 rounded-2xl border cursor-pointer transition ${
            activeSubTab === 'history'
              ? 'bg-slate-100 border-slate-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Past Visitors
          </p>
          <p className="text-2xl font-extrabold font-display text-slate-900 mt-1">
            {historyCount}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Completed gate departures</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'active' ? 'bg-teal-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Passes ({activeCount})
          </button>
          <button
            onClick={() => setActiveSubTab('inside')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'inside' ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Inside Society ({insideCount})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'history' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            History ({historyCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by guest, PIN, vehicle…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Visitors List Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading visitor passes…
        </div>
      ) : filteredVisitors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-900">
            No visitor passes found in this section
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeSubTab === 'active'
              ? 'Pre-authorize your guests in advance so security can fast-track their arrival.'
              : 'Past visits and exited guest records will appear here.'}
          </p>
          {activeSubTab === 'active' && (
            <button
              onClick={() => setIsPreAuthModalOpen(true)}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition"
            >
              + Create Pass Now
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVisitors.map((pass) => (
            <div
              key={pass._id || pass.visitorNumber}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {pass.visitorNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    pass.status === 'Inside' ? 'bg-blue-100 text-blue-800' :
                    pass.status === 'Pre-Approved' ? 'bg-teal-100 text-teal-800' :
                    pass.status === 'Exited' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {pass.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 font-display">
                  {pass.name}
                </h4>

                <div className="text-xs text-slate-500 space-y-1 mt-2">
                  <p className="flex items-center gap-1.5 font-mono">
                    <span className="font-bold text-slate-700">Phone:</span> {pass.phone}
                  </p>
                  {pass.vehicleNumber && (
                    <p className="flex items-center gap-1.5 font-mono text-slate-700">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      {pass.vehicleNumber}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(pass.expectedDate || pass.createdAt || Date.now()).toLocaleDateString()}
                    <span className="text-[10px] text-slate-400">({pass.expectedTimeSlot || 'Anytime'})</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">PIN Code</span>
                    <p className="font-mono font-black text-amber-600 text-sm tracking-wider">
                      {pass.passcode}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedPass(pass)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View QR Pass
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Pass View Modal */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative">
            <VisitorPassCard
              pass={selectedPass}
              onRevoke={handleRevoke}
              onClose={() => setSelectedPass(null)}
            />
          </div>
        </div>
      )}

      {/* Pre-Authorize Modal */}
      <PreAuthorizeModal
        isOpen={isPreAuthModalOpen}
        onClose={() => setIsPreAuthModalOpen(false)}
        onPassCreated={() => {
          fetchVisitors();
        }}
      />

    </div>
  );
};
