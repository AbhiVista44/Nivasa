import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Package,
  PackageCheck,
  PackageX,
  RefreshCw,
  Clock,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Search,
  X,
  Key,
  Share2,
  Edit2,
  ShieldAlert,
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
function ResidentDeliveriesView({
  deliveries,
  loading,
  onRefresh,
  onPickup,
  onShareCourierOtp,
  confirmingId,
}) {
  const waiting = deliveries.filter(d => d.status === 'Waiting at Gate' || d.status === 'Waiting for Courier OTP');
  const picked = deliveries.filter(d => d.status === 'Picked Up');
  const pendingOtpCount = waiting.filter(d => d.requiresCourierOtp && !d.courierDeliveryOtp).length;

  const [otpInputs, setOtpInputs] = useState({});
  const [editingOtp, setEditingOtp] = useState({});
  const [sharingId, setSharingId] = useState(null);
  const [activeTab, setActiveTab] = useState('waiting');

  const handleShareOtp = async (deliveryId) => {
    const val = (otpInputs[deliveryId] || '').trim();
    if (!val) return;
    setSharingId(deliveryId);
    try {
      await onShareCourierOtp(deliveryId, val);
      setEditingOtp(prev => ({ ...prev, [deliveryId]: false }));
    } finally {
      setSharingId(null);
    }
  };

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
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Gate Parcel Alert</p>
                  {pendingOtpCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full animate-pulse">
                      {pendingOtpCount} Needs Delivery PIN
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold mt-0.5">
                  {waiting.length} {waiting.length === 1 ? 'Package' : 'Packages'} at Gate
                </h2>
                <p className="text-teal-200 text-sm">
                  {pendingOtpCount > 0
                    ? 'Please share your courier PIN with security so delivery can be completed.'
                    : `Collect safely from ${waiting[0]?.arrivalGate || 'Main Gate 1'}.`}
                </p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-medium transition-all self-start sm:self-center"
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
          { key: 'waiting', label: `Active (${waiting.length})`, icon: Package },
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
        <div className="space-y-4">
          {activeTab === 'waiting' && (
            waiting.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
                <PackageCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600">All clear! No packages waiting.</p>
                <p className="text-sm text-slate-400 mt-1">We'll alert you as soon as a delivery parcel arrives at the gate.</p>
              </div>
            ) : (
              waiting.map(d => {
                const colors = CARRIER_COLORS[d.carrier] || CARRIER_COLORS.Other;
                const isEditing = editingOtp[d._id] || (!d.courierDeliveryOtp && d.requiresCourierOtp);

                return (
                  <div
                    key={d._id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    {/* Top Row: Carrier, Package Info & Status Pill */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{d.arrivalGate || 'Main Gate 1'}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(d.arrivedAt)}</span>
                          </div>
                          {d.trackingNumber && (
                            <p className="text-xs text-slate-400 mt-1 font-mono">Track: {d.trackingNumber}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="self-start sm:self-auto">
                        {d.status === 'Waiting for Courier OTP' || (!d.otpSharedWithCourier && d.requiresCourierOtp) ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Key className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                            Courier Awaiting PIN at Gate
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <PackageCheck className="w-3.5 h-3.5 text-teal-600" />
                            Stored at Gate Rack
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Real-world Courier Delivery OTP Section */}
                    {d.requiresCourierOtp && (
                      <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/50 border border-amber-200 rounded-xl p-4">
                        {isEditing ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <Key className="w-4 h-4 text-amber-600" />
                                {d.carrier} Delivery OTP / PIN
                              </label>
                              {d.courierDeliveryOtp && (
                                <button
                                  type="button"
                                  onClick={() => setEditingOtp(prev => ({ ...prev, [d._id]: false }))}
                                  className="text-xs text-slate-500 hover:text-slate-700 underline"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-amber-700">
                              {d.carrier} sent a delivery PIN to your phone SMS or app. Enter it below so Gate Security can share it with the delivery person.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                maxLength={8}
                                placeholder="Enter 4-6 digit OTP"
                                value={otpInputs[d._id] ?? (d.courierDeliveryOtp || '')}
                                onChange={e => setOtpInputs(prev => ({ ...prev, [d._id]: e.target.value }))}
                                className="flex-1 px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-base font-mono font-bold tracking-widest text-slate-800 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleShareOtp(d._id)}
                                disabled={sharingId === d._id || !(otpInputs[d._id] ?? d.courierDeliveryOtp)?.trim()}
                                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                              >
                                {sharingId === d._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                Share PIN with Security
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center flex-shrink-0">
                                <Key className="w-5 h-5 text-amber-700" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-amber-800">Shared {d.carrier} Delivery PIN</p>
                                <p className="text-2xl font-mono font-black text-amber-950 tracking-[0.2em]">
                                  {d.courierDeliveryOtp}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {d.otpSharedWithCourier ? (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  Guard shared PIN with courier
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 border border-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                  Guard is sharing PIN with courier...
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setEditingOtp(prev => ({ ...prev, [d._id]: true }))}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white rounded-lg transition-all"
                                title="Update PIN"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom Action: Physical Collection / Pickup Confirmation */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        {d.notes && <span className="block mb-1 text-slate-600 font-medium">📝 {d.notes}</span>}
                        {d.pickupOtp && (
                          <span>Society Pickup Code: <strong className="font-mono text-slate-700">{d.pickupOtp}</strong></span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onPickup(d._id)}
                        disabled={confirmingId === d._id}
                        className="px-5 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm self-stretch sm:self-auto"
                      >
                        {confirmingId === d._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        Mark as Collected
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {activeTab === 'history' && (
            picked.length === 0 ? (
              <div className="text-center py-16 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
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
                        {d.pickedUpBy && ` by ${d.pickedUpBy}`}
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
function SecurityDeliveriesView({
  deliveries,
  loading,
  onRefresh,
  onLogDelivery,
  onPickup,
  onMarkOtpShared,
  confirmingId,
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    flatNumber: '',
    residentName: '',
    carrier: 'Amazon',
    packageCount: 1,
    trackingNumber: '',
    notes: '',
    arrivalGate: 'Main Gate 1',
    requiresCourierOtp: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [sharingOtpId, setSharingOtpId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');

  const waiting = deliveries.filter(d => d.status === 'Waiting at Gate' || d.status === 'Waiting for Courier OTP');
  const needsOtp = waiting.filter(d => d.requiresCourierOtp && !d.otpSharedWithCourier);

  const filtered = waiting.filter(d => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.flatNumber?.toLowerCase().includes(q) ||
      d.carrier?.toLowerCase().includes(q) ||
      d.deliveryNumber?.toLowerCase().includes(q) ||
      d.residentName?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.flatNumber.trim()) {
      setFeedback('Flat number is required.');
      return;
    }
    setSubmitting(true);
    setFeedback('');
    try {
      await onLogDelivery(form);
      setForm({
        flatNumber: '',
        residentName: '',
        carrier: 'Amazon',
        packageCount: 1,
        trackingNumber: '',
        notes: '',
        arrivalGate: 'Main Gate 1',
        requiresCourierOtp: true,
      });
      setShowForm(false);
      setFeedback('');
    } catch (err) {
      setFeedback(err?.response?.data?.message || 'Failed to log delivery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareWithCourier = async (deliveryId) => {
    setSharingOtpId(deliveryId);
    try {
      await onMarkOtpShared(deliveryId);
    } finally {
      setSharingOtpId(null);
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
        <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-amber-700">{needsOtp.length}</p>
          <p className="text-xs text-amber-700 mt-1 font-medium">Awaiting Courier PIN</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-emerald-600">{deliveries.filter(d => d.status === 'Picked Up').length}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Collected Today</p>
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
          Log Incoming Parcel
        </button>
      </div>

      {/* Log Delivery Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-teal-600" />
              Log Incoming Parcel at Gate
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

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Carrier / Courier Company</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {CARRIERS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const requiresOtp = ['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Blinkit', 'Zepto', 'BlueDart', 'DTDC'].includes(c);
                      setForm(prev => ({ ...prev, carrier: c, requiresCourierOtp: requiresOtp }));
                    }}
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

            {/* Courier OTP Requirement Toggle */}
            <div className="sm:col-span-2 bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Key className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-900">Courier Requires Delivery OTP from Resident</p>
                  <p className="text-xs text-amber-700">Resident will be prompted on their phone to share the Amazon/Flipkart PIN.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={form.requiresCourierOtp}
                onChange={e => setForm(prev => ({ ...prev, requiresCourierOtp: e.target.checked }))}
                className="w-5 h-5 accent-teal-600 rounded cursor-pointer"
              />
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
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Tracking Number (Optional)</label>
              <input
                value={form.trackingNumber}
                onChange={e => setForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                placeholder="e.g. AMZ-IN-88910"
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
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Rack Location / Notes (Optional)</label>
              <input
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Parcel Rack Shelf B-2, Fragile box..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {feedback && (
              <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {feedback}
              </div>
            )}

            <div className="sm:col-span-2 flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {submitting ? 'Logging...' : 'Confirm & Log Parcel at Gate'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFeedback(''); }}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all"
              >
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
          Active Gate Parcels
          {filtered.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-200">
              {filtered.length}
            </span>
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
                <div
                  key={d._id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Left: Parcel Meta */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                      <Package className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                          {d.carrier}
                        </span>
                        <span className="font-bold text-slate-800 text-base">Flat {d.flatNumber}</span>
                        <span className="text-xs text-slate-400 font-mono">{d.deliveryNumber}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {d.residentName || 'Resident'} • {d.packageCount} pkg{d.packageCount > 1 ? 's' : ''} • Arrived {timeAgo(d.arrivedAt)} at {d.arrivalGate || 'Main Gate 1'}
                      </p>
                      {d.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 mt-1.5 inline-block">
                          📍 {d.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Courier PIN and Handover Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-stretch lg:self-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Courier OTP Badge / Action */}
                    {d.requiresCourierOtp && (
                      <div className="w-full sm:w-auto">
                        {d.courierDeliveryOtp ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center gap-3">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Resident's Courier PIN</p>
                              <p className="text-xl font-mono font-black text-amber-950 tracking-widest">{d.courierDeliveryOtp}</p>
                            </div>

                            {!d.otpSharedWithCourier ? (
                              <button
                                type="button"
                                onClick={() => handleShareWithCourier(d._id)}
                                disabled={sharingOtpId === d._id}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                              >
                                {sharingOtpId === d._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
                                Share with Courier
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                PIN Shared
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-50/80 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
                            <span>Waiting for resident to enter PIN</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Handover to Resident Button */}
                    <button
                      type="button"
                      onClick={() => onPickup(d._id, d.pickupOtp)}
                      disabled={confirmingId === d._id}
                      className="w-full sm:w-auto px-4 py-2.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
                    >
                      {confirmingId === d._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Handover to Resident
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
        showToast(res.data.message || 'Parcel marked as collected!');
        fetchDeliveries();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to confirm pickup.';
      showToast(msg, 'error');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleShareCourierOtp = async (id, otp) => {
    try {
      const res = await api.post(`/deliveries/${id}/share-courier-otp`, { otp });
      if (res.data.success) {
        showToast('Courier delivery PIN shared with Gate Security!');
        fetchDeliveries();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to share delivery OTP.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleMarkOtpShared = async (id) => {
    try {
      const res = await api.post(`/deliveries/${id}/otp-shared`);
      if (res.data.success) {
        showToast(res.data.message || 'PIN marked as shared with courier!');
        fetchDeliveries();
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update delivery status.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const handleLogDelivery = async (formData) => {
    const res = await api.post('/deliveries', formData);
    if (res.data.success) {
      showToast(`${res.data.delivery.deliveryNumber} logged at gate successfully!`);
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
              ? 'Log incoming parcels and manage courier delivery PINs at the gate'
              : 'Share courier delivery PINs with security and collect your packages'}
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
          onShareCourierOtp={handleShareCourierOtp}
          confirmingId={confirmingId}
        />
      ) : (
        <SecurityDeliveriesView
          deliveries={deliveries}
          loading={loading}
          onRefresh={fetchDeliveries}
          onLogDelivery={handleLogDelivery}
          onPickup={handlePickup}
          onMarkOtpShared={handleMarkOtpShared}
          confirmingId={confirmingId}
        />
      )}
    </div>
  );
};
