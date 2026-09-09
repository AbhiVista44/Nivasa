import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Shield,
  Home,
  Wrench,
  Sparkles,
  ArrowRight,
  Lock,
  Mail
} from 'lucide-react';

export const LoginPage = () => {
  const { login, switchRole, loading } = useAuth();
  const [email, setEmail] = useState('resident@gulmohar.com');
  const [password, setPassword] = useState('password123');
  const [errorMsg, setErrorMsg] = useState('');

  const demoAccounts = [
    {
      role: 'admin',
      title: 'Society Admin',
      name: 'Priya Sharma',
      email: 'admin@gulmohar.com',
      badge: 'Royal Indigo',
      desc: 'Governance, complaints review, finances & audit log',
      icon: Shield,
      bg: 'hover:border-indigo-400 bg-indigo-50/30',
    },
    {
      role: 'resident',
      title: 'Society Resident',
      name: 'Rahul Verma (B-402)',
      email: 'resident@gulmohar.com',
      badge: 'Forest Emerald',
      desc: 'Raise complaints with AI, visitor passes & bookings',
      icon: Home,
      bg: 'hover:border-emerald-400 bg-emerald-50/30',
    },
    {
      role: 'security',
      title: 'Security Guard',
      name: 'Ramesh Singh (Gate 1)',
      email: 'security@gulmohar.com',
      badge: 'Gate Amber',
      desc: 'Gate console, QR scan, walk-ins & parcel logs',
      icon: Shield,
      bg: 'hover:border-amber-400 bg-amber-50/30',
    },
    {
      role: 'vendor',
      title: 'Maintenance Vendor',
      name: 'Sunil Kumar (Apex Plumbing)',
      email: 'vendor@gulmohar.com',
      badge: 'Bronze Orange',
      desc: 'Accept assigned jobs, schedule visits & close orders',
      icon: Wrench,
      bg: 'hover:border-orange-400 bg-orange-50/30',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(email, password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Decorative Ambient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 shadow-xl border border-teal-500/30 text-amber-400 mb-3">
          <Building2 className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
          Nivasa
        </h1>
        <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mt-0.5">
          Smart Residential Community Platform
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
          Centralizing everyday apartment operations with tenant isolation, real-time gate security, and AI classification.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/80">
          
          {/* Quick Demo 1-Click Role Login Bar */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Instant Demo Login (Choose Any Role)
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => switchRole(acc.role)}
                    className={`p-3.5 text-left rounded-xl border border-slate-200 transition-all hover:scale-102 hover:shadow-sm flex flex-col justify-between ${acc.bg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-4 h-4 text-teal-800" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {acc.badge}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 text-xs">{acc.title}</p>
                      <p className="text-[11px] text-teal-800 font-semibold mt-0.5">{acc.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{acc.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-teal-700">
                      <span>Launch Role</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider">
                Or Sign In With Credentials
              </span>
            </div>
          </div>

          {/* Email / Password Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                  placeholder="resident@gulmohar.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Society Portal'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
