import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Filter,
  Search,
  ChevronRight,
  ArrowLeft,
  Loader2,
  User,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  X,
} from 'lucide-react';
import api from '../../services/api';

const STAGES = [
  'Created', 'Under Review', 'Assigned', 'Accepted',
  'Scheduled', 'In Progress', 'Completed', 'Resident Confirmed', 'Closed',
];

const PRIORITY_STYLES = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Medium: 'bg-amber-100 text-amber-800 border-amber-300',
  High: 'bg-rose-100 text-rose-800 border-rose-300',
  Emergency: 'bg-red-100 text-red-900 border-red-400',
};

const STATUS_STYLES = {
  Created: 'bg-slate-100 text-slate-700',
  'Under Review': 'bg-blue-100 text-blue-800',
  Assigned: 'bg-indigo-100 text-indigo-800',
  Accepted: 'bg-violet-100 text-violet-800',
  Scheduled: 'bg-amber-100 text-amber-800',
  'In Progress': 'bg-orange-100 text-orange-800',
  Completed: 'bg-teal-100 text-teal-800',
  'Resident Confirmed': 'bg-emerald-100 text-emerald-800',
  Closed: 'bg-slate-200 text-slate-600',
};

// No demo data — production mode only

// ─────────────────────────────────────────────────────────────────────────────
// Admin Complaint Detail
// ─────────────────────────────────────────────────────────────────────────────
const AdminComplaintDetail = ({ complaint, onBack, onUpdated }) => {
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState(complaint.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [assignNote, setAssignNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [visitDate, setVisitDate] = useState('');
  const [visitSlot, setVisitSlot] = useState('Morning (9 AM – 12 PM)');
  const [scheduling, setScheduling] = useState(false);

  const ai = complaint.aiClassification;

  useEffect(() => {
    if (!complaint.assignedVendor) {
      const fetchVendors = async () => {
        setLoadingVendors(true);
        try {
          const res = await api.get('/vendors');
          if (res.data.success) {
            setVendors(res.data.vendors || []);
          }
        } catch (err) {
          console.warn('Failed to load vendors:', err);
        } finally {
          setLoadingVendors(false);
        }
      };
      fetchVendors();
    }
  }, [complaint.assignedVendor]);

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === complaint.status) return;
    setUpdatingStatus(true);
    try {
      await api.put(`/complaints/${complaint._id}/status`, { status: newStatus, note: statusNote });
      onUpdated?.();
      onBack();
    } catch {
      onUpdated?.();
      onBack();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignVendor = async () => {
    if (!selectedVendor) return;
    setAssigning(true);
    try {
      await api.put(`/complaints/${complaint._id}/assign-vendor`, {
        vendorId: selectedVendor._id,
        vendorName: selectedVendor.name || selectedVendor.vendorName,
        businessName: selectedVendor.businessName || '',
        phone: selectedVendor.phone || '',
        serviceCategory: selectedVendor.category || selectedVendor.serviceCategory || '',
        note: assignNote,
      });
      onUpdated?.();
      onBack();
    } catch {
      onUpdated?.();
      onBack();
    } finally {
      setAssigning(false);
    }
  };

  const handleScheduleVisit = async () => {
    if (!visitDate || !visitSlot) return;
    setScheduling(true);
    try {
      await api.put(`/complaints/${complaint._id}/schedule-visit`, { visitDate, timeSlot: visitSlot });
      onUpdated?.();
      onBack();
    } catch {
      onUpdated?.();
      onBack();
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-0.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono font-bold text-teal-800 text-sm bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{complaint.complaintNumber}</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${PRIORITY_STYLES[complaint.priority] || PRIORITY_STYLES.Medium}`}>{complaint.priority}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[complaint.status] || STATUS_STYLES.Created}`}>{complaint.status}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-display">{complaint.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{complaint.category} • Flat {complaint.flatNumber} • {complaint.wing}</p>
        </div>
      </div>

      {/* Resident Info */}
      <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-300" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{complaint.residentName}</p>
          <p className="text-xs text-slate-400">{complaint.flatNumber} • {complaint.wing}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Phone</p>
          <p className="text-xs font-semibold text-teal-300">{complaint.residentPhone}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
        <p className="text-xs text-slate-400 mt-2"><Clock className="inline w-3 h-3 mr-1" />Preferred: {complaint.preferredVisitTime}</p>
      </div>

      {/* AI Panel */}
      {ai?.isAiAssisted && (
        <div className={`rounded-2xl border p-4 ${ai.source === 'groq-ai' ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-700">{ai.source === 'groq-ai' ? 'Groq AI' : 'Smart Heuristic'} Classification</span>
            <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-2 py-0.5 rounded-full">{Math.round((ai.confidence || 0.9) * 100)}%</span>
          </div>
          <p className="text-xs italic text-slate-600 mb-2">"{ai.summary}"</p>
          <div className="flex gap-4 text-xs text-slate-600">
            <span>Suggested: <strong>{ai.suggestedCategory}</strong></span>
            <span>Priority: <strong>{ai.suggestedPriority}</strong></span>
          </div>
        </div>
      )}

      {/* Status Update */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Status</h3>
        <div className="relative">
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full appearance-none px-4 py-3 pr-9 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        <input
          type="text"
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
          placeholder="Optional: Add a status note (visible in timeline)…"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
        />
        <button
          onClick={handleStatusUpdate}
          disabled={updatingStatus || newStatus === complaint.status}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
        >
          {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Update Status
        </button>
      </div>

      {/* Assign Vendor */}
      {!complaint.assignedVendor && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assign Vendor</h3>
          {loadingVendors ? (
            <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading approved vendors…
            </div>
          ) : vendors.length === 0 ? (
            <div className="py-4 px-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No approved vendors in directory. Add vendors from the Vendor Directory tab to assign work orders.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {vendors.map((v) => (
                <button
                  key={v._id}
                  onClick={() => setSelectedVendor(selectedVendor?._id === v._id ? null : v)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition ${
                    selectedVendor?._id === v._id
                      ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-400'
                      : 'bg-white border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-xs">{v.name || v.vendorName}</p>
                    <p className="text-[11px] text-slate-500">{v.businessName || v.name} • {v.category || v.serviceCategory}</p>
                  </div>
                  {selectedVendor?._id === v._id && (
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
          {selectedVendor && (
            <>
              <input
                type="text"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Optional note to vendor…"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
              />
              <button
                onClick={handleAssignVendor}
                disabled={assigning}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl text-sm transition"
              >
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <User className="w-4 h-4" />}
                Assign {selectedVendor.name || selectedVendor.vendorName}
              </button>
            </>
          )}
        </div>
      )}

      {/* Schedule Visit */}
      {complaint.assignedVendor && !complaint.scheduledVisit && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule Visit</h3>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
          />
          <div className="relative">
            <select
              value={visitSlot}
              onChange={(e) => setVisitSlot(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {['Morning (9 AM – 12 PM)', 'Afternoon (12 PM – 4 PM)', 'Evening (4 PM – 7 PM)', 'Weekends only'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleScheduleVisit}
            disabled={scheduling || !visitDate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
          >
            {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Confirm Visit Schedule
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          {(complaint.timeline || []).map((event, idx) => (
            <div key={idx} className="relative pl-5 border-l-2 border-teal-200 pb-1">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${STATUS_STYLES[event.status] || 'bg-slate-100 text-slate-700'}`}>{event.status}</span>
                <span className="text-[10px] text-slate-400">
                  {new Date(event.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-600">{event.note}</p>
              <p className="text-[10px] text-teal-700 font-medium mt-0.5">by {event.actor}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminComplaintsPanel
// ─────────────────────────────────────────────────────────────────────────────
export const AdminComplaintsPanel = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setComplaints(res.data.complaints);
      } else {
        setComplaints([]);
      }
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchPriority = filterPriority === 'all' || c.priority === filterPriority;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.complaintNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.flatNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.residentName?.toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchStatus && matchSearch;
  });

  const counts = {
    total: complaints.length,
    active: complaints.filter((c) => !['Closed', 'Resident Confirmed'].includes(c.status)).length,
    emergency: complaints.filter((c) => c.priority === 'Emergency').length,
    pending: complaints.filter((c) => c.status === 'Created' || c.status === 'Under Review').length,
  };

  if (selected) {
    return <AdminComplaintDetail complaint={selected} onBack={() => setSelected(null)} onUpdated={loadComplaints} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">Maintenance Complaints</h1>
          <p className="text-xs text-slate-500 mt-0.5">9-stage lifecycle • AI-assisted priority classification</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'bg-slate-50 border-slate-200' },
          { label: 'Active', value: counts.active, color: 'bg-blue-50 border-blue-200' },
          { label: 'Needs Review', value: counts.pending, color: 'bg-amber-50 border-amber-200' },
          { label: 'Emergency', value: counts.emergency, color: 'bg-red-50 border-red-200' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 shadow-xs ${stat.color}`}>
            <p className="text-2xl font-bold font-display text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search complaints, flat numbers, residents…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Priorities</option>
            {['Emergency', 'High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Complaint List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading complaints…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2 text-center">
          <Wrench className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">No complaints match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c._id}
              onClick={() => setSelected(c)}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-200 cursor-pointer transition group p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs font-bold text-teal-800">{c.complaintNumber}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Flat {c.flatNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.Medium}`}>
                      {c.priority}
                    </span>
                    {c.priority === 'Emergency' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                    )}
                    {c.aiClassification?.isAiAssisted && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">{c.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.residentName} • {c.category}
                  </p>
                  {c.assignedVendor && (
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                      Vendor: {c.assignedVendor.vendorName} ({c.assignedVendor.businessName})
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status] || STATUS_STYLES.Created}`}>
                    {c.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>

              {/* Action nudge for admin */}
              {c.status === 'Created' && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
                  <Clock className="w-3 h-3" /> Awaiting admin review — click to process
                </div>
              )}
              {c.status === 'Under Review' && !c.assignedVendor && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                  <User className="w-3 h-3" /> Assign a vendor to proceed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
