import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Star,
  Wrench,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { VendorProfileView } from '../../components/vendor/VendorProfileView';
import { VendorJobsPanel } from '../../components/complaints/VendorJobsPanel';

export const VendorDashboard = ({ activeTab }) => {
  const { user, society } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTab || activeTab === 'overview') {
      fetchJobs();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      if (res.data.success) {
        setJobs(res.data.complaints || []);
      }
    } catch (err) {
      console.warn('Could not fetch vendor jobs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (activeTab === 'profile') return <VendorProfileView />;

  if (activeTab === 'assigned-jobs' || activeTab === 'schedule' || activeTab === 'history') {
    return <VendorJobsPanel />;
  }

  const activeJobs = jobs.filter(j => !['Closed', 'Resident Confirmed'].includes(j.status));

  return (
    <div className="space-y-6">

      {/* Vendor Profile Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-teal-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-700">
              Verified Society Vendor Partner
            </span>
            <span className="text-xs text-slate-300">
              {society?.name}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight mt-1">
            {user?.businessName || user?.name || 'Vendor Portal'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Lead Technician: <strong className="text-white">{user?.name}</strong>
            {user?.serviceCategory ? ` • Category: ` : ''}
            {user?.serviceCategory && <strong className="text-amber-300 font-semibold">{user.serviceCategory}</strong>}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 border border-teal-700/60 p-3.5 rounded-xl">
          {user?.rating && (
            <>
              <div className="text-center">
                <div className="flex items-center gap-1 text-amber-400 justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-base font-bold text-white">{user.rating}</span>
                </div>
                <p className="text-[10px] text-slate-400">Society Rating</p>
              </div>
              <div className="h-7 w-[1px] bg-slate-800" />
            </>
          )}
          <div className="text-center">
            <p className="text-base font-bold text-white font-mono">{loading ? '…' : activeJobs.length}</p>
            <p className="text-[10px] text-slate-400">Active Jobs</p>
          </div>
        </div>
      </div>

      {/* Active Work Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Assigned Society Jobs ({loading ? '…' : activeJobs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Update status along the official 9-stage maintenance workflow
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading assigned jobs...</span>
          </div>
        ) : activeJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No active jobs assigned</p>
            <p className="text-xs mt-1 max-w-xs mx-auto">
              Jobs assigned by the society admin will appear here. Check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeJobs.map((job) => (
              <div key={job._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {job.complaintNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    job.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                    job.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {job.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{job.description}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                  {job.flatNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Destination:</span>
                      <span className="font-bold text-slate-900">
                        Flat {job.flatNumber}{job.residentName ? ` (${job.residentName})` : ''}
                      </span>
                    </div>
                  )}
                  {job.scheduledVisit?.visitDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Scheduled:</span>
                      <span className="font-semibold text-teal-800">{job.scheduledVisit.visitDate} • {job.scheduledVisit.timeSlot}</span>
                    </div>
                  )}
                  {job.residentPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Contact:</span>
                      <span className="font-mono">{job.residentPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
