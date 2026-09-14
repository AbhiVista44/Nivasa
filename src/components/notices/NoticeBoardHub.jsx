import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Megaphone,
  AlertTriangle,
  Globe,
  Users,
  Clock,
  Plus,
  Trash2,
  Edit3,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react';

// ——————————————————————————
// Helpers
// ——————————————————————————
function timeAgo(date) {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatScheduled(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TYPE_CONFIG = {
  urgent: {
    label: 'Urgent',
    icon: AlertTriangle,
    banner: 'bg-red-600',
    bg: 'bg-red-50 border-red-300',
    badge: 'bg-red-100 text-red-800 border-red-300',
    dot: 'bg-red-500',
    header: 'text-red-800',
  },
  'society-wide': {
    label: 'Society-Wide',
    icon: Globe,
    banner: 'bg-teal-700',
    bg: 'bg-teal-50/40 border-teal-200',
    badge: 'bg-teal-100 text-teal-800 border-teal-200',
    dot: 'bg-teal-500',
    header: 'text-teal-900',
  },
  'wing-specific': {
    label: 'Wing-Specific',
    icon: Users,
    banner: 'bg-indigo-700',
    bg: 'bg-indigo-50/40 border-indigo-200',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    header: 'text-indigo-900',
  },
  scheduled: {
    label: 'Scheduled',
    icon: CalendarDays,
    banner: 'bg-amber-600',
    bg: 'bg-amber-50/40 border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    dot: 'bg-amber-400',
    header: 'text-amber-900',
  },
};

// ——————————————————————————
// Notice Card
// ——————————————————————————
function NoticeCard({ notice, onRead, onEdit, onDelete, isAdmin }) {
  const [expanded, setExpanded] = useState(notice.type === 'urgent');
  const cfg = TYPE_CONFIG[notice.type] || TYPE_CONFIG['society-wide'];
  const Icon = cfg.icon;

  const handleExpand = () => {
    if (!expanded && !notice.hasRead && !isAdmin) {
      onRead?.(notice._id);
    }
    setExpanded(e => !e);
  };

  return (
    <div className={`rounded-2xl border ${cfg.bg} overflow-hidden shadow-sm hover:shadow-md transition-all`}>
      {/* Urgent pulsing top bar */}
      {notice.type === 'urgent' && (
        <div className="h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-600 animate-pulse" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Unread dot */}
          {!isAdmin && !notice.hasRead && notice.isPublished && (
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} shadow-sm`} />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                <Icon className="w-3 h-3" />
                {cfg.label}
                {notice.type === 'urgent' && <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              </span>
              {notice.targetWing && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                  {notice.targetWing} Only
                </span>
              )}
              {!notice.isPublished && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Scheduled
                </span>
              )}
            </div>

            <button onClick={handleExpand} className="text-left w-full">
              <h3 className={`font-bold text-sm ${cfg.header} leading-snug`}>{notice.title}</h3>
            </button>

            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
              <span>{notice.authorName}</span>
              <span>•</span>
              <span>{timeAgo(notice.publishedAt || notice.createdAt)}</span>
              {notice.readBy?.length > 0 && (
                <span className="flex items-center gap-1 text-teal-600">
                  <Eye className="w-3 h-3" /> {notice.readBy.length} read
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit?.(notice)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete?.(notice)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button onClick={handleExpand} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Body */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{notice.body}</p>
            {notice.scheduledAt && !notice.isPublished && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
                <CalendarDays className="w-4 h-4 flex-shrink-0" />
                Scheduled to publish on: <strong>{formatScheduled(notice.scheduledAt)}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ——————————————————————————
// Create/Edit Modal
// ——————————————————————————
function NoticeFormModal({ notice, onClose, onSave }) {
  const [title, setTitle] = useState(notice?.title || '');
  const [body, setBody] = useState(notice?.body || '');
  const [type, setType] = useState(notice?.type || 'society-wide');
  const [targetWing, setTargetWing] = useState(notice?.targetWing || '');
  const [scheduledAt, setScheduledAt] = useState(
    notice?.scheduledAt ? new Date(notice.scheduledAt).toISOString().slice(0, 16) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) { setError('Title and body are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        type,
        targetWing: type === 'wing-specific' ? targetWing : null,
        scheduledAt: type === 'scheduled' && scheduledAt ? scheduledAt : null,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save notice.');
    } finally {
      setSubmitting(false);
    }
  };

  const isEdit = Boolean(notice?._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 p-5 rounded-t-3xl text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Notice Board</p>
            <h3 className="font-bold text-base mt-0.5">{isEdit ? 'Edit Notice' : 'Compose New Notice'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Notice Type</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      type === key
                        ? `${cfg.badge} border-current shadow-sm scale-[1.02]`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wing selector */}
          {type === 'wing-specific' && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Target Wing</label>
              <select
                value={targetWing}
                onChange={e => setTargetWing(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select Wing...</option>
                <option value="Wing A">Wing A (Emerald)</option>
                <option value="Wing B">Wing B (Sapphire)</option>
                <option value="Wing C">Wing C (Ruby)</option>
              </select>
            </div>
          )}

          {/* Schedule date */}
          {type === 'scheduled' && (
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Publish At</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Water Supply Interruption Tonight"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Message Body *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              placeholder="Write the full notice text here..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none leading-relaxed"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-medium rounded-2xl hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-teal-700 to-teal-800 text-white text-sm font-bold rounded-2xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Publish Notice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————
// MAIN EXPORT
// ——————————————————————————
export const NoticeBoardHub = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.type = activeTab;
      const res = await api.get('/notices', { params });
      if (res.data.success) setNotices(res.data.notices || []);
    } catch (e) {
      console.error('Failed to load notices:', e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  const handleRead = async (id) => {
    try {
      await api.patch(`/notices/${id}/read`);
      setNotices(prev => prev.map(n => n._id === id ? { ...n, hasRead: true } : n));
    } catch (e) { /* silent */ }
  };

  const handleSave = async (data) => {
    if (editingNotice?._id) {
      await api.put(`/notices/${editingNotice._id}`, data);
      showToast('Notice updated successfully.');
    } else {
      await api.post('/notices', data);
      showToast(`Notice published: "${data.title}"`);
    }
    fetchNotices();
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(`Delete notice "${notice.title}"?`)) return;
    try {
      await api.delete(`/notices/${notice._id}`);
      showToast('Notice deleted.', 'info');
      fetchNotices();
    } catch (e) {
      showToast('Failed to delete.', 'error');
    }
  };

  const unreadCount = notices.filter(n => !n.hasRead && n.isPublished && n.type !== 'scheduled').length;
  const urgentCount = notices.filter(n => n.type === 'urgent' && n.isPublished).length;

  const tabs = [
    { key: 'all', label: 'All Notices', count: notices.filter(n => isAdmin ? true : n.isPublished).length },
    { key: 'urgent', label: 'Urgent', count: urgentCount },
    { key: 'society-wide', label: 'Society-Wide', count: notices.filter(n => n.type === 'society-wide').length },
    { key: 'wing-specific', label: 'Wing-Specific', count: notices.filter(n => n.type === 'wing-specific').length },
    ...(isAdmin ? [{ key: 'scheduled', label: 'Scheduled', count: notices.filter(n => n.type === 'scheduled').length }] : []),
  ];

  const displayNotices = notices.filter(n => {
    if (!isAdmin && !n.isPublished) return false;
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-slate-700' : 'bg-teal-700'
        }`}>
          <Bell className="w-5 h-5" /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white border border-teal-700 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">Community Communications</p>
            <h2 className="text-xl font-bold">Society Notice Board</h2>
            <p className="text-teal-200 text-sm mt-1">
              {isAdmin
                ? 'Manage society-wide, wing-specific, urgent and scheduled announcements'
                : `${unreadCount > 0 ? `${unreadCount} unread notice${unreadCount > 1 ? 's' : ''}` : 'You\'re all caught up!'}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchNotices} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => { setEditingNotice(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm shadow-md transition"
              >
                <Plus className="w-4 h-4" /> New Notice
              </button>
            )}
          </div>
        </div>

        {/* Urgent Alert Banner */}
        {urgentCount > 0 && (
          <div className="mt-4 flex items-center gap-3 bg-red-600/30 border border-red-400/40 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 text-red-300 animate-pulse flex-shrink-0" />
            <span className="text-sm font-semibold text-red-100">
              {urgentCount} urgent notice{urgentCount > 1 ? 's' : ''} requiring your attention
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.key
                ? 'text-teal-700 border-teal-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : displayNotices.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">No notices in this category.</p>
          {isAdmin && (
            <button
              onClick={() => { setEditingNotice(null); setShowForm(true); }}
              className="mt-4 px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl hover:bg-teal-800 transition"
            >
              Post a Notice
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotices.map(notice => (
            <NoticeCard
              key={notice._id}
              notice={notice}
              onRead={handleRead}
              onEdit={(n) => { setEditingNotice(n); setShowForm(true); }}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <NoticeFormModal
          notice={editingNotice}
          onClose={() => { setShowForm(false); setEditingNotice(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};
