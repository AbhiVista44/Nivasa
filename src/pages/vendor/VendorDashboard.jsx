import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Star,
} from 'lucide-react';
import { VendorProfileView } from '../../components/vendor/VendorProfileView';
import { VendorJobsPanel } from '../../components/complaints/VendorJobsPanel';

export const VendorDashboard = ({ activeTab }) => {
  const { user, society } = useAuth();

  const [jobs, setJobs] = useState([
    {
      id: 'CMP-104',
      title: 'Water leakage from bathroom ceiling',
      flat: 'B-402',
      resident: 'Rahul Verma',
      phone: '+91 98221 44556',
      priority: 'High (AI Suggested)',
      status: 'In Progress',
      scheduledTime: 'Today, 4:30 PM',
      category: 'Plumbing',
      notes: 'Ceiling plaster damp. Water dripping from unit B-502 above.',
    },
    {
      id: 'CMP-099',
      title: 'Main pipeline valve washer replacement',
      flat: 'A-102',
      resident: 'Sunita Mehra',
      phone: '+91 98220 33221',
      priority: 'Medium',
      status: 'Scheduled',
      scheduledTime: 'Tomorrow, 10:00 AM',
      category: 'Plumbing',
      notes: 'Low pressure in master toilet flush valve.',
    },
  ]);

  if (activeTab === 'profile') {
    return <VendorProfileView />;
  }

  if (activeTab === 'assigned-jobs' || activeTab === 'schedule' || activeTab === 'history') {
    return <VendorJobsPanel />;
  }

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
            {user?.businessName || 'Apex Plumbing & Sanitation Services'}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Lead Technician: <strong className="text-white">{user?.name}</strong> • Category: <strong className="text-amber-300 font-semibold">{user?.serviceCategory || 'Plumbing'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/80 border border-teal-700/60 p-3.5 rounded-xl">
          <div className="text-center">
            <div className="flex items-center gap-1 text-amber-400 justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
              <span className="text-base font-bold text-white">{user?.rating || 4.85}</span>
            </div>
            <p className="text-[10px] text-slate-400">Society Rating</p>
          </div>
          <div className="h-7 w-[1px] bg-slate-800" />
          <div className="text-center">
            <p className="text-base font-bold text-white font-mono">{jobs.length}</p>
            <p className="text-[10px] text-slate-400">Active Jobs</p>
          </div>
        </div>
      </div>

      {/* Active Work Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display">
              Assigned Society Jobs ({jobs.length})
            </h2>
            <p className="text-xs text-slate-500">
              Update status along the official 9-stage maintenance workflow
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-teal-300 transition space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {job.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  job.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {job.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm">{job.title}</h3>
                <p className="text-xs text-slate-600 mt-1">{job.notes}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-bold text-slate-900">Flat {job.flat} ({job.resident})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-semibold text-teal-800">{job.scheduledTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-mono">{job.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {job.status === 'Scheduled' && (
                  <button
                    onClick={() => handleUpdateStatus(job.id, 'In Progress')}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
                  >
                    Start Work (In Progress)
                  </button>
                )}

                {job.status === 'In Progress' && (
                  <button
                    onClick={() => handleUpdateStatus(job.id, 'Completed')}
                    className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-xs transition shadow-xs"
                  >
                    Mark Completed & Request Sign-off
                  </button>
                )}

                {job.status === 'Completed' && (
                  <div className="w-full py-2 bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs text-center border border-emerald-200">
                    ✓ Completed — Awaiting Resident Confirmation
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
