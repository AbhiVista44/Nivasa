import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Calendar,
  Clock,
  Car,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import api from '../../services/api';
import { VisitorPassCard } from './VisitorPassCard';

const VISITOR_TYPES = [
  { id: 'Guest', label: 'Personal Guest', desc: 'Friends, family & personal visitors' },
  { id: 'Delivery', label: 'Delivery', desc: 'Amazon, Flipkart, Food & Courier' },
  { id: 'Service', label: 'Home Service', desc: 'Electrician, Plumber, Salon, Cleaning' },
  { id: 'Cab', label: 'Cab / Driver', desc: 'Uber, Ola or personal driver entry' },
];

const TIME_SLOTS = [
  'Anytime during the day',
  'Morning (9 AM – 12 PM)',
  'Afternoon (12 PM – 4 PM)',
  'Evening (4 PM – 7 PM)',
  'Night (7 PM – 10 PM)',
];

export const PreAuthorizeModal = ({ isOpen, onClose, onPassCreated }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [type, setType] = useState('Guest');
  const [expectedDate, setExpectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedTimeSlot, setExpectedTimeSlot] = useState(TIME_SLOTS[0]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPass, setCreatedPass] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Please enter guest name and phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/visitors/pre-authorize', {
        name: name.trim(),
        phone: phone.trim(),
        vehicleNumber: vehicleNumber.trim(),
        type,
        expectedDate,
        expectedTimeSlot,
      });

      if (res.data.success) {
        setCreatedPass(res.data.pass);
        onPassCreated?.(res.data.pass);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate visitor pass. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setPhone('');
    setVehicleNumber('');
    setType('Guest');
    setCreatedPass(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-slate-900">
                Pre-Authorize Visitor
              </h2>
              <p className="text-xs text-slate-500">
                Generate instant QR gate pass & 6-digit passcode
              </p>
            </div>
          </div>

          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {createdPass ? (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-display text-slate-900">
                Gate Pass Generated!
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Share this digital pass or 6-digit PIN with your guest for fast entry clearance.
              </p>

              <div className="pt-2">
                <VisitorPassCard
                  pass={createdPass}
                  onClose={handleResetAndClose}
                />
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreatedPass(null);
                    setName('');
                    setPhone('');
                    setVehicleNumber('');
                  }}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  + Pre-Authorize Another Guest
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Guest Name & Phone */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Guest / Visitor Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Kulkarni"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98221 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Vehicle Number (Optional)
                    </label>
                    <div className="relative">
                      <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. MH 12 AB 1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Visitor Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Visit Purpose
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {VISITOR_TYPES.map((vt) => (
                    <button
                      key={vt.id}
                      type="button"
                      onClick={() => setType(vt.id)}
                      className={`p-3 rounded-xl border text-left transition ${
                        type === vt.id
                          ? 'bg-teal-50/80 border-teal-500 ring-1 ring-teal-500 text-teal-900'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <p className="text-xs font-bold">{vt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{vt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expected Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Expected Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Time Slot
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={expectedTimeSlot}
                      onChange={(e) => setExpectedTimeSlot(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                    >
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Pass & 6-Digit PIN…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Generate Pass & 6-Digit Code
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
