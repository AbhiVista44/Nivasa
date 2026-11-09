import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Building2,
  Dumbbell,
  Waves,
  Trophy,
  Sparkles,
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Info,
  ListFilter,
  Shield,
  Sliders,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

// ——————————————————————————
// Static facility config & icons
// ——————————————————————————
const FACILITY_ICONS = {
  Building2,
  Dumbbell,
  Waves,
  Trophy,
  Sparkles,
};

const FACILITY_THEMES = {
  clubhouse: { gradient: 'from-amber-600 to-orange-700', light: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700' },
  gym: { gradient: 'from-teal-600 to-emerald-700', light: 'bg-teal-50 border-teal-200', badge: 'bg-teal-100 text-teal-700', text: 'text-teal-700' },
  pool: { gradient: 'from-blue-500 to-cyan-600', light: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700' },
  tennis: { gradient: 'from-lime-600 to-green-700', light: 'bg-lime-50 border-lime-200', badge: 'bg-lime-100 text-lime-700', text: 'text-lime-700' },
  'party-hall': { gradient: 'from-purple-600 to-violet-700', light: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700', text: 'text-purple-700' },
};

function parseOpeningHours(hours) {
  if (!hours) return { start: '06:00', end: '22:00' };
  const parts = hours.split(' - ');
  return { start: parts[0] || '06:00', end: parts[1] || '22:00' };
}

function generateSlotsFromHours(hours, durationMinutes = 60) {
  const { start, end } = parseOpeningHours(hours);
  const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toStr = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const startM = toMins(start);
  const endM = toMins(end);
  const slots = [];
  for (let m = startM; m + durationMinutes <= endM; m += 30) {
    slots.push({ start: toStr(m), end: toStr(m + durationMinutes) });
  }
  return slots;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${display}:${String(m).padStart(2, '0')} ${suffix}`;
}

function dateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getNextNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

// ——————————————————————————
// Edit Capacity Modal (Admin Only)
// ——————————————————————————
function EditCapacityModal({ facility, onClose, onSave }) {
  const [capacity, setCapacity] = useState(facility.capacity || 50);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const presets = [20, 50, 100, 150, 200, 300, 500];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = parseInt(capacity, 10);
    if (!val || val < 1) {
      setError('Capacity must be at least 1 guest.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSave(facility.id, val);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update capacity.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sliders className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-teal-200 tracking-wider">Admin Facility Controls</p>
                <h3 className="font-bold text-base">Set Facility Capacity</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-teal-100/90 mt-2">
            Configure max guest limit for <strong>{facility.name}</strong>. Residents cannot request bookings exceeding this limit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Maximum Guest Capacity
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={10000}
                value={capacity}
                onChange={e => {
                  setCapacity(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 font-bold text-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="e.g. 100"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">GUESTS</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-2">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {presets.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setCapacity(p)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    Number(capacity) === p
                      ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Updated capacity applies immediately. Resident reservations for more than <strong>{capacity || '0'} guests</strong> will be blocked on frontend and rejected by the server.
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Save Capacity'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ——————————————————————————
// Reject Booking Request Modal (Admin Only)
// ——————————————————————————
function RejectBookingModal({ booking, onClose, onConfirm, submitting }) {
  const [reason, setReason] = useState('');
  const [selectedQuickReason, setSelectedQuickReason] = useState('');

  const quickReasons = [
    'Facility maintenance scheduled during requested slot',
    'Exceeds permissible society quiet hours',
    'Conflict with general body society meeting',
    'Safety & cleaning protocol requirements',
    'Insufficient documentation / purpose details',
  ];

  const handleSelectQuick = (r) => {
    setSelectedQuickReason(r);
    setReason(r);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(booking._id, reason || selectedQuickReason || 'Facility unavailable at requested time.');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-rose-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-rose-200 tracking-wider">Admin Decision</p>
                <h3 className="font-bold text-base">Reject Booking Request</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-rose-100 mt-2">
            Booking: <strong>{booking?.bookingNumber}</strong> • {booking?.facilityName} for {booking?.residentName} (Flat {booking?.flatNumber}).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Reason for Rejection
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                setSelectedQuickReason('');
              }}
              placeholder="Explain why this request is being rejected (shared with resident)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Quick Reasons</label>
            <div className="space-y-1.5">
              {quickReasons.map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleSelectQuick(r)}
                  className={`w-full text-left text-xs p-2 rounded-lg border transition-all ${
                    selectedQuickReason === r
                      ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  • {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ——————————————————————————
// Facility Card
// ——————————————————————————
function FacilityCard({ facility, onBook, isAdmin, onEditCapacity }) {
  const theme = FACILITY_THEMES[facility.id] || FACILITY_THEMES.gym;
  const Icon = FACILITY_ICONS[facility.icon] || Building2;

  return (
    <div
      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
      onClick={() => onBook(facility)}
    >
      {/* Image / Gradient Banner */}
      <div className={`h-36 bg-gradient-to-br ${theme.gradient} relative overflow-hidden flex-shrink-0`}>
        <img
          src={facility.imageUrl}
          alt={facility.name}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Admin Capacity Pill */}
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditCapacity(facility);
            }}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/30 shadow-md transition-all hover:scale-105"
            title="Edit facility capacity"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-300" />
            <span>Set Capacity</span>
          </button>
        )}

        <div className="absolute bottom-3 left-4 right-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">{facility.category}</span>
          <p className="text-white font-bold text-base mt-0.5 leading-tight">{facility.name}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {facility.openingHours}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-teal-800">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              Max {facility.capacity} guests
            </span>
          </div>

          <div className="space-y-1">
            {facility.rules?.slice(0, 2).map((r, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                <span className="text-teal-500 mt-0.5 flex-shrink-0">•</span>
                <span className="leading-snug line-clamp-1">{r}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.badge} border ${theme.light}`}>
            {facility.pricing?.split('(')[0].trim()}
          </span>
          <button className={`text-xs font-bold text-white px-4 py-1.5 rounded-xl bg-gradient-to-r ${theme.gradient} shadow-sm hover:shadow-md transition-all group-hover:scale-105`}>
            {isAdmin ? 'Reserve / Slot' : 'Request Slot →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————
// Booking Modal (Enforces Capacity & Admin Approval)
// ——————————————————————————
function BookingModal({ facility, onClose, onConfirm, isAdmin }) {
  const theme = FACILITY_THEMES[facility.id] || FACILITY_THEMES.gym;
  const Icon = FACILITY_ICONS[facility.icon] || Building2;
  const days = getNextNDays(14);

  const [selectedDate, setSelectedDate] = useState(days[1] || days[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [guestCount, setGuestCount] = useState(Math.min(10, facility.capacity || 10));
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const slots = generateSlotsFromHours(facility.openingHours, facility.slotDurationMinutes || 60);

  const maxCap = Number(facility.capacity) || 100;
  const numGuests = Number(guestCount) || 0;
  const isOverCapacity = numGuests > maxCap;
  const isInvalidGuestCount = numGuests < 1 || isOverCapacity;

  const fetchAvailability = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await api.get(`/facilities/availability?facilityId=${facility.id}&date=${selectedDate}`);
      setBookedSlots(res.data.bookedSlots || []);
    } catch (e) {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [facility.id, selectedDate]);

  useEffect(() => {
    fetchAvailability();
    setSelectedSlot(null);
    setError('');
  }, [fetchAvailability]);

  function isConflict(slot) {
    return bookedSlots.some(b =>
      b.startTime < slot.end && b.endTime > slot.start
    );
  }

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot.');
      return;
    }
    if (numGuests > maxCap) {
      setError(`Booking exceeds capacity! Maximum allowed for ${facility.name} is ${maxCap} guests, but you requested ${numGuests}.`);
      return;
    }
    if (numGuests < 1) {
      setError('Please enter at least 1 guest.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onConfirm({
        facilityId: facility.id,
        facilityName: facility.name,
        date: selectedDate,
        startTime: selectedSlot.start,
        endTime: selectedSlot.end,
        purpose: purpose || 'Recreation & Fitness',
        guestCount: numGuests,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className={`bg-gradient-to-r ${theme.gradient} p-6 rounded-t-3xl text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{facility.category}</p>
                <h3 className="font-bold text-lg leading-tight">{facility.name}</h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold opacity-90">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{facility.openingHours}</span>
            <span className="flex items-center gap-1.5 bg-black/20 px-2.5 py-0.5 rounded-full"><Users className="w-3.5 h-3.5 text-amber-300" />Max Capacity: {maxCap} guests</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Approval Workflow notice for residents */}
          {!isAdmin && (
            <div className="flex items-start gap-2.5 p-3.5 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-800">
              <Shield className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Society Admin Approval Required:</span> Your reservation request will be sent to the society management for review. Once approved, your slot will be officially confirmed.
              </div>
            </div>
          )}

          {/* Date Selector */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Select Date</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map(d => (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                  className={`flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    selectedDate === d
                      ? `bg-gradient-to-b ${theme.gradient} text-white border-transparent shadow-md`
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <span className="uppercase text-[9px] tracking-wide opacity-70">
                    {new Date(d + 'T00:00').toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                  <span className="text-base font-bold">{new Date(d + 'T00:00').getDate()}</span>
                  <span className="text-[9px] uppercase">
                    {new Date(d + 'T00:00').toLocaleDateString('en', { month: 'short' })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Slot Picker */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
              Choose Time Slot
              {loadingSlots && <span className="ml-2 text-teal-600 font-normal">Checking availability...</span>}
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map(slot => {
                const conflict = isConflict(slot);
                const selected = selectedSlot?.start === slot.start;
                return (
                  <button
                    key={slot.start}
                    disabled={conflict}
                    onClick={() => { setSelectedSlot(slot); setError(''); }}
                    className={`py-2 px-1 text-xs rounded-xl border font-semibold transition-all leading-tight ${
                      conflict
                        ? 'bg-red-50 text-red-300 border-red-200 cursor-not-allowed line-through'
                        : selected
                        ? `bg-gradient-to-b ${theme.gradient} text-white border-transparent shadow-md scale-105`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                    {formatTime(slot.start)}
                    <span className="block text-[10px] opacity-70">– {formatTime(slot.end)}</span>
                    {conflict && <span className="block text-[9px] text-red-400 font-normal">Reserved</span>}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-600 border border-teal-700" /> Selected</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Reserved / Pending</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Available</span>
            </div>
          </div>

          {/* Details & Capacity Validation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Purpose of Booking</label>
              <input
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Birthday Party, Yoga, Team Session"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-600">Expected Guests *</label>
                <span className={`text-[11px] font-bold ${isOverCapacity ? 'text-rose-600' : 'text-slate-500'}`}>
                  Max: {maxCap}
                </span>
              </div>
              <input
                type="number"
                min={1}
                max={maxCap}
                value={guestCount}
                onChange={e => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setGuestCount(val);
                  setError('');
                }}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                  isOverCapacity
                    ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500'
                    : 'border-slate-200 text-slate-800 focus:ring-teal-500'
                }`}
              />
            </div>
          </div>

          {/* Strict Capacity Alert if Exceeded */}
          {isOverCapacity && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-800 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900 text-sm">Capacity Exceeded!</p>
                <p className="mt-0.5 leading-relaxed">
                  <strong>{facility.name}</strong> has an admin-set maximum capacity of <strong>{maxCap} guests</strong>. You entered <strong>{numGuests} guests</strong>. Please adjust your guest count to {maxCap} or fewer to request this booking.
                </p>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          {selectedSlot && !isOverCapacity && (
            <div className={`${theme.light} border rounded-2xl p-4 text-sm`}>
              <p className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Booking Summary</p>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between"><span>Facility:</span><strong>{facility.name}</strong></div>
                <div className="flex justify-between"><span>Date:</span><strong>{dateLabel(selectedDate)}</strong></div>
                <div className="flex justify-between"><span>Time:</span><strong>{formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}</strong></div>
                <div className="flex justify-between"><span>Attendees:</span><strong>{numGuests} / {maxCap} max capacity</strong></div>
                <div className="flex justify-between"><span>Charge:</span><strong className="text-teal-700">{facility.pricing?.split('(')[0].trim()}</strong></div>
                <div className="flex justify-between">
                  <span>Approval Status:</span>
                  <strong className={isAdmin ? 'text-emerald-700' : 'text-amber-700'}>
                    {isAdmin ? 'Direct Society Approval' : 'Awaiting Admin Approval'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Rules */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Facility Rules
            </p>
            <ul className="space-y-1.5">
              {facility.rules?.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-2xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedSlot || submitting || isInvalidGuestCount}
              className={`flex-1 py-3 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r ${theme.gradient} hover:shadow-lg`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAdmin ? 'Processing...' : 'Submitting Request...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {isAdmin ? 'Confirm Society Reservation' : 'Submit Booking Request'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ——————————————————————————
// Resident My Bookings Panel
// ——————————————————————————
function MyBookings({ bookings, loading, onCancel, cancellingId }) {
  const active = bookings.filter(b => ['Pending', 'Approved', 'Booked'].includes(b.status));
  const past = bookings.filter(b => !['Pending', 'Approved', 'Booked'].includes(b.status));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold text-slate-600">No reservations yet.</p>
        <p className="text-sm text-slate-400 mt-1">Head to the Amenities tab and request your first facility booking!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div>
          <h4 className="font-bold text-slate-700 mb-3 text-xs uppercase tracking-wider">
            Active Requests & Reservations ({active.length})
          </h4>
          <div className="space-y-3">
            {active.map(b => {
              const theme = FACILITY_THEMES[b.facilityId] || FACILITY_THEMES.gym;
              const isPending = b.status === 'Pending';
              const isApproved = b.status === 'Approved' || b.status === 'Booked';

              return (
                <div
                  key={b._id}
                  className={`rounded-2xl border p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs ${
                    isPending
                      ? 'bg-amber-50/70 border-amber-200'
                      : `${theme.light}`
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 shadow-xs text-white`}>
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-800 text-sm">{b.facilityName}</p>
                        {isPending ? (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Awaiting Admin Approval
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved & Confirmed
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {dateLabel(b.date)} • {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.purpose || 'Recreation'} • <strong className="text-slate-700">{b.guestCount} guests</strong>
                      </p>
                      {isPending && (
                        <p className="text-[11px] text-amber-700 font-medium mt-1">
                          Society office has received your request and will approve it shortly.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-white/70 px-2.5 py-1 rounded-lg border border-slate-200">
                      {b.bookingNumber}
                    </span>
                    <button
                      onClick={() => onCancel(b._id, b.bookingNumber)}
                      disabled={cancellingId === b._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 transition-all disabled:opacity-50 shadow-xs"
                    >
                      {cancellingId === b._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h4 className="font-bold text-slate-500 mb-3 text-xs uppercase tracking-wider">
            Past, Rejected & Cancelled
          </h4>
          <div className="space-y-2">
            {past.map(b => (
              <div key={b._id} className="bg-slate-50 rounded-2xl border border-slate-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-700 text-sm">{b.facilityName}</p>
                    <span className="text-[11px] font-mono text-slate-400">({b.bookingNumber})</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {dateLabel(b.date)} • {formatTime(b.startTime)} – {formatTime(b.endTime)} • {b.guestCount} guests
                  </p>
                  {b.rejectionReason && (
                    <p className="text-xs text-rose-700 mt-1 font-medium bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 inline-block">
                      Rejection Reason: {b.rejectionReason}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                  b.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : b.status === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ——————————————————————————
// Admin All Bookings & Approval View
// ——————————————————————————
function AdminBookingsView({
  bookings,
  facilities,
  loading,
  onRefresh,
  onApprove,
  onRejectPrompt,
  approvingId,
  rejectingId,
  onCancel,
  cancellingId,
}) {
  const [filter, setFilter] = useState('all');

  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const approvedCount = bookings.filter(b => ['Approved', 'Booked'].includes(b.status)).length;
  const rejectedCount = bookings.filter(b => ['Rejected', 'Cancelled'].includes(b.status)).length;

  const filteredBookings = useMemo(() => {
    if (filter === 'pending') return bookings.filter(b => b.status === 'Pending');
    if (filter === 'approved') return bookings.filter(b => ['Approved', 'Booked'].includes(b.status));
    if (filter === 'rejected') return bookings.filter(b => ['Rejected', 'Cancelled', 'Completed'].includes(b.status));
    return bookings;
  }, [bookings, filter]);

  // Create a facility capacity lookup
  const facilityCapacityMap = useMemo(() => {
    const map = {};
    facilities.forEach(f => {
      map[f.id] = f.capacity;
    });
    return map;
  }, [facilities]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Controls & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
            Pending Approval ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'approved'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'rejected'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Rejected / Cancelled ({rejectedCount})
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all self-end sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold text-sm">No facility bookings match this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map(b => {
            const theme = FACILITY_THEMES[b.facilityId] || FACILITY_THEMES.gym;
            const isPending = b.status === 'Pending';
            const isApproved = b.status === 'Approved' || b.status === 'Booked';
            const isRejected = b.status === 'Rejected';
            const facilityCap = facilityCapacityMap[b.facilityId];

            return (
              <div
                key={b._id}
                className={`bg-white rounded-2xl border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${
                  isPending
                    ? 'border-amber-300 bg-amber-50/30 ring-1 ring-amber-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 text-white shadow-xs`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm">{b.facilityName}</p>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {b.bookingNumber}
                      </span>
                      {isPending && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Awaiting Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          Rejected
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                      {dateLabel(b.date)} • {formatTime(b.startTime)} – {formatTime(b.endTime)}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span>Resident: <strong className="text-slate-700">{b.residentName}</strong></span>
                      <span>Flat: <strong className="text-slate-700">{b.flatNumber} {b.wing ? `(${b.wing})` : ''}</strong></span>
                      <span>
                        Guests: <strong className="text-teal-700">{b.guestCount}</strong>
                        {facilityCap ? ` / max ${facilityCap}` : ''}
                      </span>
                    </div>

                    {b.purpose && (
                      <p className="text-xs text-slate-600 italic">
                        "{b.purpose}"
                      </p>
                    )}

                    {b.rejectionReason && (
                      <p className="text-xs text-rose-700 font-medium bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 mt-1 inline-block">
                        Rejection Reason: {b.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex items-center gap-2.5 self-end md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  {isPending && (
                    <>
                      <button
                        onClick={() => onApprove(b._id, b.facilityName, b.residentName)}
                        disabled={approvingId === b._id || rejectingId === b._id}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                      >
                        {approvingId === b._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Approve Request</span>
                      </button>

                      <button
                        onClick={() => onRejectPrompt(b)}
                        disabled={approvingId === b._id || rejectingId === b._id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => onCancel(b._id, b.bookingNumber)}
                      disabled={cancellingId === b._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                    >
                      {cancellingId === b._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      <span>Cancel Booking</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ——————————————————————————
// MAIN EXPORT: FacilityBookingHub
// ——————————————————————————
export const FacilityBookingHub = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [facilities, setFacilities] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [editingCapacityFacility, setEditingCapacityFacility] = useState(null);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingSubmitting, setRejectingSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await api.get('/facilities');
      if (res.data.success) {
        setFacilities(res.data.facilities || []);
      }
    } catch (e) {
      console.error('Failed to load facilities:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await api.get('/facilities/bookings');
      if (res.data.success) {
        if (!isAdmin) {
          setMyBookings(res.data.bookings || []);
        } else {
          setAllBookings(res.data.bookings || []);
        }
      }
    } catch (e) {
      console.error('Failed to load bookings:', e);
    } finally {
      setBookingsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchFacilities();
    fetchBookings();
  }, [fetchFacilities, fetchBookings]);

  // Handle resident or admin booking submission
  const handleBookingConfirm = async (data) => {
    const res = await api.post('/facilities/book', data);
    if (res.data.success) {
      showToast(res.data.message);
      fetchBookings();
    }
    return res;
  };

  // Handle Admin updating facility capacity
  const handleSaveCapacity = async (facilityId, newCapacity) => {
    const res = await api.put(`/facilities/${facilityId}/capacity`, { capacity: newCapacity });
    if (res.data.success) {
      showToast(`Capacity updated to ${newCapacity} guests!`);
      // Update local state and refetch
      setFacilities(prev =>
        prev.map(f => (f.id === facilityId ? { ...f, capacity: newCapacity } : f))
      );
      fetchFacilities();
    }
    return res;
  };

  // Handle Admin approving request
  const handleApproveBooking = async (id, facilityName, residentName) => {
    setApprovingId(id);
    try {
      const res = await api.post(`/facilities/bookings/${id}/approve`);
      if (res.data.success) {
        showToast(`Approved booking for ${facilityName} (${residentName}).`);
        fetchBookings();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to approve booking request.', 'error');
    } finally {
      setApprovingId(null);
    }
  };

  // Handle Admin confirming rejection
  const handleRejectBooking = async (id, reason) => {
    setRejectingSubmitting(true);
    try {
      const res = await api.post(`/facilities/bookings/${id}/reject`, { reason });
      if (res.data.success) {
        showToast(`Booking request rejected.`);
        setRejectingBooking(null);
        fetchBookings();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to reject booking request.', 'error');
    } finally {
      setRejectingSubmitting(false);
    }
  };

  // Handle cancellation
  const handleCancel = async (id, bookingNumber) => {
    if (!window.confirm(`Are you sure you want to cancel reservation ${bookingNumber}?`)) return;
    setCancellingId(id);
    try {
      const res = await api.post(`/facilities/${id}/cancel`, { reason: 'Cancelled by user' });
      if (res.data.success) {
        showToast(`Reservation ${bookingNumber} cancelled.`);
        fetchBookings();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to cancel.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const activeReservationsCount = myBookings.filter(b =>
    ['Pending', 'Approved', 'Booked'].includes(b.status)
  ).length;

  const pendingRequestsCount = allBookings.filter(b => b.status === 'Pending').length;

  const tabs = !isAdmin
    ? [
        { key: 'browse', label: 'Browse Amenities', icon: Sparkles },
        { key: 'my-bookings', label: `My Reservations (${activeReservationsCount})`, icon: CalendarDays },
      ]
    : [
        { key: 'browse', label: 'Amenities Directory & Capacity', icon: Sparkles },
        {
          key: 'all-bookings',
          label: `Manage Bookings ${pendingRequestsCount > 0 ? `(${pendingRequestsCount} Pending)` : `(${allBookings.length})`}`,
          icon: ListFilter,
        },
      ];

  return (
    <div className="space-y-5 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top duration-300 ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-teal-700'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white border border-teal-700 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">
              {isAdmin ? 'Society Administration' : 'Community Amenities'}
            </p>
            <h2 className="text-xl font-bold">Facility Booking & Amenities Hub</h2>
            <p className="text-teal-200 text-sm mt-1">
              {isAdmin
                ? 'Control facility capacity limits • Review and approve resident facility booking requests'
                : 'Reserve amenities with capacity limits • Requests reviewed by society management'}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3 border border-white/20 self-start sm:self-auto">
            <Shield className="w-5 h-5 text-emerald-300 flex-shrink-0" />
            <div>
              <p className="text-xs text-teal-200">Capacity & Conflict Engine</p>
              <p className="text-xs font-bold text-white">
                {isAdmin ? 'Admin Approval Enabled' : 'Strict Capacity Enforced'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(tab => (
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
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Amenities Directory */}
      {activeTab === 'browse' && (
        loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {facilities.map(facility => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                isAdmin={isAdmin}
                onBook={(f) => { setSelectedFacility(f); }}
                onEditCapacity={(f) => { setEditingCapacityFacility(f); }}
              />
            ))}
          </div>
        )
      )}

      {/* Tab: Resident Reservations */}
      {activeTab === 'my-bookings' && (
        <MyBookings
          bookings={myBookings}
          loading={bookingsLoading}
          onCancel={handleCancel}
          cancellingId={cancellingId}
        />
      )}

      {/* Tab: Admin Manage Bookings */}
      {activeTab === 'all-bookings' && (
        <AdminBookingsView
          bookings={allBookings}
          facilities={facilities}
          loading={bookingsLoading}
          onRefresh={fetchBookings}
          onApprove={handleApproveBooking}
          onRejectPrompt={(b) => setRejectingBooking(b)}
          approvingId={approvingId}
          rejectingId={rejectingSubmitting}
          onCancel={handleCancel}
          cancellingId={cancellingId}
        />
      )}

      {/* Modal: Resident / Admin Slot Booking */}
      {selectedFacility && (
        <BookingModal
          facility={selectedFacility}
          isAdmin={isAdmin}
          onClose={() => setSelectedFacility(null)}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* Modal: Admin Edit Capacity */}
      {editingCapacityFacility && (
        <EditCapacityModal
          facility={editingCapacityFacility}
          onClose={() => setEditingCapacityFacility(null)}
          onSave={handleSaveCapacity}
        />
      )}

      {/* Modal: Admin Reject Booking Request */}
      {rejectingBooking && (
        <RejectBookingModal
          booking={rejectingBooking}
          onClose={() => setRejectingBooking(null)}
          onConfirm={handleRejectBooking}
          submitting={rejectingSubmitting}
        />
      )}
    </div>
  );
};
