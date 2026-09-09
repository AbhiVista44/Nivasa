import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Star,
  Award,
  CheckCircle2
} from 'lucide-react';

export const VendorProfileView = () => {
  const { user, society } = useAuth();
  const [businessName, setBusinessName] = useState(user?.businessName || 'Apex Plumbing & Sanitation Services');
  const [category, setCategory] = useState(user?.serviceCategory || 'Plumbing');
  const [phone, setPhone] = useState(user?.phone || '+91 98901 33445');
  const [hours, setHours] = useState('08:00 AM - 08:00 PM (Emergency 24/7)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
            Partner Profile
          </span>
          <h1 className="text-2xl font-bold font-display text-slate-900 tracking-tight mt-1">
            Vendor Business Profile & Ratings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your service credentials and contact availability across {society?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-2.5 px-3.5 rounded-xl">
          <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
          <div>
            <p className="text-base font-extrabold text-amber-900 leading-none">4.85 / 5.0</p>
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Top Rated Society Vendor</p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Vendor credentials and availability updated successfully!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Trade Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Service Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Plumbing">Plumbing & Sanitation</option>
                  <option value="Electrical">Electrical & Appliances</option>
                  <option value="Carpentry">Carpentry & Woodwork</option>
                  <option value="Cleaning">Deep Cleaning & Pest Control</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dispatch Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Service Hours & Response Commitment</label>
              <input
                type="text"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-teal-700" />
            <h3 className="font-bold text-slate-900 text-sm">Society Verification</h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Background Verified & KYC Complete</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Approved by Society Managing Committee</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Gate Fast-Track Access Active</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <p className="font-semibold text-slate-700">Contract Period:</p>
            <p className="text-slate-500 text-[11px] mt-0.5">April 2026 – March 2027 (Renewable)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
