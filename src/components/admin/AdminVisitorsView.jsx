import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Search,
  Filter,
  Clock,
  Car,
  CheckCircle2,
  Calendar,
  LogOut,
  RefreshCw,
  UserPlus,
  X,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import api from '../../services/api';

export const AdminVisitorsView = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Guard provisioning state
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [guardForm, setGuardForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'guard123',
    gatePost: 'Main Gate 1',
    badgeNumber: '',
  });
  const [savingGuard, setSavingGuard] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/visitors');
      if (res.data.success) {
        setVisitors(res.data.visitors || []);
      }
    } catch (err) {
      console.error('Fetch admin visitors error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const handleProvisionGuard = async (e) => {
    e.preventDefault();
    if (!guardForm.name || !guardForm.email || !guardForm.password) {
      showToast('Name, email, and password are required.', 'error');
      return;
    }

    setSavingGuard(true);
    try {
      const res = await api.post('/auth/provision-user', {
        role: 'security',
        name: guardForm.name,
        email: guardForm.email,
        phone: guardForm.phone,
        password: guardForm.password,
        gatePost: guardForm.gatePost,
        badgeNumber: guardForm.badgeNumber,
      });

      if (res.data.success) {
        showToast(`Security Guard account for ${guardForm.name} provisioned successfully!`);
        setShowGuardModal(false);
        setGuardForm({
          name: '',
          email: '',
          phone: '',
          password: 'guard123',
          gatePost: 'Main Gate 1',
          badgeNumber: '',
        });
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to provision guard account', 'error');
    } finally {
      setSavingGuard(false);
    }
  };

  const filtered = visitors.filter(v => {
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;
    if (filterType !== 'all' && v.type !== filterType) return false;
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase();
      const mName = v.name?.toLowerCase().includes(s);
      const mFlat = v.flatNumber?.toLowerCase().includes(s);
      const mCode = v.passcode?.includes(s);
      const mNum = v.visitorNumber?.toLowerCase().includes(s);
      const mVeh = v.vehicleNumber?.toLowerCase().includes(s);
      if (!mName && !mFlat && !mCode && !mNum && !mVeh) return false;
    }
    return true;
  });

  const insideCount = visitors.filter(v => v.status === 'Inside').length;
  const preApprovedCount = visitors.filter(v => v.status === 'Pre-Approved').length;
  const exitedCount = visitors.filter(v => v.status === 'Exited').length;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top ${
            toast.type === 'error' ? 'bg-rose-700' : 'bg-teal-800'
          }`}
        >
          {toast.type === 'error' ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl border border-teal-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-800">
            Security & Gate Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">
            Society Visitor Audit & Gate Roster
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Complete real-time log of pre-authorized passes, walk-ins, barrier clearances, and gate personnel.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-900/90 border border-teal-500/40 px-4 py-2 rounded-2xl text-center">
            <p className="text-[10px] text-teal-300 font-bold uppercase tracking-wider">Inside Premises</p>
            <p className="text-2xl font-display font-black text-white">{insideCount} Active</p>
          </div>

          <button
            onClick={() => setShowGuardModal(true)}
            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold transition shadow"
          >
            <UserPlus className="w-4 h-4" />
            + Add Gate Guard
          </button>

          <button
            onClick={fetchVisitors}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition shadow border border-slate-700"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Total Recorded</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{visitors.length}</p>
          <p className="text-[10px] text-slate-400">All registered passes</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-blue-800">Inside Society</p>
          <p className="text-2xl font-extrabold text-blue-900 mt-1">{insideCount}</p>
          <p className="text-[10px] text-slate-400">Currently within campus</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-teal-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-teal-800">Pre-Approved</p>
          <p className="text-2xl font-extrabold text-teal-900 mt-1">{preApprovedCount}</p>
          <p className="text-[10px] text-slate-400">Active resident invitations</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase text-slate-500">Exited</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{exitedCount}</p>
          <p className="text-[10px] text-slate-400">Departures recorded</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Inside">Inside Society</option>
            <option value="Pre-Approved">Pre-Approved</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Exited">Exited</option>
            <option value="Revoked">Revoked</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-semibold text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="Guest">Guest</option>
            <option value="Delivery">Delivery</option>
            <option value="Service">Service</option>
            <option value="Cab">Cab</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search visitor, flat, passcode, vehicle…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Pass ID</th>
                <th className="py-3.5 px-4">Visitor</th>
                <th className="py-3.5 px-4">Flat / Wing</th>
                <th className="py-3.5 px-4">Passcode</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Entry / Exit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading audit log…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No visitor records matching criteria.</td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const entryTime = v.entryTime ? new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const exitTime = v.exitTime ? new Date(v.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                  return (
                    <tr key={v._id || v.visitorNumber} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{v.visitorNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{v.name}</p>
                        {v.phone && <p className="text-[10px] text-slate-400 font-mono">{v.phone}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {v.flatNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">{v.wing || '—'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">{v.passcode}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          {v.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          v.status === 'Inside' ? 'bg-blue-100 text-blue-800' :
                          v.status === 'Pre-Approved' ? 'bg-teal-100 text-teal-800' :
                          v.status === 'Exited' ? 'bg-slate-100 text-slate-600' :
                          v.status === 'Pending Approval' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {v.status === 'Inside' ? (
                          <span className="text-emerald-700 font-bold">In: {entryTime}</span>
                        ) : v.status === 'Exited' ? (
                          <span>In: {entryTime} • Out: {exitTime}</span>
                        ) : (
                          <span className="text-slate-400">Not arrived</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Provision Security Guard */}
      {showGuardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Security Guard</h3>
                  <p className="text-[11px] text-slate-500">Provision Gate Console login credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuardModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProvisionGuard} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Guard Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Singh"
                  value={guardForm.name}
                  onChange={(e) => setGuardForm({ ...guardForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="guard@society.com"
                    value={guardForm.email}
                    onChange={(e) => setGuardForm({ ...guardForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98XXX XXXXX"
                    value={guardForm.phone}
                    onChange={(e) => setGuardForm({ ...guardForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gate Post Assignment</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Gate 1"
                    value={guardForm.gatePost}
                    onChange={(e) => setGuardForm({ ...guardForm, gatePost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge / Guard ID</label>
                  <input
                    type="text"
                    placeholder="e.g. SEC-101"
                    value={guardForm.badgeNumber}
                    onChange={(e) => setGuardForm({ ...guardForm, badgeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={guardForm.password}
                  onChange={(e) => setGuardForm({ ...guardForm, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Guard logs in with this password at the unified login page.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGuardModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGuard}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingGuard && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Provision Guard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
