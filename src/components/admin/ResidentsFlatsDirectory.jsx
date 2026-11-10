import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  ShieldAlert,
  Pencil,
  Trash2,
  AlertTriangle,
  Settings2,
  Layers,
  Check,
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

  // Modals for Adding
  const [showAddWingModal, setShowAddWingModal] = useState(false);
  const [showAddFlatModal, setShowAddFlatModal] = useState(false);
  const [assignOwnerTarget, setAssignOwnerTarget] = useState(null);

  // Modals for Managing / Editing / Deleting Wings
  const [showManageWingsModal, setShowManageWingsModal] = useState(false);
  const [editingWing, setEditingWing] = useState(null);
  const [editWingForm, setEditWingForm] = useState({ name: '', totalFloors: 10, flatsPerFloor: 4 });
  const [savingEditWing, setSavingEditWing] = useState(false);
  const [deletingWing, setDeletingWing] = useState(null);
  const [deletingWingLoading, setDeletingWingLoading] = useState(false);

  // Modals for Editing / Deleting Flats
  const [editingFlat, setEditingFlat] = useState(null);
  const [editFlatForm, setEditFlatForm] = useState({
    wing: '',
    flatNumber: '',
    floor: 1,
    type: '3 BHK',
    areaSqFt: 1200,
    allocatedParkingSlot: '',
    intercomNumber: '',
    status: 'occupied',
    occupancyType: 'owner',
    residentName: '',
    residentEmail: '',
    residentPhone: '',
    unassignResident: false,
  });
  const [savingEditFlat, setSavingEditFlat] = useState(false);
  const [deletingFlat, setDeletingFlat] = useState(null);
  const [deletingFlatLoading, setDeletingFlatLoading] = useState(false);

  // Toast / Feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Form states for Add Wing
  const [wingForm, setWingForm] = useState({ name: '', totalFloors: 10, flatsPerFloor: 4 });
  const [savingWing, setSavingWing] = useState(false);

  // Form states for Add Flat
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

  // Form states for Assign Owner
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
        map.set(f.wing, { name: f.wing, totalFloors: 10, flatsPerFloor: 4 });
      }
    });
    return Array.from(map.values());
  }, [wingsList, flats]);

  // ==========================================
  // WING HANDLERS
  // ==========================================

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

  // Open Edit Wing Modal
  const openEditWingModal = (wing) => {
    setEditingWing(wing);
    setEditWingForm({
      name: wing.name || '',
      totalFloors: wing.totalFloors || 10,
      flatsPerFloor: wing.flatsPerFloor || 4,
    });
  };

  // Handle Update Wing
  const handleUpdateWing = async (e) => {
    e.preventDefault();
    if (!editWingForm.name.trim()) {
      showToast('Wing name cannot be empty.', 'error');
      return;
    }
    setSavingEditWing(true);
    try {
      const wingIdentifier = editingWing._id || encodeURIComponent(editingWing.name);
      const res = await api.put(`/societies/${society._id}/wings/${wingIdentifier}`, editWingForm);
      if (res.data.success) {
        showToast(`Wing updated to "${editWingForm.name}" successfully!`);
        setEditingWing(null);
        fetchWings();
        fetchFlats();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update wing', 'error');
    } finally {
      setSavingEditWing(false);
    }
  };

  // Handle Delete Wing
  const handleDeleteWing = async () => {
    if (!deletingWing) return;
    setDeletingWingLoading(true);
    try {
      const wingIdentifier = deletingWing._id || encodeURIComponent(deletingWing.name);
      const res = await api.delete(`/societies/${society._id}/wings/${wingIdentifier}`);
      if (res.data.success) {
        showToast(`Wing "${deletingWing.name}" deleted successfully.`);
        if (selectedWing === deletingWing.name) setSelectedWing('all');
        setDeletingWing(null);
        fetchWings();
        fetchFlats();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete wing', 'error');
    } finally {
      setDeletingWingLoading(false);
    }
  };

  // ==========================================
  // FLAT HANDLERS
  // ==========================================

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

  // Open Edit Flat Modal
  const openEditFlatModal = (flat) => {
    setEditingFlat(flat);
    setEditFlatForm({
      wing: flat.wing || (availableWings[0]?.name || ''),
      flatNumber: flat.flatNumber || '',
      floor: flat.floor || 1,
      type: flat.type || '3 BHK',
      areaSqFt: flat.areaSqFt || 1200,
      allocatedParkingSlot: flat.allocatedParkingSlot || '',
      intercomNumber: flat.intercomNumber || '',
      status: flat.status || 'occupied',
      occupancyType: flat.occupancyType || 'owner',
      residentName: flat.primaryResident?.name || '',
      residentEmail: flat.primaryResident?.email || '',
      residentPhone: flat.primaryResident?.phone || '',
      unassignResident: false,
    });
  };

  // Handle Update Flat
  const handleUpdateFlat = async (e) => {
    e.preventDefault();
    if (!editFlatForm.wing || !editFlatForm.flatNumber) {
      showToast('Wing and flat number are required.', 'error');
      return;
    }

    setSavingEditFlat(true);
    try {
      const payload = {
        wing: editFlatForm.wing,
        flatNumber: editFlatForm.flatNumber,
        floor: Number(editFlatForm.floor) || 1,
        type: editFlatForm.type,
        areaSqFt: Number(editFlatForm.areaSqFt) || 1200,
        allocatedParkingSlot: editFlatForm.allocatedParkingSlot,
        intercomNumber: editFlatForm.intercomNumber,
        status: editFlatForm.unassignResident ? 'vacant' : editFlatForm.status,
        occupancyType: editFlatForm.unassignResident ? 'vacant' : editFlatForm.occupancyType,
        unassignResident: editFlatForm.unassignResident,
      };

      if (!editFlatForm.unassignResident && editFlatForm.residentName) {
        payload.primaryResident = {
          name: editFlatForm.residentName,
          email: editFlatForm.residentEmail,
          phone: editFlatForm.residentPhone,
        };
      }

      const res = await api.put(`/flats/${editingFlat._id}`, payload);
      if (res.data.success) {
        showToast(`Flat ${res.data.flat?.flatNumber || editFlatForm.flatNumber} updated successfully!`);
        setEditingFlat(null);
        if (selectedFlat?._id === editingFlat._id) {
          setSelectedFlat(res.data.flat);
        }
        fetchFlats();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update flat', 'error');
    } finally {
      setSavingEditFlat(false);
    }
  };

  // Handle Delete Flat
  const handleDeleteFlat = async () => {
    if (!deletingFlat) return;
    setDeletingFlatLoading(true);
    try {
      const res = await api.delete(`/flats/${deletingFlat._id}`);
      if (res.data.success) {
        showToast(`Flat ${deletingFlat.flatNumber} deleted successfully.`);
        if (selectedFlat?._id === deletingFlat._id) {
          setSelectedFlat(null);
        }
        setDeletingFlat(null);
        fetchFlats();
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete flat', 'error');
    } finally {
      setDeletingFlatLoading(false);
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
          className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-2xl shadow-xl text-white text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top ${
            toast.type === 'error' ? 'bg-rose-700' : 'bg-teal-800'
          }`}
        >
          {toast.type === 'error' ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.msg}</span>
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
            Configure towers & wings, add or edit flat units, manage occupancy, and provision resident accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowManageWingsModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition border border-slate-200"
            title="Manage, edit or delete society wings"
          >
            <Settings2 className="w-4 h-4 text-teal-700" />
            Manage Wings
          </button>
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
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Dynamic Wing Filter Tabs with inline Edit & Delete options */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
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
            const isSelected = selectedWing === w.name;
            return (
              <div key={w.name} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setSelectedWing(w.name)}
                  className={`px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                    isSelected
                      ? 'bg-teal-700 text-white shadow-2xs rounded-l-lg'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg'
                  }`}
                >
                  {w.name} ({wingCount})
                </button>
                {isSelected && (
                  <div className="flex items-center bg-teal-800 rounded-r-lg pr-1.5 py-0.5 border-l border-teal-600">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditWingModal(w);
                      }}
                      className="p-1 text-teal-200 hover:text-white hover:bg-teal-700 rounded transition"
                      title={`Edit ${w.name}`}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingWing(w);
                      }}
                      className="p-1 text-teal-200 hover:text-rose-300 hover:bg-teal-700 rounded transition"
                      title={`Delete ${w.name}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
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
            const isVacant = flat.status === 'vacant';

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

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isOccupied
                            ? 'bg-emerald-100 text-emerald-800'
                            : isVacant
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {flat.status}
                      </span>

                      {/* Admin Quick Action Buttons */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditFlatModal(flat);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition"
                        title="Edit Flat Details"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingFlat(flat);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Flat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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

      {/* ================================================================= */}
      {/* MODALS RENDERED IN PORTALS (Avoid clipping & stacking context)    */}
      {/* ================================================================= */}

      {/* 1. Flat Details Modal */}
      {selectedFlat && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
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

            {/* Bottom Actions: Edit Flat, Delete Flat, Close */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = selectedFlat;
                    setSelectedFlat(null);
                    openEditFlatModal(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-xl text-xs font-bold transition"
                >
                  <Pencil className="w-3.5 h-3.5 text-teal-700" />
                  Edit Unit
                </button>
                <button
                  onClick={() => {
                    const target = selectedFlat;
                    setSelectedFlat(null);
                    setDeletingFlat(target);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Delete Unit
                </button>
              </div>
              <button
                onClick={() => setSelectedFlat(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. Modal: Add Wing */}
      {showAddWingModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
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
        </div>,
        document.body
      )}

      {/* 3. Modal: Manage Wings Directory */}
      {showManageWingsModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Manage Society Wings</h3>
                  <p className="text-[11px] text-slate-500">Edit wing specifications or delete towers</p>
                </div>
              </div>
              <button
                onClick={() => setShowManageWingsModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {availableWings.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No wings registered yet.
                </div>
              ) : (
                availableWings.map(w => {
                  const flatCount = flats.filter(f => f.wing === w.name).length;
                  return (
                    <div
                      key={w.name}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{w.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            {flatCount} Flats
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {w.totalFloors || 10} Floors • {w.flatsPerFloor || 4} Flats per floor
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setShowManageWingsModal(false);
                            openEditWingModal(w);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          <Pencil className="w-3 h-3 text-teal-700" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setShowManageWingsModal(false);
                            setDeletingWing(w);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowManageWingsModal(false);
                  setShowAddWingModal(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Another Wing
              </button>
              <button
                onClick={() => setShowManageWingsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4. Modal: Edit Wing */}
      {editingWing && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Wing — {editingWing.name}</h3>
                  <p className="text-[11px] text-slate-500">Update tower name or floor specifications</p>
                </div>
              </div>
              <button
                onClick={() => setEditingWing(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateWing} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Wing / Tower Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wing A"
                  value={editWingForm.name}
                  onChange={(e) => setEditWingForm({ ...editWingForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Note: Renaming this wing will automatically update all associated flats and resident assignments.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Floors</label>
                  <input
                    type="number"
                    min="1"
                    value={editWingForm.totalFloors}
                    onChange={(e) => setEditWingForm({ ...editWingForm, totalFloors: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Flats Per Floor</label>
                  <input
                    type="number"
                    min="1"
                    value={editWingForm.flatsPerFloor}
                    onChange={(e) => setEditWingForm({ ...editWingForm, flatsPerFloor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWing(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditWing}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingEditWing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 5. Modal: Delete Wing Confirmation */}
      {deletingWing && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Wing — {deletingWing.name}</h3>
                <p className="text-[11px] text-slate-500">Confirm wing removal</p>
              </div>
            </div>

            {(() => {
              const flatCount = flats.filter(f => f.wing === deletingWing.name).length;
              if (flatCount > 0) {
                return (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                    <p className="font-bold">Cannot Delete Active Wing!</p>
                    <p className="text-[11px] leading-relaxed">
                      <strong>{deletingWing.name}</strong> currently contains <strong>{flatCount} registered flat(s)</strong>.
                      To protect resident and building records, please delete or reassign those flats before removing this wing.
                    </p>
                  </div>
                );
              }

              return (
                <div className="text-xs text-slate-600 space-y-2">
                  <p>
                    Are you sure you want to delete <strong>{deletingWing.name}</strong>?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    This wing currently has 0 flats and can be safely removed.
                  </p>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingWing(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              {flats.filter(f => f.wing === deletingWing.name).length === 0 ? (
                <button
                  type="button"
                  onClick={handleDeleteWing}
                  disabled={deletingWingLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50"
                >
                  {deletingWingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Delete
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedWing(deletingWing.name);
                    setDeletingWing(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
                >
                  View Wing Flats
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 6. Modal: Add Flat / Unit */}
      {showAddFlatModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
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
                    <option value="Admin Suite">Admin Suite</option>
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
        </div>,
        document.body
      )}

      {/* 7. Modal: Edit Flat */}
      {editingFlat && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl text-teal-800">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Edit Flat — {editingFlat.flatNumber}
                  </h3>
                  <p className="text-[11px] text-slate-500">Update unit specifications and resident assignments</p>
                </div>
              </div>
              <button
                onClick={() => setEditingFlat(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFlat} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wing *</label>
                  <select
                    required
                    value={editFlatForm.wing}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, wing: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-semibold"
                  >
                    {availableWings.map((w) => (
                      <option key={w.name} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Flat / Unit Number *</label>
                  <input
                    type="text"
                    required
                    value={editFlatForm.flatNumber}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, flatNumber: e.target.value })}
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
                    value={editFlatForm.floor}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, floor: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={editFlatForm.type}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="Studio">Studio</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Admin Suite">Admin Suite</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Carpet Area (sq.ft)</label>
                  <input
                    type="number"
                    value={editFlatForm.areaSqFt}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, areaSqFt: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parking Slot</label>
                  <input
                    type="text"
                    value={editFlatForm.allocatedParkingSlot}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, allocatedParkingSlot: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Intercom Ext.</label>
                  <input
                    type="text"
                    value={editFlatForm.intercomNumber}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, intercomNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Occupancy Status</label>
                  <select
                    value={editFlatForm.status}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  >
                    <option value="occupied">Occupied</option>
                    <option value="vacant">Vacant</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Occupancy Type</label>
                  <select
                    value={editFlatForm.occupancyType}
                    onChange={(e) => setEditFlatForm({ ...editFlatForm, occupancyType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-slate-800"
                  >
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                    <option value="vacant">Vacant</option>
                  </select>
                </div>
              </div>

              {/* Resident Info or Unassign Option */}
              {editingFlat.primaryResident && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Primary Resident Info</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={editFlatForm.unassignResident}
                        onChange={(e) => setEditFlatForm({ ...editFlatForm, unassignResident: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <span>Unassign Resident (Make Vacant)</span>
                    </label>
                  </div>

                  {!editFlatForm.unassignResident && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Resident Name</label>
                        <input
                          type="text"
                          value={editFlatForm.residentName}
                          onChange={(e) => setEditFlatForm({ ...editFlatForm, residentName: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Phone</label>
                          <input
                            type="text"
                            value={editFlatForm.residentPhone}
                            onChange={(e) => setEditFlatForm({ ...editFlatForm, residentPhone: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">Email</label>
                          <input
                            type="email"
                            value={editFlatForm.residentEmail}
                            onChange={(e) => setEditFlatForm({ ...editFlatForm, residentEmail: e.target.value })}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFlat(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditFlat}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                >
                  {savingEditFlat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 8. Modal: Delete Flat Confirmation */}
      {deletingFlat && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delete Flat {deletingFlat.flatNumber}?
                </h3>
                <p className="text-[11px] text-slate-500">
                  {deletingFlat.wing} • Floor {deletingFlat.floor}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                Are you sure you want to remove <strong>Flat {deletingFlat.flatNumber}</strong> from the society directory? This action cannot be undone.
              </p>
              {deletingFlat.primaryResident && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-[11px]">
                  <strong>Warning:</strong> This flat is registered to resident <strong>{deletingFlat.primaryResident.name}</strong>. Deleting this flat will unbind the resident's flat assignment.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingFlat(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFlat}
                disabled={deletingFlatLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-xs disabled:opacity-50"
              >
                {deletingFlatLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 9. Modal: Assign Owner to Vacant Unit */}
      {assignOwnerTarget && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
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
        </div>,
        document.body
      )}
    </div>
  );
};
