import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Filter,
  Star,
  MessageSquare,
  Sparkles,
  Calendar,
  User,
} from 'lucide-react';
import api from '../../services/api';

const STAGES = [
  { key: 'Created', short: 'Created' },
  { key: 'Under Review', short: 'Reviewed' },
  { key: 'Assigned', short: 'Assigned' },
  { key: 'Accepted', short: 'Accepted' },
  { key: 'Scheduled', short: 'Scheduled' },
  { key: 'In Progress', short: 'Working' },
  { key: 'Completed', short: 'Done' },
  { key: 'Resident Confirmed', short: 'Confirmed' },
  { key: 'Closed', short: 'Closed' },
];

const PRIORITY_STYLES = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Medium: 'bg-amber-100 text-amber-800 border-amber-300',
  High: 'bg-rose-100 text-rose-800 border-rose-300',
  Emergency: 'bg-red-100 text-red-800 border-red-400 font-extrabold',
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

// Demo complaints data for offline mode
const DEMO_COMPLAINTS = [
  {
    _id: 'demo-1',
    complaintNumber: 'CMP-104',
    title: 'Water leakage from bathroom ceiling',
    description: 'There is a significant water leak from the ceiling above the bathroom, dripping onto the floor. Started 2 days ago.',
    category: 'Plumbing',
    priority: 'High',
    status: 'In Progress',
    preferredVisitTime: 'Morning (9 AM – 12 PM)',
    flatNumber: 'B-402',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    assignedVendor: { vendorName: 'Sunil Kumar', businessName: 'Apex Plumbing' },
    scheduledVisit: { visitDate: new Date().toISOString().split('T')[0], timeSlot: 'Afternoon (12 PM – 4 PM)' },
    aiClassification: { isAiAssisted: true, suggestedCategory: 'Plumbing', suggestedPriority: 'High', confidence: 0.96, source: 'groq-ai', summary: 'Water leakage reported from bathroom ceiling.' },
    timeline: [
      { status: 'Created', note: 'Complaint logged via Nivasa Resident Portal.', actor: 'Rahul Verma', at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { status: 'Under Review', note: 'Complaint reviewed by society admin.', actor: 'Priya Sharma (Admin)', at: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString() },
      { status: 'Assigned', note: 'Sunil Kumar (Apex Plumbing) assigned.', actor: 'Priya Sharma (Admin)', at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { status: 'In Progress', note: 'Vendor has arrived and begun inspection.', actor: 'Sunil Kumar (Vendor)', at: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
    ],
  },
  {
    _id: 'demo-2',
    complaintNumber: 'CMP-97',
    title: 'Bedroom window latch broken',
    description: 'The latch mechanism on the main bedroom window is broken and the window cannot be locked properly.',
    category: 'Carpentry',
    priority: 'Low',
    status: 'Closed',
    preferredVisitTime: 'Weekends only',
    flatNumber: 'B-402',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    assignedVendor: { vendorName: 'Anil Tiwari', businessName: 'Tiwari Carpentry Works' },
    aiClassification: { isAiAssisted: true, suggestedCategory: 'Carpentry', suggestedPriority: 'Low', confidence: 0.88, source: 'smart-heuristic', summary: 'Bedroom window latch is broken and cannot be locked.' },
    rating: 5,
    residentFeedback: 'Great work! Fixed quickly and professionally.',
    timeline: [
      { status: 'Created', note: 'Complaint logged.', actor: 'Rahul Verma', at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
      { status: 'Closed', note: 'Resident confirmed work completion. Rated 5 stars.', actor: 'Rahul Verma', at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle Stepper
// ─────────────────────────────────────────────────────────────────────────────
const ComplaintStepper = ({ status }) => {
  const currentIdx = STAGES.findIndex((s) => s.key === status);
  return (
    <div className="relative flex items-center justify-between w-full overflow-x-auto pb-1">
      {STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <React.Fragment key={stage.key}>
            <div className="flex flex-col items-center gap-1 min-w-[52px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${
                  done
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : active
                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-400/30 scale-110'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {done ? '✓' : idx + 1}
              </div>
              <span
                className={`text-[9px] font-semibold text-center leading-tight ${
                  done ? 'text-teal-700' : active ? 'text-amber-700 font-bold' : 'text-slate-400'
                }`}
              >
                {stage.short}
              </span>
            </div>
            {idx < STAGES.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-0.5 transition-all ${
                  done ? 'bg-teal-500' : 'bg-slate-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Complaint Detail View
// ─────────────────────────────────────────────────────────────────────────────
const ComplaintDetail = ({ complaint, onBack, onConfirm }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await api.post(`/complaints/${complaint._id}/resident-confirm`, { rating, feedback });
      onConfirm?.();
    } catch {
      onConfirm?.(); // demo fallback
    } finally {
      setConfirming(false);
    }
  };

  const ai = complaint.aiClassification;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="mt-0.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono font-bold text-teal-800 text-sm bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {complaint.complaintNumber}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              PRIORITY_STYLES[complaint.priority] || PRIORITY_STYLES.Medium
            }`}>
              {complaint.priority} Priority
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              STATUS_STYLES[complaint.status] || STATUS_STYLES.Created
            }`}>
              {complaint.status}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-display">{complaint.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {complaint.category} • Filed {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Lifecycle Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3">
          9-Stage Workflow Progress
        </p>
        <ComplaintStepper status={complaint.status} />
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Description</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{complaint.description}</p>
        <p className="text-xs text-slate-400 mt-3">
          <Clock className="inline w-3.5 h-3.5 mr-1" />
          Preferred Visit: {complaint.preferredVisitTime}
        </p>
      </div>

      {/* AI Classification Panel */}
      {ai?.isAiAssisted && (
        <div className={`rounded-2xl border p-4 ${
          ai.source === 'groq-ai' ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-700">
              {ai.source === 'groq-ai' ? 'Groq AI Classification' : 'Smart Heuristic Classification'}
            </span>
            <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-2 py-0.5 rounded-full">
              {Math.round((ai.confidence || 0.9) * 100)}% confidence
            </span>
          </div>
          <p className="text-xs italic text-slate-600">"{ai.summary}"</p>
          <div className="flex gap-4 mt-2 text-xs text-slate-600">
            <span>Category: <strong>{ai.suggestedCategory}</strong></span>
            <span>Priority: <strong>{ai.suggestedPriority}</strong></span>
          </div>
        </div>
      )}

      {/* Assigned Vendor & Schedule */}
      {complaint.assignedVendor && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Assigned Vendor</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{complaint.assignedVendor.vendorName}</p>
              <p className="text-xs text-slate-500">{complaint.assignedVendor.businessName}</p>
            </div>
          </div>
          {complaint.scheduledVisit && (
            <div className="mt-3 flex items-center gap-2 text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-2 rounded-lg border border-teal-200">
              <Calendar className="w-3.5 h-3.5" />
              Visit scheduled: {new Date(complaint.scheduledVisit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {complaint.scheduledVisit.timeSlot}
            </div>
          )}
        </div>
      )}

      {/* Resident Confirmation (when Completed) */}
      {complaint.status === 'Completed' && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5">
          <h3 className="text-sm font-bold text-emerald-800 mb-3">Confirm Work Completion</h3>
          <p className="text-xs text-slate-600 mb-3">
            The vendor has marked this complaint as completed. Please confirm if the issue has been resolved.
          </p>
          {/* Star Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="transition hover:scale-110"
              >
                <Star className={`w-6 h-6 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
              </button>
            ))}
            <span className="text-sm font-bold text-slate-600 ml-2">{rating}/5</span>
          </div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Optional: Share your feedback on the service quality…"
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-xl border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none mb-3"
          />
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Confirm & Close Complaint
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          {(complaint.timeline || []).map((event, idx) => (
            <div key={idx} className="relative pl-5 border-l-2 border-teal-200 pb-1">
              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-white" />
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${STATUS_STYLES[event.status] || 'bg-slate-100 text-slate-700'}`}>
                  {event.status}
                </span>
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

      {/* Closed rating display */}
      {complaint.status === 'Closed' && complaint.rating && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Your Review</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-5 h-5 ${s <= complaint.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          {complaint.residentFeedback && (
            <p className="text-sm italic text-slate-600">"{complaint.residentFeedback}"</p>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main ComplaintsPanel (Resident)
// ─────────────────────────────────────────────────────────────────────────────
export const ComplaintsPanel = ({ onRaiseNew }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setComplaints(res.data.complaints);
      } else {
        setComplaints(DEMO_COMPLAINTS);
      }
    } catch {
      setComplaints(DEMO_COMPLAINTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const filtered = filterStatus === 'all'
    ? complaints
    : filterStatus === 'active'
    ? complaints.filter((c) => !['Closed', 'Resident Confirmed'].includes(c.status))
    : complaints.filter((c) => ['Closed', 'Resident Confirmed'].includes(c.status));

  if (selected) {
    return (
      <ComplaintDetail
        complaint={selected}
        onBack={() => {
          setSelected(null);
          loadComplaints();
        }}
        onConfirm={() => {
          loadComplaints();
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">My Complaints</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track all your maintenance requests and their 9-stage progress.
          </p>
        </div>
        <button
          id="raise-complaint-btn"
          onClick={onRaiseNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-sm transition shadow-md shadow-teal-800/20"
        >
          <Plus className="w-4 h-4" />
          Raise New Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'closed', label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
              filterStatus === tab.key
                ? 'bg-teal-700 text-white shadow'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={loadComplaints}
          className="ml-auto p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition"
          title="Refresh"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading complaints…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <Wrench className="w-10 h-10 text-slate-300" />
          <p className="text-slate-500 font-medium">No complaints found.</p>
          <button
            onClick={onRaiseNew}
            className="px-4 py-2 bg-teal-700 text-white font-semibold rounded-xl text-sm"
          >
            Raise Your First Request
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const currentStageIdx = STAGES.findIndex((s) => s.key === c.status);
            const pct = Math.round(((currentStageIdx + 1) / STAGES.length) * 100);

            return (
              <div
                key={c._id}
                onClick={() => setSelected(c)}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-200 cursor-pointer transition group p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs font-bold text-teal-800">{c.complaintNumber}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{c.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[c.priority] || PRIORITY_STYLES.Medium}`}>
                        {c.priority}
                      </span>
                      {c.aiClassification?.isAiAssisted && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          <Sparkles className="w-2.5 h-2.5" /> AI
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status] || STATUS_STYLES.Created}`}>
                      {c.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Stage {Math.min(STAGES.findIndex(s => s.key === c.status) + 1, STAGES.length)}/{STAGES.length}</span>
                    <span>{pct}% complete</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${c.status === 'Closed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-600 to-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Bottom meta */}
                <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {c.assignedVendor && (
                    <span>Assigned: {c.assignedVendor.vendorName}</span>
                  )}
                  {c.rating && (
                    <span className="flex items-center gap-0.5 text-amber-600 font-semibold">
                      <Star className="w-3 h-3 fill-amber-400" /> {c.rating}/5
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
