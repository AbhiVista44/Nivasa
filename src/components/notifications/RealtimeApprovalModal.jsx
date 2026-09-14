import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Car,
  User,
  X
} from 'lucide-react';

export const RealtimeApprovalModal = () => {
  const { activeGateApproval, dismissGateApproval, respondToGateApproval } = useSocket();
  const [submitting, setSubmitting] = useState(false);

  if (!activeGateApproval) return null;

  const handleResponse = async (approve) => {
    setSubmitting(true);
    await respondToGateApproval(activeGateApproval._id, approve);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in zoom-in-95">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-amber-200">
        
        {/* Animated Top Pulse Banner */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-teal-500 to-amber-500 animate-pulse" />

        <div className="p-6 space-y-5">
          
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Live Gate Alert
                </span>
                <h3 className="text-lg font-bold text-slate-900 font-display mt-0.5">
                  Visitor at Security Gate
                </h3>
              </div>
            </div>

            <button
              onClick={dismissGateApproval}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Visitor Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Visitor Name:</span>
              <span className="font-bold text-slate-900 text-sm">{activeGateApproval.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Destination:
              </span>
              <span className="font-bold text-teal-800">Flat {activeGateApproval.flatNumber}</span>
            </div>

            {activeGateApproval.phone && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                </span>
                <span className="font-mono text-slate-700">{activeGateApproval.phone}</span>
              </div>
            )}

            {activeGateApproval.vehicleNumber && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" /> Vehicle:
                </span>
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                  {activeGateApproval.vehicleNumber}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> Gate Post: {activeGateApproval.entryGate || 'Main Gate 1'}
              </span>
              <span>Pass: #{activeGateApproval.passcode || activeGateApproval.visitorNumber}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleResponse(false)}
              disabled={submitting}
              className="py-3 px-4 rounded-2xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Deny Entry
            </button>

            <button
              onClick={() => handleResponse(true)}
              disabled={submitting}
              className="py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-teal-950/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Entry
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
