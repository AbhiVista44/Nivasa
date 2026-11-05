import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 2200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password. Please verify your current password.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full max-h-[90vh] overflow-y-auto relative my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <KeyRound className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-base font-display text-white leading-tight">
                Change Password
              </h3>
              <p className="text-xs text-teal-200/90 mt-0.5">
                Update your account login security
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6">
          {success ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 font-display">
                Password Changed Successfully!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your new password is now active. Use it the next time you log into Nivasa.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-950">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Resident Password Update</span>
                </div>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  You can replace the initial password assigned by your society admin during registration with your own personal password.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password (set by admin)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Update Password
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

