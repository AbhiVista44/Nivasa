import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Car,
  Plus,
  Building,
  UserPlus,
  Key,
  CheckCircle2,
  X,
  Loader2,
  Home,
  UserCheck,
  Phone,
  Mail,
  ShieldAlert
} from 'lucide-react';

export const ResidentsFlatsDirectory = () => {
  const { society } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wingsList, setWingsList] = useState([]);
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlat, setSelectedFlat] = useState(null);

  // Modals
  const [showAddWingModal, setShowAddWingModal] = useState(false);
  const [showAddFlatModal, setShowAddFlatModal] = useState(false);
  const [assignOwnerTarget, setAssignOwnerTarget] = useState(null);

  // Toast / Feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form states
  const [wingForm, setWingForm] = useState({ name: '', totalFloors: 10, flatsPerFloor: 4 });
  const [savingWing, setSavingWing] = useState(false);

  const [flatForm, setFlatForm] = useState({
    wing: '',
    flatNumber: '',
    floor: 1,
    type: '3 BHK',
    areaSqFt: 1200,
    allocatedParkingSlot: '',
    intercomNumber: '',
    assignOwnerNow: false,
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: 'resident123',
  });
  const [savingFlat, setSavingFlat] = useState(false);

  const [ownerForm, setOwnerForm] = useState({
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: 'resident123',
  });
  const [savingOwner, setSavingOwner] = useState(false);

  const fetchFlats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedWing !== 'all') params.wing = selectedWing;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/flats', { params });
      if (res.data.success) {
        setFlats(res.data.flats || []);
      }
    } catch (err) {
      console.error('Failed to load flats:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWing, selectedStatus, searchQuery, society?._id]);

  const fetchWings = useCallback(async () => {
    if (!society?._id) return;
    try {
      const res = await api.get(`/societies/${society._id}/wings`);
      if (res.data.success) {
        setWingsList(res.data.wings || []);
      }
    } catch (err) {
      console.warn('Could not fetch wings:', err);
    }
  }, [society?._id]);

  useEffect(() => {
    fetchFlats();
    fetchWings();
  }, [fetchFlats, fetchWings]);

  // Aggregate wings from wingsList + flats
  const availableWings = useMemo(() => {
    const map = new Map();
    wingsList.forEach(w => {
      if (w.name) map.set(w.name, w);
    });
    flats.forEach(f => {
      if (f.wing && !map.has(f.wing)) {
        map.set(f.wing, { name: f.wing });
      }
    });
    return Array.from(map.values());
  }, [wingsList, flats]);

  // Handle Add Wing
  const handleAddWing = async (e) => {
    e.preventDefault();
    if (!wingForm.name.trim()) return;
    setSavingWing(true);
    try {
      const res = await api.post(`/societies/${society._id}/wings`, wingForm);
      if (res.data.success) {
        showToast(`Wing "${wingForm.name}" created successfully!`);
        setShowAddWingModal(false);
        setWingForm({ name: '', totalFloors: 10, flatsPerFloor: 4 });
        fetchWings();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to add wing', 'error');
    } finally {
      setSavingWing(false);
    }
  };

  // Handle Add Flat
  const handleAddFlat = async (e) => {
    e.preventDefault();
    if (!flatForm.wing || !flatForm.flatNumber) {
      showToast('Wing and flat number are required.', 'error');
      return;
    }
    if (flatForm.assignOwnerNow && (!flatForm.ownerName || !flatForm.ownerEmail)) {
      showToast('Owner name and email are required when assigning an owner.', 'error');
      return;
    }

    setSavingFlat(true);
    try {
      const payload = {
        wing: flatForm.wing,
        flatNumber: flatForm.flatNumber,
        floor: Number(flatForm.floor) || 1,
        type: flatForm.type,
        areaSqFt: Number(flatForm.areaSqFt) || 1200,
        allocatedParkingSlot: flatForm.allocatedParkingSlot,
        intercomNumber: flatForm.intercomNumber,
      };

      if (flatForm.assignOwnerNow) {
        payload.ownerName = flatForm.ownerName;
        payload.ownerEmail = flatForm.ownerEmail;
        payload.ownerPhone = flatForm.ownerPhone;
        payload.ownerPassword = flatForm.ownerPassword || 'resident123';
      }

      const res = await api.post('/flats', payload);
      if (res.data.success) {
        showToast(
          flatForm.assignOwnerNow
            ? `Flat ${flatForm.flatNumber} created & owner account provisioned!`
            : `Flat ${flatForm.flatNumber} created successfully!`
        );
        setShowAddFlatModal(false);
        setFlatForm({
          wing: availableWings[0]?.name || '',
          flatNumber: '',
          floor: 1,
          type: '3 BHK',
          areaSqFt: 1200,
          allocatedParkingSlot: '',
          intercomNumber: '',
          assignOwnerNow: false,
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          ownerPassword: 'resident123',
        });
        fetchFlats();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to create flat', 'error');
    } finally {
      setSavingFlat(false);
    }
  };

  // Handle Assign Owner to existing vacant flat
  const handleAssignOwner = async (e) => {
    e.preventDefault();
    if (!ownerForm.ownerName || !ownerForm.ownerEmail) {
      showToast('Owner name and email are required.', 'error');
      return;
    }

    setSavingOwner(true);
    try {
      const res = await api.post(`/flats/${assignOwnerTarget._id}/assign-owner`, ownerForm);
      if (res.data.success) {
        showToast(`Owner ${ownerForm.ownerName} assigned to Flat ${assignOwnerTarget.flatNumber}!`);
        setAssignOwnerTarget(null);
        setSelectedFlat(null);
        setOwnerForm({
          ownerName: '',
          ownerEmail: '',
          ownerPhone: '',
          ownerPassword: 'resident123',
        });
        fetchFlats();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to assign owner', 'error');
    } finally {
      setSavingOwner(false);
    }
  };

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

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Building Directory & Occupancy
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Tenant: {society?.code || 'N/A'}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight mt-1">
            Society Flats & Resident Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure buildings, add flat units, and provision resident login credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddWingModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200"
          >
            <Building className="w-4 h-4 text-teal-700" />
            + Add Wing
          </button>
          <button
            onClick={() => {
              if (availableWings.length > 0 && !flatForm.wing) {
                setFlatForm(f => ({ ...f, wing: availableWings[0].name }));
              }
              setShowAddFlatModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            + Add Unit
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by flat (e.g. A-101), resident name, or mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Units ({flats.length})</option>
              <option value="occupied">Occupied</option>
              <option value="vacant">Vacant</option>
            </select>
          </div>
        </div>

        {/* Dynamic Wing Filter Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setSelectedWing('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              selectedWing === 'all'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Wings ({flats.length})
          </button>
          {availableWings.map((w) => {
            const wingCount = flats.filter(f => f.wing === w.name).length;
            return (
              <button
                key={w.name}
                onClick={() => setSelectedWing(w.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  selectedWing === w.name
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {w.name} ({wingCount})
              </button>
            );
          })}
        </div>
      </div>

      {/* Flats Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-teal-700" />
          Loading society flats...
        </div>
      ) : flats.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-500 text-xs space-y-3 p-6">
          <Home className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No flats found in this directory</p>
          <p className="text-slate-400 max-w-sm mx-auto">
            Get started by adding your society wings/buildings, then create your first flat units.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowAddWingModal(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200"
            >
              + Add Wing
            </button>
            <button
              onClick={() => {
                if (availableWings.length > 0 && !flatForm.wing) {
                  setFlatForm(f => ({ ...f, wing: availableWings[0].name }));
                }
                setShowAddFlatModal(true);
              }}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              + Add Unit
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flats.map((flat) => {
            const isOccupied = flat.status === 'occupied';
            return (
              <div
                key={flat._id}
                onClick={() => setSelectedFlat(flat)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold text-slate-900 group-hover:text-teal-800 transition">
                        {flat.flatNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {flat.type}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isOccupied
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {flat.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    {flat.wing} • Floor {flat.floor} • {flat.areaSqFt} sq.ft
                  </p>

                  {/* Primary Resident Info */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    {isOccupied && flat.primaryResident ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Resident:</span>
                          <span className="font-bold text-slate-900 truncate max-w-[170px]">
                            {flat.primaryResident.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Type:</span>
                          <span className="capitalize font-semibold text-teal-800">
                            {flat.occupancyType}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Phone:</span>
                          <span className="font-mono text-slate-700">
                            {flat.primaryResident.phone || '—'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="py-2 flex items-center justify-between">
                        <span className="text-slate-400 italic text-[11px]">Unoccupied unit</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignOwnerTarget(flat);
                          }}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          Assign Owner
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer details: Parking & Intercom */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                  <div className="flex items-center gap-1 font-mono truncate max-w-[180px]">
                    <Car className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span>{flat.allocatedParkingSlot || 'Unassigned'}</span>
                  </div>
                  <span className="font-mono text-teal-800 font-bold">
                    Ext: {flat.intercomNumber || 'N/A'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat Details Modal */}
      {selectedFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                  Unit Specification
                </span>
                <h2 className="text-xl font-bold font-display text-slate-900">
                  Flat {selectedFlat.flatNumber} — {selectedFlat.wing}
                </h2>
              </div>
              <button
                onClick={() => setSelectedFlat(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div>
                <p className="text-slate-500">Floor & Area</p>
                <p className="font-bold text-slate-900">Floor {selectedFlat.floor} • {selectedFlat.areaSqFt} sq.ft</p>
              </div>
              <div>
                <p className="text-slate-500">Layout</p>
                <p className="font-bold text-slate-900">{selectedFlat.type}</p>
              </div>
              <div>
                <p className="text-slate-500">Allocated Parking</p>
                <p className="font-bold font-mono text-teal-800">{selectedFlat.allocatedParkingSlot || 'None'}</p>
              </div>
              <div>
                <p className="text-slate-500">Intercom Ext.</p>
                <p className="font-bold font-mono text-slate-900">{selectedFlat.intercomNumber || 'None'}</p>
              </div>
            </div>

            {/* Resident & Family Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Registered Occupants
                </h3>
                {selectedFlat.status === 'vacant' && (
                  <button
                    onClick={() => {
                      setAssignOwnerTarget(selectedFlat);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Owner Now
                  </button>
                )}
              </div>

              {selectedFlat.primaryResident ? (
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{selectedFlat.primaryResident.name}</p>
                      <p className="text-slate-500 text-[11px]">{selectedFlat.primaryResident.email}</p>
                    </div>
                    <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      Primary ({selectedFlat.occupancyType})
                    </span>
                  </div>
                  <p className="font-mono text-slate-700">Phone: {selectedFlat.primaryResident.phone || '—'}</p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">No resident registered for this unit.</p>
                  <button
                    onClick={() => setAssignOwnerTarget(selectedFlat)}
                    className="px-3 py-1.5 bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-teal-700 transition"
                  >
                    + Provision Flat Owner
                  </button>
                </div>
              )}

              {/* Family Members */}
              {selectedFlat.familyMembers && selectedFlat.familyMembers.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-bold text-slate-600">Family Members ({selectedFlat.familyMembers.length}):</p>
                  <div className="space-y-1">
                    {selectedFlat.familyMembers.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{m.name} ({m.relation})</span>
                        <span className="font-mono text-slate-500">{m.phone || 'No phone'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registered Vehicles */}
              {selectedFlat.vehicles && selectedFlat.vehicles.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-bold text-slate-600">Authorized Vehicles:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedFlat.vehicles.map((v, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[11px] rounded-lg font-bold flex items-center gap-1">
                        <Car className="w-3 h-3 text-amber-700" />
                        {v.model} ({v.regNumber})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedFlat(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Wing */}
      {showAddWingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Society Wing</h3>
                  <p className="text-[11px] text-slate-500">Register a new tower or building wing</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddWingModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddWing} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Wing / Tower Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wing A, Tower 1, Sapphire Block"
                  value={wingForm.name}
                  onChange={(e) => setWingForm({ ...wingForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 14"
                    value={wingForm.totalFloors}
                    onChange={(e) => setWingForm({ ...wingForm, totalFloors: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Flats Per Floor</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 4"
                    value={wingForm.flatsPerFloor}
                    onChange={(e) => setWingForm({ ...wingForm, flatsPerFloor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddWingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingWing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Wing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Flat / Unit */}
      {showAddFlatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Flat / Unit</h3>
                  <p className="text-[11px] text-slate-500">Configure unit specs & optionally invite flat owner</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddFlatModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddFlat} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wing *</label>
                  {availableWings.length > 0 ? (
                    <select
                      required
                      value={flatForm.wing}
                      onChange={(e) => setFlatForm({ ...flatForm, wing: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                    >
                      <option value="">Select Wing</option>
                      {availableWings.map((w) => (
                        <option key={w.name} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wing A"
                      value={flatForm.wing}
                      onChange={(e) => setFlatForm({ ...flatForm, wing: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                    />
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Flat / Unit Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={flatForm.flatNumber}
                    onChange={(e) => setFlatForm({ ...flatForm, flatNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Floor *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 1"
                    value={flatForm.floor}
                    onChange={(e) => setFlatForm({ ...flatForm, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={flatForm.type}
                    onChange={(e) => setFlatForm({ ...flatForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="Studio">Studio</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Carpet Area (sq.ft)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1050"
                    value={flatForm.areaSqFt}
                    onChange={(e) => setFlatForm({ ...flatForm, areaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parking Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. P-101 (Basement 1)"
                    value={flatForm.allocatedParkingSlot}
                    onChange={(e) => setFlatForm({ ...flatForm, allocatedParkingSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intercom Ext.</label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={flatForm.intercomNumber}
                    onChange={(e) => setFlatForm({ ...flatForm, intercomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Owner Provisioning Section */}
              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                  <input
                    type="checkbox"
                    checked={flatForm.assignOwnerNow}
                    onChange={(e) => setFlatForm({ ...flatForm, assignOwnerNow: e.target.checked })}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600"
                  />
                  <span className="font-bold text-slate-900">
                    Assign / Invite Flat Owner Now
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 pl-6">
                  Creates a verified resident account so the owner can immediately log in to the portal.
                </p>

                {flatForm.assignOwnerNow && (
                  <div className="mt-3 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3 animate-in fade-in">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Owner Full Name *</label>
                      <input
                        type="text"
                        required={flatForm.assignOwnerNow}
                        placeholder="e.g. Anand Deshmukh"
                        value={flatForm.ownerName}
                        onChange={(e) => setFlatForm({ ...flatForm, ownerName: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                        <input
                          type="email"
                          required={flatForm.assignOwnerNow}
                          placeholder="e.g. anand.deshmukh@gmail.com"
                          value={flatForm.ownerEmail}
                          onChange={(e) => setFlatForm({ ...flatForm, ownerEmail: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98220 12345"
                          value={flatForm.ownerPhone}
                          onChange={(e) => setFlatForm({ ...flatForm, ownerPhone: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                      <input
                        type="text"
                        required={flatForm.assignOwnerNow}
                        placeholder="Temporary login password (min. 6 chars)"
                        value={flatForm.ownerPassword}
                        onChange={(e) => setFlatForm({ ...flatForm, ownerPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Owner will use this to sign in.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFlatModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFlat}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingFlat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Owner to Vacant Unit */}
      {assignOwnerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Assign Owner — Flat {assignOwnerTarget.flatNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Provision login credentials for {assignOwnerTarget.wing}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignOwnerTarget(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignOwner} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={ownerForm.ownerName}
                  onChange={(e) => setOwnerForm({ ...ownerForm, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh.kulkarni@gmail.com"
                  value={ownerForm.ownerEmail}
                  onChange={(e) => setOwnerForm({ ...ownerForm, ownerEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98220 54321"
                  value={ownerForm.ownerPhone}
                  onChange={(e) => setOwnerForm({ ...ownerForm, ownerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  placeholder="Temporary login password (min. 6 chars)"
                  value={ownerForm.ownerPassword}
                  onChange={(e) => setOwnerForm({ ...ownerForm, ownerPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Owner uses this password to log in.</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignOwnerTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOwner}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingOwner && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Assign & Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
