import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import {
  History,
  AlertTriangle,
  Info,
  ShieldAlert,
  Search,
  RefreshCw,
  Loader2,
  Lock,
  Filter,
  ChevronDown,
  User,
  Clock,
  Tag,
} from 'lucide-react';

// ——————————————————————————
// Severity Config
// ——————————————————————————
const SEVERITY = {
  info:     { label: 'Info',     dot: 'bg-teal-500',  badge: 'bg-teal-50 text-teal-800 border-teal-200',    icon: Info,       line: 'border-teal-300' },
  warning:  { label: 'Warning',  dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200',  icon: AlertTriangle, line: 'border-amber-300' },
  critical: { label: 'Critical', dot: 'bg-red-600',   badge: 'bg-red-50 text-red-800 border-red-200',       icon: ShieldAlert, line: 'border-red-400' },
};

const ACTION_LABELS = {
  NOTICE_CREATED:   'Notice Published',
  NOTICE_UPDATED:   'Notice Updated',
  NOTICE_DELETED:   'Notice Deleted',
  VENDOR_ADDED:     'Vendor Added',
  VENDOR_UPDATED:   'Vendor Updated',
  VENDOR_ACTIVATED: 'Vendor Activated',
  VENDOR_DEACTIVATED:'Vendor Deactivated',
  COMPLAINT_CREATED:'Complaint Raised',
  COMPLAINT_STATUS_CHANGED: 'Complaint Status Changed',
  VENDOR_ASSIGNED:  'Vendor Assigned',
  VISITOR_APPROVED: 'Visitor Approved',
  VISITOR_REJECTED: 'Visitor Rejected',
  VISITOR_ENTERED:  'Visitor Entry Recorded',
  VISITOR_EXITED:   'Visitor Exit Recorded',
  DELIVERY_LOGGED:  'Delivery Logged',
  DELIVERY_PICKED_UP:'Delivery Picked Up',
  FACILITY_BOOKED:  'Facility Reserved',
  FACILITY_CANCELLED:'Facility Booking Cancelled',
};

// ——————————————————————————
// Helpers
// ——————————————————————————
function timeAgo(date) {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fullDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

// ——————————————————————————
// Log Entry Row
// ——————————————————————————
function LogEntry({ log, isLast }) {
  const sev = SEVERITY[log.severity] || SEVERITY.info;
  const SevIcon = sev.icon;
  const label = ACTION_LABELS[log.action] || log.action?.replace(/_/g, ' ') || 'Action';

  return (
    <div className={`relative flex gap-4 ${isLast ? '' : 'pb-4'}`}>
      {/* Timeline connector */}
      {!isLast && (
        <div className={`absolute left-[15px] top-7 bottom-0 w-0.5 border-l-2 border-dashed ${sev.line} opacity-40`} />
      )}

      {/* Severity dot */}
      <div className="relative flex-shrink-0 mt-1">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
          log.severity === 'critical' ? 'bg-red-100' : log.severity === 'warning' ? 'bg-amber-100' : 'bg-teal-100'
        }`}>
          <SevIcon className={`w-4 h-4 ${
            log.severity === 'critical' ? 'text-red-600' : log.severity === 'warning' ? 'text-amber-600' : 'text-teal-600'
          }`} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-white rounded-xl border border-slate-100 p-3.5 hover:border-slate-200 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-sm">{label}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${sev.badge}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
              {sev.label}
            </span>
            {/* Immutable lock badge */}
            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              <Lock className="w-2.5 h-2.5" /> Immutable
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span title={fullDateTime(log.timestamp)}>{timeAgo(log.timestamp)}</span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            <span className="font-semibold text-slate-700">{log.actorName}</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-full capitalize">{log.actorRole}</span>
          </span>
          {log.targetType && (
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              {log.targetType}
              {log.targetId && <span className="font-mono text-[10px] text-slate-400">#{log.targetId.slice(-6)}</span>}
            </span>
          )}
        </div>

        {/* Details */}
        {log.details && Object.keys(log.details).length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
            {Object.entries(log.details).map(([k, v]) => (
              <span key={k} className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 capitalize">{k}:</span> <strong>{String(v)}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ——————————————————————————
// MAIN EXPORT
// ——————————————————————————
export const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [limit, setLimit] = useState(50);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit };
      if (severity !== 'all') params.severity = severity;
      if (search) params.search = search;
      const res = await api.get('/audit', { params });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  }, [severity, search, limit]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const counts = {
    all: logs.length,
    info: logs.filter(l => l.severity === 'info').length,
    warning: logs.filter(l => l.severity === 'warning').length,
    critical: logs.filter(l => l.severity === 'critical').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white border border-slate-700 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">Governance & Compliance</p>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Society Audit Trail
              <span className="flex items-center gap-1 text-[10px] font-bold bg-white/10 px-2 py-1 rounded-full border border-white/20">
                <Lock className="w-3 h-3 text-amber-300" /> Immutable Records
              </span>
            </h2>
            <p className="text-slate-300 text-sm mt-1">Chronological, tamper-proof log of all critical administrative actions</p>
          </div>
          <button onClick={fetchLogs} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { key: 'critical', label: 'Critical', color: 'text-red-300' },
            { key: 'warning', label: 'Warnings', color: 'text-amber-300' },
            { key: 'info', label: 'Info Events', color: 'text-teal-300' },
          ].map(s => (
            <div key={s.key} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{counts[s.key]}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by actor, action..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Severity filter */}
        <div className="flex gap-2">
          {['all', 'critical', 'warning', 'info'].map(sev => {
            const cfg = sev === 'all' ? null : SEVERITY[sev];
            return (
              <button
                key={sev}
                onClick={() => setSeverity(sev)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  severity === sev
                    ? sev === 'all'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : `${cfg.badge} border-current shadow-sm`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {sev === 'all' ? 'All' : SEVERITY[sev].label}
                <span className="ml-1 opacity-70">({counts[sev]})</span>
              </button>
            );
          })}
        </div>

        {/* Limit */}
        <select
          value={limit}
          onChange={e => setLimit(Number(e.target.value))}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value={25}>Last 25</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
        </select>
      </div>

      {/* Log Timeline */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">No audit entries found.</p>
          <p className="text-sm text-slate-400 mt-1">Actions performed on this society will appear here.</p>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {logs.length} Event{logs.length > 1 ? 's' : ''} • Society-Scoped • Immutable
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-only audit trail</span>
            </div>
          </div>

          <div className="space-y-0">
            {logs.map((log, i) => (
              <LogEntry key={log._id || i} log={log} isLast={i === logs.length - 1} />
            ))}
          </div>

          {logs.length >= limit && (
            <button
              onClick={() => setLimit(l => l + 50)}
              className="mt-4 w-full py-2.5 text-sm font-semibold text-teal-700 border border-teal-200 rounded-xl hover:bg-teal-50 transition flex items-center justify-center gap-2"
            >
              <ChevronDown className="w-4 h-4" /> Load More Events
            </button>
          )}
        </div>
      )}
    </div>
  );
};
