import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Plus,
  Trash2,
  CheckCircle2
} from 'lucide-react';

export const MyFlatHub = () => {
  const { user, society } = useAuth();
  const [flatData, setFlatData] = useState(null);

  // Add Family Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('Spouse');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchFlatDetails = useCallback(async () => {
    try {
      const flatNo = user?.flatNumber || 'B-402';
      const res = await api.get(`/flats/lookup/${flatNo}`);
      if (res.data.success) {
        setFlatData(res.data.flat);
      }
    } catch (err) {
      console.error('Failed to fetch flat details:', err);
    }
  }, [user?.flatNumber, society?._id]);

  useEffect(() => {
    fetchFlatDetails();
  }, [fetchFlatDetails]);

  const handleAddFamilyMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setSubmitting(true);
    setActionMessage(null);
    try {
      const res = await api.post('/flats/family', {
        name: newMemberName.trim(),
        relation: newMemberRelation,
        phone: newMemberPhone.trim(),
      });

      if (res.data.success) {
        setActionMessage({ type: 'success', text: `${newMemberName} added successfully!` });
        setIsAddModalOpen(false);
        setNewMemberName('');
        setNewMemberPhone('');
        fetchFlatDetails();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add member.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFamilyMember = async (memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName}?`)) return;

    try {
      const res = await api.delete(`/flats/family/${encodeURIComponent(memberName)}`);
      if (res.data.success) {
        setActionMessage({ type: 'success', text: `${memberName} removed.` });
        fetchFlatDetails();
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to remove family member.' });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Notifications Banner */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Flat Overview Master Card */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="bg-amber-400 text-slate-950 font-mono font-extrabold text-sm px-3 py-1 rounded-xl shadow-xs">
                Unit {flatData?.flatNumber || user?.flatNumber || 'B-402'}
              </span>
              <span className="text-xs bg-teal-950/80 text-teal-200 px-3 py-1 rounded-xl border border-teal-700">
                {flatData?.wing || 'Wing B (Sapphire)'}
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-xl uppercase font-bold tracking-wider">
                {flatData?.occupancyType || 'Owner'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
              {society?.name || 'Gulmohar Greens Heights'}
            </h1>

            <p className="text-xs text-teal-100/90 max-w-xl">
              Floor {flatData?.floor || 4} • {flatData?.type || '3 BHK'} • {flatData?.areaSqFt || 1580} sq.ft carpet area • Sector 18, Kharadi
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-teal-600/50 space-y-2 shrink-0 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Allocated Parking:</span>
              <span className="font-mono font-bold text-amber-300">{flatData?.allocatedParkingSlot || 'P-114 (Basement 1)'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Intercom Ext:</span>
              <span className="font-mono font-bold text-white">{flatData?.intercomNumber || '2402'}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Gate Pass Code:</span>
              <span className="font-mono font-bold text-emerald-400">Active (#718902)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split: Family Members & Authorized Vehicles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Family Members Management (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Registered Family Members ({flatData?.familyMembers?.length || 0})
              </h2>
              <p className="text-xs text-slate-500">
                Authorized for digital gate passes, amenity access, and deliveries
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Primary Resident Card */}
            <div className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm">
                  {user?.name?.charAt(0) || 'R'}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{flatData?.primaryResident?.name || user?.name}</p>
                  <p className="text-slate-500 text-[11px]">{flatData?.primaryResident?.email || user?.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                  Primary Resident
                </span>
                <p className="font-mono text-slate-500 text-[11px] mt-1">{flatData?.primaryResident?.phone || user?.phone}</p>
              </div>
            </div>

            {/* Added Family Members */}
            {flatData?.familyMembers && flatData.familyMembers.map((member, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/60 transition px-1 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                    {member.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{member.name}</p>
                    <span className="bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded text-[10px]">
                      {member.relation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-600 text-xs">{member.phone || 'No phone'}</span>
                  <button
                    onClick={() => handleRemoveFamilyMember(member.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicles & Emergency Society Helpline (1 Col) */}
        <div className="space-y-6">
          
          {/* Registered Vehicles */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 font-display">
                Authorized Vehicles
              </h3>
              <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                RFID Synced
              </span>
            </div>

            <div className="space-y-2">
              {flatData?.vehicles && flatData.vehicles.length > 0 ? (
                flatData.vehicles.map((v, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{v.model}</p>
                      <p className="text-[11px] text-slate-500">{v.type}</p>
                    </div>
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                      {v.regNumber}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No vehicles registered.</p>
              )}
            </div>
          </div>

          {/* Gate & Intercom Helplines */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 font-display">
              Gate & Society Helplines
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Main Gate Security 1</span>
                <span className="font-mono font-bold text-teal-800">Ext: 1001</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Society Office Admin</span>
                <span className="font-mono font-bold text-teal-800">Ext: 1100</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Emergency Medical Care</span>
                <span className="font-mono font-bold text-rose-700">Ext: 108</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Add Family Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Add Family Member
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Verma"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Relationship *</label>
                <select
                  value={newMemberRelation}
                  onChange={(e) => setNewMemberRelation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Parent">Parent (Father / Mother)</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="Other">Other Family Member</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 98xxx xxxxx"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs"
                >
                  {submitting ? 'Adding...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
