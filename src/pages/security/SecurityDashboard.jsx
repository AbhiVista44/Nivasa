import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  KeyRound,
  UserCheck,
  LogOut,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Search,
  RefreshCw,
  BellRing,
  Loader2,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { IntercomDirectoryModal } from '../../components/security/IntercomDirectoryModal';
import { DeliveriesPanel } from '../../components/deliveries/DeliveriesPanel';

export const SecurityDashboard = ({ activeTab = 'gate-console', onNavigate }) => {
  const { user, society } = useAuth();

  // Gate verification state
  const [passcode, setPasscode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [authorizingEntry, setAuthorizingEntry] = useState(false);

  // Active Inside Roster & Pending Approvals state
  const [insideVisitors, setInsideVisitors] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loadingInside, setLoadingInside] = useState(true);
  const [isIntercomModalOpen, setIsIntercomModalOpen] = useState(false);
  const [emergencyAlertActive, setEmergencyAlertActive] = useState(false);

  // Registered flats for society dropdown
  const [registeredFlats, setRegisteredFlats] = useState([]);
  const [loadingFlats, setLoadingFlats] = useState(false);

  // Walk-in Registration form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinFlat, setWalkinFlat] = useState('');
  const [walkinWing, setWalkinWing] = useState('');
  const [walkinType, setWalkinType] = useState('Guest');
  const [walkinVehicle, setWalkinVehicle] = useState('');
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinFeedback, setWalkinFeedback] = useState('');

  // Delete Walk-in Request state
  const [deletingVisitor, setDeletingVisitor] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // Fetch live gate data
  const fetchGateData = async () => {
    try {
      const [insideRes, pendingRes] = await Promise.all([
        api.get('/visitors/inside'),
        api.get('/visitors/pending'),
      ]);

      if (insideRes.data.success) {
        setInsideVisitors(insideRes.data.visitors || []);
      }
      if (pendingRes.data.success) {
        setPendingApprovals(pendingRes.data.visitors || []);
      }
    } catch (err) {
      console.warn('Failed to fetch live gate data:', err.message);
    } finally {
      setLoadingInside(false);
    }
  };

  // Fetch registered society flats for destination dropdown
  const fetchFlats = async () => {
    try {
      setLoadingFlats(true);
      const res = await api.get('/flats');
      if (res.data.success) {
        const sorted = (res.data.flats || []).sort((a, b) => {
          if ((a.wing || '') !== (b.wing || '')) {
            return (a.wing || '').localeCompare(b.wing || '');
          }
          return (a.flatNumber || '').localeCompare(b.flatNumber || '', undefined, { numeric: true });
        });
        setRegisteredFlats(sorted);
      }
    } catch (err) {
      console.warn('Failed to fetch registered flats:', err.message);
    } finally {
      setLoadingFlats(false);
    }
  };

  useEffect(() => {
    fetchGateData();
    fetchFlats();
    const interval = setInterval(fetchGateData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Passcode verification handler
  const handleVerifyPasscode = async (e) => {
    e?.preventDefault();
    if (!passcode.trim()) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const res = await api.post('/visitors/verify', { passcode: passcode.trim() });
      if (res.data.success) {
        setVerificationResult({
          status: 'success',
          message: res.data.message,
          pass: res.data.pass,
        });
      }
    } catch (err) {
      setVerificationResult({
        status: 'error',
        message: err.response?.data?.message || 'Invalid or Expired Passcode. Please check with resident.',
      });
    } finally {
      setVerifying(false);
    }
  };

  // Authorize gate entry for verified pass
  const handleAuthorizeEntry = async (passId) => {
    setAuthorizingEntry(true);
    try {
      const res = await api.post(`/visitors/${passId}/entry`);
      if (res.data.success) {
        setVerificationResult({
          status: 'authorized',
          message: `Entry authorized for ${res.data.visitor?.name}!`,
        });
        setPasscode('');
        fetchGateData();
        setTimeout(() => setVerificationResult(null), 3500);
      }
    } catch (err) {
      alert('Failed to record entry: ' + (err.response?.data?.message || err.message));
    } finally {
      setAuthorizingEntry(false);
    }
  };

  // Log visitor exit
  const handleMarkExit = async (id) => {
    try {
      const res = await api.post(`/visitors/${id}/exit`);
      if (res.data.success) {
        fetchGateData();
      }
    } catch (err) {
      alert('Failed to record exit: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete walk-in request confirmation handler
  const confirmDeleteVisitor = async () => {
    if (!deletingVisitor) return;
    const targetId = deletingVisitor._id || deletingVisitor.visitorNumber;
    setDeletingLoading(true);
    try {
      const res = await api.delete(`/visitors/${targetId}`);
      if (res.data.success) {
        setPendingApprovals(prev => prev.filter(p => (p._id || p.visitorNumber) !== targetId));
        fetchGateData();
        setDeletingVisitor(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete walk-in request.');
    } finally {
      setDeletingLoading(false);
    }
  };

  // Walk-in visitor submission
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinFlat.trim()) {
      setWalkinFeedback('Please provide visitor name and select a destination flat.');
      return;
    }

    setWalkinSubmitting(true);
    setWalkinFeedback('');

    try {
      const res = await api.post('/visitors/walk-in', {
        name: walkinName.trim(),
        phone: walkinPhone.trim(),
        vehicleNumber: walkinVehicle.trim(),
        flatNumber: walkinFlat.trim(),
        wing: walkinWing.trim(),
        type: walkinType,
        photoUrl: '',
      });

      if (res.data.success) {
        setWalkinFeedback(res.data.message);
        setWalkinName('');
        setWalkinPhone('');
        setWalkinFlat('');
        setWalkinWing('');
        setWalkinVehicle('');
        fetchGateData();
      }
    } catch (err) {
      setWalkinFeedback(err.response?.data?.message || 'Failed to register walk-in visitor.');
    } finally {
      setWalkinSubmitting(false);
      setTimeout(() => setWalkinFeedback(''), 4000);
    }
  };

  if (activeTab === 'deliveries') {
    return <DeliveriesPanel />;
  }

  return (
    <div className="space-y-6">
      
      {/* Gate Station Command Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-3xl p-6 text-white shadow-2xl border border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-700">
              Gate Command Active
            </span>
            <span className="text-xs text-slate-300">
              {society?.name} • Main Gate 1
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">
            Gate Command Center — {user?.gatePost || 'Main Gate 1'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Duty Officer: <strong className="text-white">{user?.name}</strong> • Badge: <span className="font-mono text-amber-300">{user?.badgeNumber || 'SEC-089'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2.5 rounded-2xl text-center">
            <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Inside Society</p>
            <p className="text-2xl font-display font-black text-white">{insideVisitors.length} Active</p>
          </div>

          <button
            onClick={() => setIsIntercomModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl text-xs shadow-md transition"
          >
            <PhoneCall className="w-4 h-4" />
            Dial Intercom
          </button>

          <button
            onClick={() => setEmergencyAlertActive(!emergencyAlertActive)}
            className={`flex items-center gap-1.5 px-4 py-3 font-bold rounded-2xl text-xs shadow-md transition ${
              emergencyAlertActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            {emergencyAlertActive ? 'Alarm Triggered' : 'Emergency'}
          </button>
        </div>
      </div>

      <IntercomDirectoryModal
        isOpen={isIntercomModalOpen}
        onClose={() => setIsIntercomModalOpen(false)}
      />

      {/* Emergency Broadcast Banner */}
      {emergencyAlertActive && (
        <div className="p-4 bg-rose-900/90 border-2 border-rose-500 rounded-2xl text-white flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-300" />
            <span>EMERGENCY PROTOCOL ACTIVE: All barriers locked down. Admin and local authorities notified.</span>
          </div>
          <button
            onClick={() => setEmergencyAlertActive(false)}
            className="px-3 py-1 bg-white text-rose-950 rounded-lg font-black text-[10px]"
          >
            Deactivate
          </button>
        </div>
      )}

      {/* Pending Resident Approvals Watcher Banner (Live on Guard Screen) */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <BellRing className="w-4 h-4 text-amber-700 animate-bounce" />
              <span>Awaiting Resident Clearance ({pendingApprovals.length})</span>
            </div>
            <span className="text-[10px] text-amber-700 font-mono">Auto-refreshing every 4s</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {pendingApprovals.map((p) => {
              const passId = p._id || p.visitorNumber;
              return (
                <div
                  key={passId}
                  className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Flat <strong className="text-teal-800">{p.flatNumber}</strong> {p.wing ? `(${p.wing})` : ''} • {p.type}
                    </p>
                    <p className="text-[10px] text-amber-700 font-medium">
                      Status: <span className="font-bold">{p.status}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.status === 'Approved' ? (
                      <button
                        onClick={() => handleAuthorizeEntry(passId)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Allow In
                      </button>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg">
                        Waiting…
                      </span>
                    )}

                    {/* Option to delete registered walk-in request */}
                    <button
                      type="button"
                      onClick={() => setDeletingVisitor(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                      title="Delete Walk-in Request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Split: Fast Passcode Verifier + Walk-in Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Passcode Fast Verification */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Fast Passcode Verification
                </h2>
                <p className="text-xs text-slate-500">
                  Verify resident pre-authorized 6-digit entry PIN
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter 6-Digit Gate Passcode
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 583920"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-3 text-lg font-mono font-black tracking-widest bg-slate-50 border border-slate-300 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={verifying || !passcode.trim()}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-2xl text-xs transition shadow-md shrink-0 flex items-center gap-1.5"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verify Code
                </button>
              </div>
            </div>

            {verificationResult && (
              <div className={`p-4 rounded-2xl text-xs border ${
                verificationResult.status === 'success' || verificationResult.status === 'authorized'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <p className="font-bold text-sm flex items-center gap-1.5">
                  {verificationResult.status === 'error' ? (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  {verificationResult.message}
                </p>

                {verificationResult.pass && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-200 text-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">{verificationResult.pass.name}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">{verificationResult.pass.type}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Destination: <strong className="text-teal-800 font-mono">Flat {verificationResult.pass.flatNumber}</strong> ({verificationResult.pass.wing || 'Wing B'})
                    </p>
                    <p className="text-xs text-slate-600">
                      Host: <strong>{verificationResult.pass.hostResidentName || 'Resident'}</strong> • Phone: {verificationResult.pass.phone}
                    </p>
                    {verificationResult.pass.vehicleNumber && (
                      <p className="text-xs text-slate-600 font-mono">
                        Vehicle: <strong>{verificationResult.pass.vehicleNumber}</strong>
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={authorizingEntry}
                      onClick={() => handleAuthorizeEntry(verificationResult.pass._id || verificationResult.pass.visitorNumber)}
                      className="mt-3 w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                    >
                      {authorizingEntry ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Authorize Gate Entry Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Walk-in Visitor Registration Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Register Walk-in Visitor
              </h2>
              <p className="text-xs text-slate-500">
                Logs visitor and prompts resident approval
              </p>
            </div>
          </div>

          <form onSubmit={handleWalkinSubmit} className="space-y-3 text-xs">
            {walkinFeedback && (
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 font-bold rounded-xl">
                {walkinFeedback}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visitor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98221 45678"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Flat *</label>
                <select
                  required
                  value={walkinFlat}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setWalkinFlat(chosen);
                    const matched = registeredFlats.find(f => f.flatNumber === chosen);
                    setWalkinWing(matched?.wing || '');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                >
                  <option value="">
                    {loadingFlats ? 'Loading registered flats...' : '-- Select Registered Flat --'}
                  </option>
                  {registeredFlats.map((f) => (
                    <option key={f._id || f.flatNumber} value={f.flatNumber}>
                      Flat {f.flatNumber} {f.wing ? `(${f.wing})` : ''} {f.primaryResident?.name ? `• ${f.primaryResident.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Purpose</label>
                <select
                  value={walkinType}
                  onChange={(e) => setWalkinType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="Guest">Guest</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Service">Home Service</option>
                  <option value="Cab">Cab</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle No.</label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 AB 1234"
                  value={walkinVehicle}
                  onChange={(e) => setWalkinVehicle(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={walkinSubmitting || !walkinFlat}
              className="w-full py-3 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {walkinSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              Send Approval Request to Resident
            </button>
          </form>
        </div>

      </div>

      {/* Visitors Currently Inside Society Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Visitors Currently Inside Society ({insideVisitors.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live gate audit roster with 1-click exit logging
            </p>
          </div>

          <button
            onClick={fetchGateData}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-3 px-4">Pass ID</th>
                <th className="py-3 px-4">Visitor Name</th>
                <th className="py-3 px-4">Destination Flat</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Entry Time</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insideVisitors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No visitors currently inside society.
                  </td>
                </tr>
              ) : (
                insideVisitors.map((v) => {
                  const entryDate = v.entryTime ? new Date(v.entryTime) : (v.updatedAt ? new Date(v.updatedAt) : null);
                  const timeFormatted = entryDate ? entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently';

                  return (
                    <tr key={v._id || v.visitorNumber} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {v.visitorNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {v.name}
                        {v.phone && <span className="block text-[10px] text-slate-400 font-mono font-normal">{v.phone}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2 py-0.5 rounded-md">
                          {v.flatNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {v.vehicleNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 flex items-center gap-1 pt-4">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {timeFormatted}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          v.type === 'Service' ? 'bg-indigo-100 text-indigo-800' :
                          v.type === 'Delivery' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                        }`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleMarkExit(v._id || v.visitorNumber)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1 ml-auto shadow-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Record Exit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Walk-in Request Confirmation Modal */}
      {deletingVisitor && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-display">
                  Delete Walk-in Request?
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cancel and remove visitor registration
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove the walk-in request for <strong className="text-slate-900">{deletingVisitor.name}</strong> (Destination: Flat <span className="font-mono font-bold text-teal-800">{deletingVisitor.flatNumber}</span>)?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingVisitor(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Request
              </button>
              <button
                type="button"
                onClick={confirmDeleteVisitor}
                disabled={deletingLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                {deletingLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
