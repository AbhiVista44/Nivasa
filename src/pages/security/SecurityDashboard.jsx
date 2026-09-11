import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  QrCode,
  UserCheck,
  LogOut,
  AlertTriangle,
  PhoneCall,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Search,
  RefreshCw,
  BellRing,
  Loader2,
  ShieldCheck,
  Video,
  VideoOff
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

  // Walk-in Registration form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinFlat, setWalkinFlat] = useState('B-402');
  const [walkinType, setWalkinType] = useState('Guest');
  const [walkinVehicle, setWalkinVehicle] = useState('');
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);
  const [walkinFeedback, setWalkinFeedback] = useState('');

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

  useEffect(() => {
    fetchGateData();
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

  // Start webcam
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Webcam not accessible:', err.message);
      // Fallback placeholder photo
      setCapturedPhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      setCapturedPhoto(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  // Walk-in visitor submission
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinFlat.trim()) {
      setWalkinFeedback('Please provide visitor name and flat number.');
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
        type: walkinType,
        photoUrl: capturedPhoto || '',
      });

      if (res.data.success) {
        setWalkinFeedback(res.data.message);
        setWalkinName('');
        setWalkinPhone('');
        setWalkinVehicle('');
        setCapturedPhoto(null);
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
            {pendingApprovals.map((p) => (
              <div
                key={p._id || p.visitorNumber}
                className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{p.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Flat <strong className="text-teal-800">{p.flatNumber}</strong> • {p.type}
                  </p>
                  <p className="text-[10px] text-amber-700 font-medium">
                    Status: <span className="font-bold">{p.status}</span>
                  </p>
                </div>

                {p.status === 'Approved' ? (
                  <button
                    onClick={() => handleAuthorizeEntry(p._id || p.visitorNumber)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
                  >
                    Allow In
                  </button>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-lg">
                    Waiting…
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Split: Fast Passcode / QR Verifier + Walk-in Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Passcode / QR Fast Verification */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">
                  Fast Passcode / QR Verification
                </h2>
                <p className="text-xs text-slate-500">
                  Verify resident pre-authorized 6-digit entry PIN
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPasscode('718902');
              }}
              className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-1 rounded-lg hover:bg-teal-100 transition"
              title="Click to autofill sample valid pass"
            >
              Test PIN: 718902
            </button>
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
                  placeholder="e.g. 718902"
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
          <div className="flex items-center justify-between">
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

            {/* Webcam / Photo Trigger */}
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition ${
                isCameraActive ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isCameraActive ? <VideoOff className="w-4 h-4" /> : <Camera className="w-4 h-4 text-teal-600" />}
              {isCameraActive ? 'Cancel Cam' : 'Capture Photo'}
            </button>
          </div>

          {/* Live Camera Preview / Snapshot */}
          {isCameraActive && (
            <div className="p-3 bg-slate-900 rounded-2xl text-center space-y-2">
              <video ref={videoRef} autoPlay playsInline className="w-48 h-36 rounded-xl mx-auto object-cover border border-slate-700" />
              <button
                type="button"
                onClick={captureSnapshot}
                className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                Snap Photo
              </button>
            </div>
          )}

          {capturedPhoto && (
            <div className="flex items-center gap-3 p-2.5 bg-teal-50 rounded-xl border border-teal-200">
              <img src={capturedPhoto} alt="Visitor Snapshot" className="w-10 h-10 rounded-lg object-cover border" />
              <div className="flex-1">
                <p className="text-xs font-bold text-teal-900">Photo / ID Snapshot Captured</p>
                <p className="text-[10px] text-teal-700">Will be sent with resident approval prompt</p>
              </div>
              <button
                onClick={() => setCapturedPhoto(null)}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          <form onSubmit={handleWalkinSubmit} className="space-y-3 text-xs">
            {walkinFeedback && (
              <div className="p-3 bg-teal-50 border border-teal-200 text-teal-900 font-bold rounded-xl">
                {walkinFeedback}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
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
                  placeholder="+91 98xxx xxxxx"
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Flat *</label>
                <select
                  value={walkinFlat}
                  onChange={(e) => setWalkinFlat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                >
                  <option value="B-402">B-402 (Rahul Verma)</option>
                  <option value="A-701">A-701 (Kunal Singhania)</option>
                  <option value="C-304">C-304 (Aditi Rao)</option>
                  <option value="A-101">A-101 (Priya Sharma)</option>
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
                  placeholder="MH 12 AB 1234"
                  value={walkinVehicle}
                  onChange={(e) => setWalkinVehicle(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={walkinSubmitting}
              className="w-full py-3 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition shadow-md mt-2 flex items-center justify-center gap-1.5"
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
                  const entryDate = v.entryTime ? new Date(v.entryTime) : null;
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

    </div>
  );
};
