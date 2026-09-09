import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  User,
  Star,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

const PRIORITY_STYLES = {
  Low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  Medium: 'bg-amber-100 text-amber-800 border-amber-300',
  High: 'bg-rose-100 text-rose-800 border-rose-300',
  Emergency: 'bg-red-100 text-red-900 border-red-400',
};

const TIME_SLOTS = [
  'Morning (9 AM – 12 PM)',
  'Afternoon (12 PM – 4 PM)',
  'Evening (4 PM – 7 PM)',
  'Weekends only',
];

// Demo data for vendor offline mode
const DEMO_VENDOR_JOBS = [
  {
    _id: 'vj-1', complaintNumber: 'CMP-104', flatNumber: 'B-402', wing: 'Wing B',
    residentName: 'Rahul Verma', residentPhone: '+91 98221 44556',
    title: 'Water leakage from bathroom ceiling', category: 'Plumbing', priority: 'High',
    status: 'In Progress', preferredVisitTime: 'Morning (9 AM – 12 PM)',
    description: 'Water is leaking from the ceiling above the bathroom. Started 2 days ago.',
    scheduledVisit: { visitDate: new Date().toISOString().split('T')[0], timeSlot: 'Afternoon (12 PM – 4 PM)' },
    aiClassification: { isAiAssisted: true, suggestedCategory: 'Plumbing', suggestedPriority: 'High', confidence: 0.96, source: 'groq-ai', summary: 'Water leakage from bathroom ceiling.' },
    timeline: [
      { status: 'Assigned', actor: 'Priya Sharma (Admin)', note: 'Assigned to Apex Plumbing.', at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
      { status: 'In Progress', actor: 'Sunil Kumar (Vendor)', note: 'Arrived at flat. Inspection underway.', at: new Date(Date.now() - 1000 * 60 * 25).toISOString() },
    ],
  },
  {
    _id: 'vj-2', complaintNumber: 'CMP-101', flatNumber: 'D-509', wing: 'Wing D',
    residentName: 'Vikram Patil', residentPhone: '+91 96001 88990',
    title: 'Bathroom faucet dripping', category: 'Plumbing', priority: 'Low',
    status: 'Assigned', preferredVisitTime: 'Afternoon (12 PM – 4 PM)',
    description: 'The bathroom faucet has been dripping slowly and needs replacement.',
    aiClassification: { isAiAssisted: true, suggestedCategory: 'Plumbing', suggestedPriority: 'Low', confidence: 0.88, source: 'smart-heuristic', summary: 'Bathroom faucet dripping, requires replacement.' },
    timeline: [
      { status: 'Assigned', actor: 'Priya Sharma (Admin)', note: 'Assigned to Apex Plumbing.', at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() },
    ],
  },
  {
    _id: 'vj-3', complaintNumber: 'CMP-098', flatNumber: 'A-201', wing: 'Wing A',
    residentName: 'Neha Joshi', residentPhone: '+91 97001 22334',
    title: 'Kitchen sink drain clogged', category: 'Plumbing', priority: 'Medium',
    status: 'Completed', preferredVisitTime: 'Evening (4 PM – 7 PM)',
    description: 'Kitchen sink drain is completely blocked.',
    rating: 5, residentFeedback: 'Excellent work, very prompt!',
    timeline: [
      { status: 'Completed', actor: 'Sunil Kumar (Vendor)', note: 'Drain cleared using drain snake.', at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Vendor Job Detail
// ─────────────────────────────────────────────────────────────────────────────
const VendorJobDetail = ({ job, onBack, onUpdated }) => {
  const [visitDate, setVisitDate] = useState('');
  const [visitSlot, setVisitSlot] = useState(TIME_SLOTS[0]);
  const [scheduling, setScheduling] = useState(false);

  const [workNotes, setWorkNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [markingComplete, setMarkingComplete] = useState(false);

  const ai = job.aiClassification;

  const handleSchedule = async () => {
    if (!visitDate) return;
    setScheduling(true);
    try {
      await api.put(`/complaints/${job._id}/schedule-visit`, { visitDate, timeSlot: visitSlot });
      onUpdated?.();
      onBack();
    } catch {
      onUpdated?.();
      onBack();
    } finally {
      setScheduling(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.put(`/complaints/${job._id}/work-notes`, { notes: workNotes });
      onUpdated?.();
      onBack();
    } catch {
      onUpdated?.();
      onBack();
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      await api.put(`/complaints/${job._id}/status`, { status: 'Completed', note: workNotes || 'Work completed by vendor.' });
      onUpdated?.();
      onBack();
    } catch {
      onUpdated?.();
      onBack();
    } finally {
      setMarkingComplete(false);
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
            <span className="font-mono font-bold text-teal-800 text-sm bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{job.complaintNumber}</span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${PRIORITY_STYLES[job.priority] || PRIORITY_STYLES.Medium}`}>{job.priority}</span>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[job.status] || STATUS_STYLES.Created}`}>{job.status}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-display">{job.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{job.category} • Flat {job.flatNumber} • {job.wing}</p>
        </div>
      </div>

      {/* Resident Info */}
      <div className="bg-slate-900 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-300" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{job.residentName}</p>
          <p className="text-xs text-slate-400">Flat {job.flatNumber} • {job.wing}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Contact</p>
          <p className="text-xs font-bold text-teal-300">{job.residentPhone}</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Issue Description</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{job.description}</p>
        <p className="text-xs text-slate-400 mt-2">
          <Clock className="inline w-3 h-3 mr-1" />Preferred: {job.preferredVisitTime}
        </p>
      </div>

      {/* AI Context */}
      {ai?.isAiAssisted && (
        <div className={`rounded-2xl border p-4 ${ai.source === 'groq-ai' ? 'bg-teal-50 border-teal-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-700">AI Classification</span>
          </div>
          <p className="text-xs italic text-slate-600">"{ai.summary}"</p>
        </div>
      )}

      {/* Schedule Visit */}
      {!job.scheduledVisit && (job.status === 'Assigned' || job.status === 'Accepted') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule My Visit</h3>
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
              {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={handleSchedule}
            disabled={scheduling || !visitDate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
          >
            {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Confirm Visit Schedule
          </button>
        </div>
      )}

      {/* Scheduled Visit Display */}
      {job.scheduledVisit && (
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-4 py-3 rounded-2xl">
          <Calendar className="w-4 h-4" />
          Visit: {new Date(job.scheduledVisit.visitDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} • {job.scheduledVisit.timeSlot}
        </div>
      )}

      {/* Work Notes + Mark Complete */}
      {['In Progress', 'Scheduled', 'Accepted', 'Assigned'].includes(job.status) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            <MessageSquare className="inline w-3.5 h-3.5 mr-1" />Work Notes
          </h3>
          <textarea
            value={workNotes}
            onChange={(e) => setWorkNotes(e.target.value)}
            rows={4}
            placeholder="Add detailed work notes: root cause, materials used, actions taken, items replaced, pending follow-ups…"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 resize-none leading-relaxed"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes || !workNotes.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
            >
              {savingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Save Notes
            </button>
            <button
              onClick={handleMarkComplete}
              disabled={markingComplete}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition"
            >
              {markingComplete ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Mark as Completed
            </button>
          </div>
        </div>
      )}

      {/* Completed Rating */}
      {job.status === 'Closed' && job.rating && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resident Rating</h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-5 h-5 ${s <= job.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
            <span className="text-sm font-bold text-slate-600 ml-2">{job.rating}/5</span>
          </div>
          {job.residentFeedback && (
            <p className="text-sm italic text-slate-600">"{job.residentFeedback}"</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          {(job.timeline || []).map((event, idx) => (
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
// Main VendorJobsPanel
// ─────────────────────────────────────────────────────────────────────────────
export const VendorJobsPanel = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('active');

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      if (res.data.success && res.data.complaints.length > 0) {
        setJobs(res.data.complaints);
      } else {
        setJobs(DEMO_VENDOR_JOBS);
      }
    } catch {
      setJobs(DEMO_VENDOR_JOBS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filtered = jobs.filter((j) => {
    if (filterStatus === 'active') return !['Closed', 'Resident Confirmed'].includes(j.status);
    if (filterStatus === 'completed') return ['Completed', 'Resident Confirmed', 'Closed'].includes(j.status);
    return true;
  });

  const openCount = jobs.filter((j) => !['Closed', 'Resident Confirmed'].includes(j.status)).length;

  if (selected) {
    return <VendorJobDetail job={selected} onBack={() => setSelected(null)} onUpdated={loadJobs} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">My Assigned Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.businessName || 'Apex Plumbing'} • {user?.serviceCategory || 'Plumbing'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-2 rounded-xl">
          <Wrench className="w-4 h-4 text-teal-700" />
          <span className="text-sm font-bold text-teal-800">{openCount} Open Jobs</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Assigned', value: jobs.filter(j => ['Assigned', 'Accepted'].includes(j.status)).length, color: 'border-indigo-200 bg-indigo-50' },
          { label: 'In Progress', value: jobs.filter(j => ['Scheduled', 'In Progress'].includes(j.status)).length, color: 'border-amber-200 bg-amber-50' },
          { label: 'Completed', value: jobs.filter(j => ['Completed', 'Closed'].includes(j.status)).length, color: 'border-emerald-200 bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 shadow-xs ${s.color}`}>
            <p className="text-2xl font-bold font-display text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'active', label: 'Active Jobs' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
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
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading jobs…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-300" />
          <p className="text-slate-500 font-medium">No jobs in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <div
              key={job._id}
              onClick={() => setSelected(job)}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-200 cursor-pointer transition group p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="font-mono text-xs font-bold text-teal-800">{job.complaintNumber}</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Flat {job.flatNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[job.priority] || PRIORITY_STYLES.Medium}`}>
                      {job.priority}
                    </span>
                    {job.priority === 'Emergency' && <AlertTriangle className="w-3.5 h-3.5 text-red-600 animate-pulse" />}
                    {job.aiClassification?.isAiAssisted && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">{job.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{job.residentName} • {job.flatNumber}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status] || STATUS_STYLES.Created}`}>
                    {job.status}
                  </span>
                  {job.rating && (
                    <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {job.rating}/5
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition" />
                </div>
              </div>

              {/* Scheduled visit info */}
              {job.scheduledVisit && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-amber-700 font-semibold">
                  <Calendar className="w-3 h-3" />
                  Visit: {new Date(job.scheduledVisit.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {job.scheduledVisit.timeSlot}
                </div>
              )}
              {!job.scheduledVisit && job.status === 'Assigned' && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-indigo-700 font-semibold">
                  <Clock className="w-3 h-3" /> Schedule your visit to proceed
                </div>
              )}
              <p className="text-[10px] text-slate-400 mt-2">
                {new Date(job.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
