import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Calendar,
  Clock,
  Car,
  Home,
  ShieldCheck,
  User,
  XCircle,
  ExternalLink,
  Printer
} from 'lucide-react';

export const VisitorPassCard = ({ pass, onRevoke, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!pass) return null;

  const qrPayload = JSON.stringify({
    passId: pass.visitorNumber,
    code: pass.passcode,
    flat: pass.flatNumber,
    guest: pass.name,
  });

  const handleCopyPasscode = () => {
    navigator.clipboard?.writeText(pass.passcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const text = `Nivasa Gate Pass for ${pass.name} | Flat ${pass.flatNumber} | Gate PIN: ${pass.passcode} | Status: Pre-Approved`;
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*Nivasa Smart Gate Pass*\n` +
      `Hello ${pass.name}, your visitor pass for Flat ${pass.flatNumber} is ready!\n\n` +
      `🔑 *Gate Passcode:* ${pass.passcode}\n` +
      `📍 *Destination:* Flat ${pass.flatNumber}, ${pass.wing || ''}\n` +
      `👤 *Host:* ${pass.hostResidentName || 'Resident'}\n` +
      `🚗 *Vehicle:* ${pass.vehicleNumber || 'None'}\n` +
      `🕒 *Validity:* ${new Date(pass.expectedDate || Date.now()).toLocaleDateString()} (${pass.expectedTimeSlot || 'Anytime'})\n\n` +
      `Show this code or QR at the security gate for fast entry!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const statusColors = {
    'Pre-Approved': 'bg-teal-50 text-teal-800 border-teal-200',
    'Pending Approval': 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse',
    'Approved': 'bg-emerald-50 text-emerald-800 border-emerald-200',
    'Inside': 'bg-blue-50 text-blue-800 border-blue-200',
    'Exited': 'bg-slate-100 text-slate-700 border-slate-200',
    'Revoked': 'bg-rose-50 text-rose-800 border-rose-200',
    'Rejected': 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 shadow-2xl border border-teal-500/30 max-w-md w-full mx-auto relative overflow-hidden">
      
      {/* Background Glow Accent */}
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shadow-teal-900/40">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white font-display">
              Nivasa Gate Pass
            </h3>
            <p className="text-[10px] text-teal-300 font-mono tracking-wider uppercase">
              {pass.visitorNumber}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[pass.status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
          {pass.status}
        </span>
      </div>

      {/* Guest & Destination Info */}
      <div className="space-y-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Visitor / Guest
          </p>
          <p className="text-xl font-bold font-display text-white mt-0.5">
            {pass.name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
            <span>{pass.phone}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-medium text-[11px]">
              {pass.type || 'Guest'}
            </span>
            {pass.vehicleNumber && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Car className="w-3 h-3 text-slate-400" />
                  {pass.vehicleNumber}
                </span>
              </>
            )}
          </div>
        </div>

        {/* QR Code Centerpiece */}
        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-lg my-3 border border-slate-200">
          <div className="p-2 bg-white rounded-xl">
            <QRCodeSVG
              value={qrPayload}
              size={170}
              level="H"
              includeMargin={false}
              fgColor="#042f2e"
            />
          </div>
          <p className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1">
            <QrCode className="w-3.5 h-3.5 text-teal-700" />
            Scan at gate for instant barrier clearance
          </p>
        </div>

        {/* 6-Digit Passcode Display */}
        <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 text-center">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
            Or Provide 6-Digit Gate Code
          </p>
          <div className="flex items-center justify-center gap-2 font-mono text-2xl font-black text-amber-300 tracking-widest">
            {pass.passcode.split('').map((char, idx) => (
              <span
                key={idx}
                className="w-8 h-10 bg-slate-900 rounded-lg flex items-center justify-center border border-amber-500/40 shadow-inner"
              >
                {char}
              </span>
            ))}
          </div>

          <button
            onClick={handleCopyPasscode}
            className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 hover:text-teal-200 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Passcode Copied!' : 'Copy 6-Digit PIN'}
          </button>
        </div>

        {/* Visit Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Home className="w-3 h-3 text-teal-400" />
              <span className="text-[10px] uppercase font-bold">Destination</span>
            </div>
            <p className="font-bold text-white font-mono">{pass.flatNumber}</p>
            <p className="text-[10px] text-slate-400">{pass.wing || 'Wing B'}</p>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <User className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] uppercase font-bold">Host</span>
            </div>
            <p className="font-semibold text-white truncate">{pass.hostResidentName || 'Resident'}</p>
            <p className="text-[10px] text-slate-400">{pass.expectedTimeSlot || 'Anytime'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="w-full sm:flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share via WhatsApp
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full sm:flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied Details' : 'Copy Text'}
          </button>

          {onRevoke && pass.status === 'Pre-Approved' && (
            <button
              onClick={() => onRevoke(pass._id || pass.visitorNumber)}
              className="p-2.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs transition"
              title="Revoke Pass"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-slate-400 hover:text-white pt-1 transition"
          >
            Close Pass View
          </button>
        )}
      </div>
    </div>
  );
};
