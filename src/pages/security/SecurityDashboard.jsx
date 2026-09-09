import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  QrCode,
  UserCheck,
  LogOut,
  AlertTriangle
} from 'lucide-react';

export const SecurityDashboard = () => {
  const { user, society } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const [activeInsideVisitors, setActiveInsideVisitors] = useState([
    { id: 'VIS-901', name: 'Mahesh Deshmukh', flat: 'B-402', type: 'Guest', entryTime: '3:15 PM', phone: '+91 98201 12345' },
    { id: 'VIS-902', name: 'Sanjay Rawat (Urban Company)', flat: 'A-701', type: 'Service', entryTime: '3:30 PM', phone: '+91 98112 34567' },
    { id: 'VIS-903', name: 'Kavita Patel', flat: 'C-304', type: 'Guest', entryTime: '3:45 PM', phone: '+91 98900 88776' },
  ]);

  const handleVerifyPasscode = (e) => {
    e.preventDefault();
    if (passcode.trim() === '718902' || passcode.trim() === '492019') {
      setVerificationResult({
        status: 'success',
        message: 'Passcode Verified! Pre-approved by Rahul Verma (Flat B-402)',
        guest: 'Dr. Rajesh Kulkarni',
        purpose: 'Guest Entry',
      });
    } else {
      setVerificationResult({
        status: 'error',
        message: 'Invalid or Expired Passcode. Please check with resident.',
      });
    }
  };

  const handleMarkExit = (id) => {
    setActiveInsideVisitors(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="space-y-6">
      
      {/* Gate Station Command Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 rounded-2xl p-6 text-white shadow-xl border border-amber-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-700">
              Active Gate Post
            </span>
            <span className="text-xs text-slate-300">
              {society?.name} • Gate 1
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
          <div className="bg-slate-900/90 border border-amber-500/40 p-3 rounded-xl text-center">
            <p className="text-[11px] text-amber-300 font-bold uppercase">Inside Society</p>
            <p className="text-2xl font-display font-extrabold text-white">{activeInsideVisitors.length} Active</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition">
            <AlertTriangle className="w-4 h-4" />
            Emergency
          </button>
        </div>
      </div>

      {/* Action Split: Fast Passcode / QR Verifier + Walk-in Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Passcode / QR Fast Verification */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Fast Passcode / QR Scan
              </h2>
              <p className="text-xs text-slate-500">
                Verify resident pre-authorized entry code
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Enter 6-Digit Gate Passcode (Try: <span className="font-mono text-teal-700 cursor-pointer" onClick={() => setPasscode('718902')}>718902</span>)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 718902"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full px-4 py-2.5 text-base font-mono font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
                >
                  Verify
                </button>
              </div>
            </div>

            {verificationResult && (
              <div className={`p-4 rounded-xl text-xs border ${
                verificationResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <p className="font-bold text-sm">{verificationResult.message}</p>
                {verificationResult.guest && (
                  <div className="mt-2 space-y-1">
                    <p>Guest: <strong>{verificationResult.guest}</strong> ({verificationResult.purpose})</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveInsideVisitors(prev => [
                          ...prev,
                          {
                            id: 'VIS-' + Math.floor(Math.random() * 900 + 100),
                            name: verificationResult.guest,
                            flat: 'B-402',
                            type: 'Guest',
                            entryTime: 'Just Now',
                            phone: '+91 98221 00000',
                          }
                        ]);
                        setVerificationResult(null);
                        setPasscode('');
                      }}
                      className="mt-2 px-3 py-1.5 bg-emerald-700 text-white font-bold rounded-lg hover:bg-emerald-800 transition"
                    >
                      Authorize Gate Entry Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Walk-in Visitor Fast Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Register Walk-in Visitor
              </h2>
              <p className="text-xs text-slate-500">
                Dispatches real-time approval prompt to resident
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visitor Name</label>
                <input type="text" placeholder="e.g. Ramesh Patil" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Visitor Phone</label>
                <input type="tel" placeholder="+91 98xxx xxxxx" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Flat</label>
                <input type="text" placeholder="e.g. B-402" className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono" />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Entry Purpose</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg">
                  <option>Guest / Personal</option>
                  <option>Courier Delivery</option>
                  <option>Home Service / Repair</option>
                  <option>Cab / Driver</option>
                </select>
              </div>
            </div>

            <button className="w-full py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition mt-2">
              Send Approval Request to Resident
            </button>
          </div>
        </div>

      </div>

      {/* Visitors Currently Inside Society Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Visitors Currently Inside Society ({activeInsideVisitors.length})
            </h2>
            <p className="text-xs text-slate-500">
              Live gate audit roster with 1-click exit logging
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Pass ID</th>
                <th className="py-2.5 px-3">Visitor Name</th>
                <th className="py-2.5 px-3">Destination Flat</th>
                <th className="py-2.5 px-3">Entry Time</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeInsideVisitors.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 font-mono font-bold text-slate-700">{v.id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-900">{v.name}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {v.flat}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{v.entryTime}</td>
                  <td className="py-3 px-3">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {v.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleMarkExit(v.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold transition flex items-center gap-1 ml-auto"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Record Exit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
