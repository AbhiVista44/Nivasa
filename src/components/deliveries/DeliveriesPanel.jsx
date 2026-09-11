import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Package,
  PackageCheck,
  PackageX,
  Camera,
  RefreshCw,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ShieldCheck,
  Plus,
  Search,
  X,
} from 'lucide-react';

const CARRIERS = ['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BlueDart', 'DTDC', 'India Post', 'Other'];

const CARRIER_COLORS = {
  Amazon: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-400' },
  Flipkart: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-400' },
  Swiggy: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300', dot: 'bg-orange-500' },
  Zomato: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-400' },
  Blinkit: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-400' },
  Zepto: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-400' },
  BlueDart: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', dot: 'bg-indigo-400' },
  DTDC: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-400' },
  'India Post': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', dot: 'bg-rose-400' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-400' },
};

function timeAgo(date) {
  if (!date) return 'N/A';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ————————————————————————————
// Resident Sub-component
// ————————————————————————————
function ResidentDeliveriesView({ deliveries, loading, onRefresh, onPickup, confirmingId }) {
  const waiting = deliveries.filter(d => d.status === 'Waiting at Gate');
  const picked = deliveries.filter(d => d.status === 'Picked Up');
  const [otpMap, setOtpMap] = useState({});
  const [activeTab, setActiveTab] = useState('waiting');

  return (
    <div className="space-y-5">
      {/* Package Alerts Hero */}
      {waiting.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-6 text-white border border-teal-700 shadow-lg shadow-teal-950/30">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0">
                <Package className="w-7 h-7 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Gate Parcel Alert</p>
                <h2 className="text-xl font-bold mt-0.5">
                  {waiting.length} {waiting.length === 1 ? 'Package' : 'Packages'} at Gate
                </h2>
                <p className="text-teal-200 text-sm">Collect from {waiting[0]?.arrivalGate || 'Main Gate 1'}</p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'waiting', label: `Waiting (${waiting.length})`, icon: Package },
          { key: 'history', label: `Collected (${picked.length})`, icon: PackageCheck },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-teal-700 border-teal-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'waiting' && (
            waiting.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <PackageCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600">All clear! No packages waiting.</p>
                <p className="text-sm text-slate-400 mt-1">We'll alert you when a parcel arrives.</p>
              </div>
            ) : (
              waiting.map(d => {
                const colors = CARRIER_COLORS[d.carrier] || CARRIER_COLORS.Other;
                return (
                  <div key={d._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                          <Package className={`w-6 h-6 ${colors.text}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                              {d.carrier}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">{d.deliveryNumber}</span>
                          </div>
                          <p className="font-semibold text-slate-800 mt-1">
                            {d.packageCount} {d.packageCount === 1 ? 'package' : 'packages'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.arrivalGate || 'Main Gate 1'}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(d.arrivedAt)}</span>
                          </div>
                          {d.trackingNumber && (
                            <p className="text-xs text-slate-400 mt-1 font-mono">Track: {d.trackingNumber}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 min-w-0 sm:min-w-[200px]">
                        <div className="w-full bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                          <p className="text-xs text-teal-600 font-medium">Pickup Verification PIN</p>
                          <p className="text-3xl font-mono font-bold text-teal-800 tracking-[0.2em] mt-1">{d.pickupOtp}</p>
                          <p className="text-xs text-teal-500 mt-1">Show this to gate security</p>
                        </div>
                        <div className="flex gap-2 w-full">
                          <input
                            type="number"
                            maxLength={4}
                            placeholder="Enter 4-digit OTP"
                            value={otpMap[d._id] || ''}
                            onChange={e => setOtpMap(prev => ({ ...prev, [d._id]: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                          />
                          <button
                            onClick={() => onPickup(d._id, otpMap[d._id] || '')}
                            disabled={confirmingId === d._id}
                            className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                          >
                            {confirmingId === d._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                    {d.notes && (
                      <p className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                        📝 {d.notes}
                      </p>
                    )}
                  </div>
                );
              })
            )
          )}

          {activeTab === 'history' && (
            picked.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <PackageX className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold">No collected packages yet.</p>
              </div>
            ) : (
              picked.map(d => {
                const colors = CARRIER_COLORS[d.carrier] || CARRIER_COLORS.Other;
                return (
                  <div key={d._id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <PackageCheck className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 text-sm">{d.carrier}</span>
                        <span className="text-xs text-slate-400 font-mono">{d.deliveryNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.packageCount} pkg{d.packageCount > 1 ? 's' : ''} • Arrived {timeAgo(d.arrivedAt)} • Collected {timeAgo(d.pickedUpAt)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200">
                      ✓ Collected
                    </span>
                  </div>
                );
              })
            )
          )}
        </div>
      )}
    </div>
  );
}

// ————————————————————————————
// Security/Admin Sub-component
// ————————————————————————————
function SecurityDeliveriesView({ deliveries, loading, onRefresh, onLogDelivery, onPickup, confirmingId }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    flatNumber: '',
    residentName: '',
    carrier: 'Amazon',
    packageCount: 1,
    trackingNumber: '',
    notes: '',
    arrivalGate: 'Main Gate 1',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');

  const waiting = deliveries.filter(d => d.status === 'Waiting at Gate');
  const filtered = waiting.filter(d =>
    !search || d.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.carrier.toLowerCase().includes(search.toLowerCase()) ||
    d.deliveryNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.flatNumber.trim()) { setFeedback('Flat number is required.'); return; }
    setSubmitting(true);
    setFeedback('');
    try {
      await onLogDelivery(form);
      setForm({ flatNumber: '', residentName: '', carrier: 'Amazon', packageCount: 1, trackingNumber: '', notes: '', arrivalGate: 'Main Gate 1' });
      setShowForm(false);
      setFeedback('');
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to log delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-teal-700">{waiting.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Waiting at Gate</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{deliveries.filter(d => d.status === 'Picked Up').length}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Picked Up Today</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-700">{deliveries.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Total Logged</p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search flat, carrier, DEL number..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Log Delivery
        </button>
      </div>

      {/* Log Delivery Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Log Incoming Parcel
            </h3>
            <button onClick={() => { setShowForm(false); setFeedback(''); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-1">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Recipient Flat *</label>
              <input
                value={form.flatNumber}
                onChange={e => setForm(prev => ({ ...prev, flatNumber: e.target.value }))}
                placeholder="e.g. B-402"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Resident Name</label>
              <input
                value={form.residentName}
                onChange={e => setForm(prev => ({ ...prev, residentName: e.target.value }))}
                placeholder="e.g. Rahul Verma"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Carrier / Service</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Blinkit', 'BlueDart', 'DTDC', 'Other'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, carrier: c }))}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      form.carrier === c
                        ? 'bg-teal-700 text-white border-teal-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Package Count</label>
              <input
                type="number"
                min={1}
                max={20}
                value={form.packageCount}
                onChange={e => setForm(prev => ({ ...prev, packageCount: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tracking Number</label>
              <input
                value={form.trackingNumber}
                onChange={e => setForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="Optional"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Gate / Arrival Post</label>
              <select
                value={form.arrivalGate}
                onChange={e => setForm(prev => ({ ...prev, arrivalGate: e.target.value }))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {['Main Gate 1', 'Gate 2 (South)', 'Gate 3 (East)', 'Parking Gate'].map(g => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes (optional)</label>
              <input
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Fragile item, Parcel Rack Shelf B-3, Refrigerated item..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {feedback && (
              <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {feedback}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {submitting ? 'Logging...' : 'Log Parcel at Gate'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setFeedback(''); }} className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waiting Parcels Table */}
      <div>
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-500" />
          Waiting at Gate
          {filtered.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">{filtered.length}</span>
          )}
        </h3>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            <PackageCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">{search ? 'No parcels found.' : 'No parcels waiting at gate.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(d => {
              const colors = CARRIER_COLORS[d.carrier] || CARRIER_COLORS.Other;
              return (
                <div key={d._id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                      <Package className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>{d.carrier}</span>
                        <span className="font-bold text-slate-800 text-sm">{d.flatNumber}</span>
                        <span className="text-xs text-slate-400 font-mono">{d.deliveryNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {d.residentName || 'Resident'} • {d.packageCount} pkg{d.packageCount > 1 ? 's' : ''} • {timeAgo(d.arrivedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-teal-50 border border-teal-200 rounded-xl px-4 py-2">
                      <p className="text-xs text-teal-600 font-medium">PIN</p>
                      <p className="text-lg font-mono font-bold text-teal-800 tracking-widest">{d.pickupOtp}</p>
                    </div>
                    <button
                      onClick={() => onPickup(d._id, d.pickupOtp)}
                      disabled={confirmingId === d._id}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {confirmingId === d._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Handover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ————————————————————————————
// Main Export
// ————————————————————————————
export const DeliveriesPanel = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDeliveries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/deliveries');
      if (res.data.success) {
        setDeliveries(res.data.deliveries || []);
      }
    } catch (err) {
      console.error('Failed to load deliveries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const handlePickup = async (id, otp) => {
    setConfirmingId(id);
    try {
      const res = await api.post(`/deliveries/${id}/pickup`, { otp });
      if (res.data.success) {
        showToast(res.data.message || 'Parcel marked as picked up!');
        fetchDeliveries();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to confirm pickup.';
      showToast(msg, 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleLogDelivery = async (formData) => {
    const res = await api.post('/deliveries', formData);
    if (res.data.success) {
      showToast(`${res.data.delivery.deliveryNumber} logged. Pickup PIN: ${res.data.delivery.pickupOtp}`);
      fetchDeliveries();
    }
  };

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-3 transition-all animate-fade-in ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-teal-700'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Delivery Management
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.role === 'security' || user?.role === 'admin'
              ? 'Log incoming parcels and manage parcel handovers at the gate'
              : 'Track and collect your parcels arriving at the society gate'}
          </p>
        </div>
      </div>

      {/* Role-based view */}
      {user?.role === 'resident' ? (
        <ResidentDeliveriesView
          deliveries={deliveries}
          loading={loading}
          onRefresh={fetchDeliveries}
          onPickup={handlePickup}
          confirmingId={confirmingId}
        />
      ) : (
        <SecurityDeliveriesView
          deliveries={deliveries}
          loading={loading}
          onRefresh={fetchDeliveries}
          onLogDelivery={handleLogDelivery}
          onPickup={handlePickup}
          confirmingId={confirmingId}
        />
      )}
    </div>
  );
};
