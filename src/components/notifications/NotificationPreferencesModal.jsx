import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  Volume2,
  VolumeX,
  Bell,
  QrCode,
  Wrench,
  Package,
  Megaphone,
  CheckCircle2,
  Play,
  X
} from 'lucide-react';

export const NotificationPreferencesModal = ({ onClose }) => {
  const { preferences, savePreferences, playTestTone } = useSocket();
  const [form, setForm] = useState({ ...preferences });
  const [savedFeedback, setSavedFeedback] = useState(false);

  const toggle = (key) => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    savePreferences(form);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Notification Settings</h3>
              <p className="text-xs text-teal-200">Audio chimes & event preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preferences Form */}
        <div className="p-5 space-y-4 text-xs">
          
          {/* Sound Synthesizer Section */}
          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {form.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-teal-700" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <p className="font-bold text-slate-900 text-sm">Synthesized Audio Chimes</p>
                  <p className="text-[11px] text-slate-500">Zero-latency browser Web Audio cues</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={form.soundEnabled}
                onChange={() => toggle('soundEnabled')}
                className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
              />
            </div>

            {form.soundEnabled && (
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => playTestTone('gate')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 hover:border-teal-400 rounded-xl text-[11px] font-semibold text-teal-800 transition shadow-2xs"
                >
                  <Play className="w-3 h-3 text-teal-600" /> Test Gate Bell
                </button>
                <button
                  type="button"
                  onClick={() => playTestTone('chime')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 hover:border-teal-400 rounded-xl text-[11px] font-semibold text-teal-800 transition shadow-2xs"
                >
                  <Play className="w-3 h-3 text-teal-600" /> Test Chime
                </button>
              </div>
            )}
          </div>

          {/* Event Categories */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Notify me about:
            </p>

            {[
              { key: 'visitorAlerts', label: 'Visitor & Guest Arrivals', desc: 'Instant gate pass verification & arrival popups', icon: QrCode, color: 'text-amber-600' },
              { key: 'deliveryAlerts', label: 'Delivery Arrivals', desc: 'Courier packages waiting at Main Gate Post', icon: Package, color: 'text-emerald-600' },
              { key: 'complaintAlerts', label: 'Maintenance Workflows', desc: 'Vendor assignments, visits, and status updates', icon: Wrench, color: 'text-teal-600' },
              { key: 'noticeAlerts', label: 'Notice Board Broadcasts', desc: 'Urgent announcements and society circulars', icon: Megaphone, color: 'text-indigo-600' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-100 ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={form[item.key]}
                    onChange={() => toggle(item.key)}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                </label>
              );
            })}
          </div>

          {savedFeedback && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
