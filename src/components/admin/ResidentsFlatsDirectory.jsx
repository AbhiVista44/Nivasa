import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Car,
  Plus
} from 'lucide-react';

export const ResidentsFlatsDirectory = () => {
  const { society } = useAuth();
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWing, setSelectedWing] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlat, setSelectedFlat] = useState(null);

  const fetchFlats = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedWing !== 'all') params.wing = selectedWing;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/flats', { params });
      if (res.data.success) {
        setFlats(res.data.flats);
      }
    } catch (err) {
      console.error('Failed to load flats:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedWing, selectedStatus, searchQuery, society?._id]);

  useEffect(() => {
    fetchFlats();
  }, [fetchFlats]);

  const wings = [
    { id: 'all', label: 'All Wings' },
    { id: 'Wing A', label: 'Wing A (Emerald)' },
    { id: 'Wing B', label: 'Wing B (Sapphire)' },
    { id: 'Wing C', label: 'Wing C (Ruby)' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              Building Directory & Occupancy
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Tenant: {society?.code}
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight mt-1">
            Society Flats & Resident Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage unit assignments, resident verification, allocated parking, and vehicle registries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-xs">
            <Plus className="w-4 h-4" />
            Add New Unit
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
              placeholder="Search by flat (e.g. B-402), resident name, or mobile number..."
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

        {/* Wing Tabs */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 overflow-x-auto">
          {wings.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWing(w.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedWing === w.id
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flats Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs font-semibold">
          Loading society flats...
        </div>
      ) : flats.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No flats match your search or filter criteria.
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
                          : 'bg-slate-100 text-slate-600'
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
                            {flat.primaryResident.phone}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="py-2 text-slate-400 italic text-[11px]">
                        Currently unoccupied unit. Available for allocation.
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
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Registered Occupants
              </h3>

              {selectedFlat.primaryResident ? (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{selectedFlat.primaryResident.name}</p>
                      <p className="text-slate-500 text-[11px]">{selectedFlat.primaryResident.email}</p>
                    </div>
                    <span className="bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      Primary ({selectedFlat.occupancyType})
                    </span>
                  </div>
                  <p className="font-mono text-slate-700">Phone: {selectedFlat.primaryResident.phone}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No resident registered for this unit.</p>
              )}

              {/* Family Members */}
              {selectedFlat.familyMembers && selectedFlat.familyMembers.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600">Family Members ({selectedFlat.familyMembers.length}):</p>
                  <div className="space-y-1">
                    {selectedFlat.familyMembers.map((m, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
