import React, { useState, useEffect, useCallback } from 'react';
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
  ArrowLeft,
  Info,
  ListFilter,
  Shield,
} from 'lucide-react';

// ——————————————————————————
// Static facility config (mirrors backend seed)
// ——————————————————————————
const FACILITY_ICONS = {
  Building2: Building2,
  Dumbbell: Dumbbell,
  Waves: Waves,
  Trophy: Trophy,
  Sparkles: Sparkles,
};

const FACILITY_THEMES = {
  clubhouse: { gradient: 'from-amber-600 to-orange-700', light: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' },
  gym: { gradient: 'from-teal-600 to-emerald-700', light: 'bg-teal-50 border-teal-200', badge: 'bg-teal-100 text-teal-700' },
  pool: { gradient: 'from-blue-500 to-cyan-600', light: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  tennis: { gradient: 'from-lime-600 to-green-700', light: 'bg-lime-50 border-lime-200', badge: 'bg-lime-100 text-lime-700' },
  'party-hall': { gradient: 'from-purple-600 to-violet-700', light: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
};

// Generate time slots 30min increments
function generateTimeSlots(openStr, closeStr) {
  const slots = [];
  const toMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toStr = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const [open] = openStr.split(' - ');
  const [, close] = openStr.split(' - ');
  const startMins = toMins(open || '06:00');
  const endMins = toMins(close || '22:00');

  for (let m = startMins; m < endMins; m += 30) {
    slots.push({ value: toStr(m), label: formatTime(toStr(m)) });
  }
  return slots;
}

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

function timeAgo(date) {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ——————————————————————————
// Facility Card
// ——————————————————————————
function FacilityCard({ facility, onBook }) {
  const theme = FACILITY_THEMES[facility.id] || FACILITY_THEMES.gym;
  const Icon = FACILITY_ICONS[facility.icon] || Building2;

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => onBook(facility)}>
      {/* Image / Gradient Banner */}
      <div className={`h-36 bg-gradient-to-br ${theme.gradient} relative overflow-hidden`}>
        <img
          src={facility.imageUrl}
          alt={facility.name}
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="absolute bottom-3 left-4 right-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">{facility.category}</span>
          <p className="text-white font-bold text-sm mt-0.5 leading-tight">{facility.name}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{facility.openingHours}</span>
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Max {facility.capacity}</span>
        </div>

        <div className="space-y-1">
          {facility.rules.slice(0, 2).map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
              <span className="text-teal-500 mt-0.5 flex-shrink-0">•</span>
              <span className="leading-snug">{r}</span>
            </div>
          ))}
        </div>

        <div className="pt-1 flex items-center justify-between">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${theme.badge} border ${theme.light}`}>{facility.pricing?.split('(')[0].trim()}</span>
          <button className={`text-xs font-bold text-white px-4 py-1.5 rounded-xl bg-gradient-to-r ${theme.gradient} shadow-sm hover:shadow-md transition-all group-hover:scale-105`}>
            Reserve →
          </button>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————
// Booking Modal
// ——————————————————————————
function BookingModal({ facility, onClose, onConfirm, existingBookings }) {
  const theme = FACILITY_THEMES[facility.id] || FACILITY_THEMES.gym;
  const Icon = FACILITY_ICONS[facility.icon] || Building2;
  const days = getNextNDays(14);

  const [selectedDate, setSelectedDate] = useState(days[1]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const slots = generateSlotsFromHours(facility.openingHours, facility.slotDurationMinutes || 60);

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
    if (!selectedSlot) { setError('Please select a time slot.'); return; }
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
        guestCount,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to complete reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className={`bg-gradient-to-r ${theme.gradient} p-6 rounded-t-3xl text-white`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{facility.category}</p>
                <h3 className="font-bold text-base leading-tight">{facility.name}</h3>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm opacity-80">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{facility.openingHours}</span>
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />Max {facility.capacity}</span>
          </div>
        </div>

        <div className="p-6 space-y-5">
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
                  <span className="uppercase text-[9px] tracking-wide opacity-70">{new Date(d + 'T00:00').toLocaleDateString('en', { weekday: 'short' })}</span>
                  <span className="text-base font-bold">{new Date(d + 'T00:00').getDate()}</span>
                  <span className="text-[9px] uppercase">{new Date(d + 'T00:00').toLocaleDateString('en', { month: 'short' })}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slot Picker */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">
              Choose Time Slot
              {loadingSlots && <span className="ml-2 text-teal-500">Loading availability...</span>}
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
                    {conflict && <span className="block text-[9px] text-red-400 font-normal">Booked</span>}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-teal-600 border border-teal-700" /> Selected</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Booked</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-200" /> Available</span>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Purpose (optional)</label>
              <input
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="e.g. Birthday party, Yoga"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Expected Guests</label>
              <input
                type="number"
                min={1}
                max={facility.capacity}
                value={guestCount}
                onChange={e => setGuestCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Booking Summary */}
          {selectedSlot && (
            <div className={`${theme.light} border rounded-2xl p-4 text-sm`}>
              <p className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Booking Summary</p>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between"><span>Facility</span><strong>{facility.name}</strong></div>
                <div className="flex justify-between"><span>Date</span><strong>{dateLabel(selectedDate)}</strong></div>
                <div className="flex justify-between"><span>Time</span><strong>{formatTime(selectedSlot.start)} – {formatTime(selectedSlot.end)}</strong></div>
                <div className="flex justify-between"><span>Guests</span><strong>{guestCount}</strong></div>
                <div className="flex justify-between"><span>Charge</span><strong className="text-teal-700">{facility.pricing?.split('(')[0].trim()}</strong></div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
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
              {facility.rules.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-medium rounded-2xl hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedSlot || submitting}
              className={`flex-1 py-3 text-white text-sm font-bold rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${theme.gradient} hover:shadow-lg`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {submitting ? 'Reserving...' : 'Confirm Reservation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————
// My Bookings Panel
// ——————————————————————————
function MyBookings({ bookings, loading, onCancel, cancellingId }) {
  const active = bookings.filter(b => b.status === 'Booked');
  const past = bookings.filter(b => b.status !== 'Booked');

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold text-slate-600">No reservations yet.</p>
        <p className="text-sm text-slate-400 mt-1">Head back to browse amenities and make your first booking!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div>
          <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Active Reservations</h4>
          <div className="space-y-3">
            {active.map(b => {
              const theme = FACILITY_THEMES[b.facilityId] || FACILITY_THEMES.gym;
              const Icon = Building2;
              return (
                <div key={b._id} className={`${theme.light} rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{b.facilityName}</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {dateLabel(b.date)} • {formatTime(b.startTime)} – {formatTime(b.endTime)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.purpose || 'Recreation'} • {b.guestCount} guest{b.guestCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-600">{b.bookingNumber}</span>
                    <button
                      onClick={() => onCancel(b._id, b.bookingNumber)}
                      disabled={cancellingId === b._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl border border-red-200 transition-all disabled:opacity-50"
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
          <h4 className="font-bold text-slate-500 mb-3 text-sm uppercase tracking-wider">Past / Cancelled</h4>
          <div className="space-y-2">
            {past.map(b => (
              <div key={b._id} className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-600 text-sm">{b.facilityName}</p>
                  <p className="text-xs text-slate-400">{dateLabel(b.date)} • {formatTime(b.startTime)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
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
// Admin All Bookings View
// ——————————————————————————
function AdminBookingsView({ bookings, loading, onRefresh }) {
  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">{bookings.filter(b => b.status === 'Booked').length} active reservations</p>
        <button onClick={onRefresh} className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-600 hover:bg-slate-50 transition-all">
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="font-semibold">No facility bookings found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map(b => {
            const theme = FACILITY_THEMES[b.facilityId] || FACILITY_THEMES.gym;
            return (
              <div key={b._id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0`}>
                    <CalendarDays className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{b.facilityName}</p>
                    <p className="text-xs text-slate-500">{dateLabel(b.date)} • {formatTime(b.startTime)} – {formatTime(b.endTime)}</p>
                    <p className="text-xs text-slate-400">{b.residentName} • Flat {b.flatNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">{b.bookingNumber}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    b.status === 'Booked' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                    b.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>{b.status}</span>
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
// MAIN EXPORT
// ——————————————————————————
export const FacilityBookingHub = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchFacilities = useCallback(async () => {
    try {
      const res = await api.get('/facilities');
      if (res.data.success) setFacilities(res.data.facilities || []);
    } catch (e) {
      console.error('Failed to load facilities:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const res = await api.get('/facilities/bookings');
      if (res.data.success) {
        if (user?.role === 'resident') {
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
  }, [user?.role]);

  useEffect(() => {
    fetchFacilities();
    fetchMyBookings();
  }, [fetchFacilities, fetchMyBookings]);

  const handleBookingConfirm = async (data) => {
    const res = await api.post('/facilities/book', data);
    if (res.data.success) {
      showToast(`✅ ${res.data.message}`);
      fetchMyBookings();
    }
    return res;
  };

  const handleCancel = async (id, bookingNumber) => {
    if (!window.confirm(`Cancel reservation ${bookingNumber}?`)) return;
    setCancellingId(id);
    try {
      const res = await api.post(`/facilities/${id}/cancel`, { reason: 'Cancelled by resident' });
      if (res.data.success) {
        showToast(`Reservation ${bookingNumber} cancelled.`);
        fetchMyBookings();
      }
    } catch (e) {
      showToast(e?.response?.data?.message || 'Failed to cancel.', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const tabs = user?.role === 'resident'
    ? [
        { key: 'browse', label: 'Browse Amenities', icon: Sparkles },
        { key: 'my-bookings', label: `My Reservations (${myBookings.filter(b => b.status === 'Booked').length})`, icon: CalendarDays },
      ]
    : [
        { key: 'browse', label: 'Amenities Directory', icon: Sparkles },
        { key: 'all-bookings', label: 'All Bookings', icon: ListFilter },
      ];

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-3 animate-bounce-in ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-teal-700'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white border border-teal-700 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">Community Amenities</p>
            <h2 className="text-xl font-bold">Facility Booking Hub</h2>
            <p className="text-teal-200 text-sm mt-1">Reserve amenities with zero-conflict engine • Max 2 active bookings per flat</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded-xl p-3 border border-white/20">
            <Shield className="w-5 h-5 text-emerald-300" />
            <div>
              <p className="text-xs text-teal-200">Conflict Protection</p>
              <p className="text-xs font-bold text-white">Atomic Engine Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
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
                onBook={(f) => { setSelectedFacility(f); }}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'my-bookings' && (
        <MyBookings
          bookings={myBookings}
          loading={bookingsLoading}
          onCancel={handleCancel}
          cancellingId={cancellingId}
        />
      )}

      {activeTab === 'all-bookings' && (
        <AdminBookingsView
          bookings={allBookings}
          loading={bookingsLoading}
          onRefresh={fetchMyBookings}
        />
      )}

      {/* Booking Modal */}
      {selectedFacility && (
        <BookingModal
          facility={selectedFacility}
          existingBookings={myBookings}
          onClose={() => setSelectedFacility(null)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
};
