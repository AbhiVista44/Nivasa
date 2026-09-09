import React, { useState } from 'react';
import api from '../../services/api';
import {
  PhoneCall,
  Search,
  X
} from 'lucide-react';

export const IntercomDirectoryModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [flatResult, setFlatResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callStatus, setCallStatus] = useState(null);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setCallStatus(null);
    try {
      const res = await api.get(`/flats/lookup/${query.trim()}`);
      if (res.data.success) {
        setFlatResult(res.data.flat);
      }
    } catch (err) {
      setFlatResult(null);
      setCallStatus({ type: 'error', text: `Flat ${query} not found in society directory.` });
    } finally {
      setLoading(false);
    }
  };

  const simulateCall = (type) => {
    setCallStatus({
      type: 'calling',
      text: `Dialing ${type}... Ringing Flat ${flatResult.flatNumber}...`,
    });
    setTimeout(() => {
      setCallStatus({
        type: 'connected',
        text: `Connected to ${flatResult.primaryResident?.name || 'Resident'} on ${type}. Gate speaker active.`,
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 font-display">
                Gate Intercom & Resident Lookup
              </h3>
              <p className="text-xs text-slate-500">Fast dial destination flat from security gate</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Enter Flat No. (e.g. B-402, A-102, C-204)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </form>

        {/* Call Feedback Notification */}
        {callStatus && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${
            callStatus.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : callStatus.type === 'calling'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
          }`}>
            {callStatus.text}
          </div>
        )}

        {/* Result Card */}
        {flatResult && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-base font-extrabold text-slate-900">
                  Flat {flatResult.flatNumber}
                </span>
                <p className="text-slate-500 text-[11px]">{flatResult.wing} • Floor {flatResult.floor}</p>
              </div>
              <span className="font-mono font-bold bg-teal-100 text-teal-800 px-2.5 py-1 rounded-lg">
                Ext: {flatResult.intercomNumber}
              </span>
            </div>

            <div className="space-y-1.5 border-t border-slate-200/80 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Primary Resident:</span>
                <span className="font-bold text-slate-900">{flatResult.primaryResident?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mobile Phone:</span>
                <span className="font-mono text-slate-700">{flatResult.primaryResident?.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Allocated Slot:</span>
                <span className="font-mono text-amber-900 font-bold">{flatResult.allocatedParkingSlot}</span>
              </div>
            </div>

            {/* Quick Action Dial Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => simulateCall(`Intercom Ext ${flatResult.intercomNumber}`)}
                className="py-2.5 px-3 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Ring Intercom
              </button>
              <button
                type="button"
                onClick={() => simulateCall(`Mobile Phone ${flatResult.primaryResident?.phone}`)}
                className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call Resident Phone
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
