import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Car,
  Phone,
  User,
  Clock,
  Loader2
} from 'lucide-react';
import api from '../../services/api';

export const ResidentApprovalsBanner = ({ onActionCompleted }) => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingAction, setLoadingAction] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchPendingApprovals = async () => {
    try {
      const res = await api.get('/visitors/pending');
      if (res.data.success) {
        setPendingRequests(res.data.visitors || []);
      }
    } catch (err) {
      // Quiet fail in background polling
      console.warn('Pending approvals poll error:', err.message);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    // 4-second poll interval for near real-time gate sync
    const interval = setInterval(fetchPendingApprovals, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (visitorId) => {
    setLoadingAction(visitorId);
    try {
      const res = await api.post(`/visitors/${visitorId}/approve`, {
        notes: 'Resident approved gate clearance.',
      });
      if (res.data.success) {
        setActionFeedback({ id: visitorId, status: 'approved', msg: 'Gate Entry Approved!' });
        setPendingRequests(prev => prev.filter(v => v._id !== visitorId && v.visitorNumber !== visitorId));
        onActionCompleted?.();
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setLoadingAction(null);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleReject = async (visitorId) => {
    setLoadingAction(visitorId);
    try {
      const res = await api.post(`/visitors/${visitorId}/reject`, {
        notes: 'Resident denied entry.',
      });
      if (res.data.success) {
        setActionFeedback({ id: visitorId, status: 'rejected', msg: 'Gate Entry Denied' });
        setPendingRequests(prev => prev.filter(v => v._id !== visitorId && v.visitorNumber !== visitorId));
        onActionCompleted?.();
      }
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setLoadingAction(null);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  if (pendingRequests.length === 0 && !actionFeedback) {
    return null;
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {actionFeedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between shadow-md ${
          actionFeedback.status === 'approved'
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-rose-50 border-rose-300 text-rose-900'
        }`}>
          <span>{actionFeedback.msg}</span>
          <span className="text-[10px] font-mono uppercase">Gate Notified</span>
        </div>
      )}

      {pendingRequests.map((req) => (
        <div
          key={req._id || req.visitorNumber}
          className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border-2 border-amber-500/80 rounded-2xl p-5 text-white shadow-xl shadow-amber-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
              <BellRing className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  Gate Approval Required
                </span>
                <span className="text-xs text-amber-200/80 font-mono">
                  {req.entryGate || 'Gate 1'}
                </span>
              </div>

              <h4 className="text-base font-bold text-white font-display">
                {req.name} <span className="text-xs text-slate-300 font-normal">({req.type})</span>
              </h4>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                {req.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {req.phone}
                  </span>
                )}
                {req.vehicleNumber && (
                  <span className="flex items-center gap-1 font-mono">
                    <Car className="w-3 h-3 text-slate-400" />
                    {req.vehicleNumber}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3 h-3" />
                  Arrived just now
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={() => handleReject(req._id || req.visitorNumber)}
              disabled={loadingAction === (req._id || req.visitorNumber)}
              className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <XCircle className="w-4 h-4 text-rose-400" />
              Deny Entry
            </button>

            <button
              onClick={() => handleApprove(req._id || req.visitorNumber)}
              disabled={loadingAction === (req._id || req.visitorNumber)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition"
            >
              {loadingAction === (req._id || req.visitorNumber) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Approve Entry
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
