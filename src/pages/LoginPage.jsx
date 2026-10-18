import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const generateUniqueSocietyCode = (name = '') => {
  const clean = (name || '').trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);

  let prefix = '';
  if (words.length >= 2) {
    prefix = words.map(w => w[0].toUpperCase()).slice(0, 4).join('');
  } else if (words.length === 1 && words[0].length >= 3) {
    prefix = words[0].slice(0, 3).toUpperCase();
  } else {
    prefix = 'NIV';
  }
  prefix = prefix.replace(/[^A-Z0-9]/g, '') || 'NIV';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomSuffix}`;
};

export const LoginPage = () => {
  const { login, registerSociety, loading, societies } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register-society'

  // If no societies exist in database, default to onboarding registration
  React.useEffect(() => {
    if (Array.isArray(societies) && societies.length === 0) {
      setActiveTab('register-society');
    }
  }, [societies]);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Society form state
  const [societyName, setSocietyName] = useState('');
  const [societyCode, setSocietyCode] = useState(() => generateUniqueSocietyCode(''));
  const [isCodeCustomized, setIsCodeCustomized] = useState(false);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSocietyNameChange = (val) => {
    setSocietyName(val);
    if (!isCodeCustomized) {
      setSocietyCode(generateUniqueSocietyCode(val));
    }
  };

  const handleRegenerateCode = () => {
    const newCode = generateUniqueSocietyCode(societyName);
    setSocietyCode(newCode);
    setIsCodeCustomized(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const res = await login(email.trim(), password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  const handleRegisterSocietySubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!societyName.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword) {
      setErrorMsg('Please fill in all mandatory fields (marked with *).');
      return;
    }

    const resolvedCode = (societyCode || '').trim() || generateUniqueSocietyCode(societyName);
    const cleanCode = resolvedCode.replace(/\s*-\s*/g, '-').replace(/\s+/g, '-').toUpperCase();
    const cleanCity = city.trim() || 'Pune';
    const cleanAddress = address.trim() || (cleanCity ? `${cleanCity}, India` : 'Residential Society');
    const cleanPincode = pincode.trim() || '411014';

    const res = await registerSociety({
      societyName: societyName.trim(),
      societyCode: cleanCode,
      city: cleanCity,
      address: cleanAddress,
      pincode: cleanPincode,
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      adminPhone: adminPhone.trim(),
      adminPassword,
    });

    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 shadow-xl border border-teal-500/30 text-amber-400 mb-3">
          <Building2 className="w-8 h-8 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
          Nivasa
        </h1>
        <p className="text-xs font-semibold text-teal-400 uppercase tracking-widest mt-0.5">
          Residential Community OS
        </p>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
          Multi-tenant society governance, real-time gate security, resident management, and maintenance workflows.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-200/80">
          
          {/* Navigation Mode Switcher */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Sign In to Account
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register-society');
                setErrorMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'register-society'
                  ? 'bg-white text-teal-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Register Society & Admin
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                    placeholder="e.g. admin@nivasa.com or resident@society.org"
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
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                    placeholder="Enter your registered account password"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500 pt-2">
                Role-specific portal access (Society Admin, Flat Owner / Resident, Gate Security, Maintenance Vendor).
              </p>
            </form>
          )}

          {/* 2. REGISTER SOCIETY & ADMIN FORM */}
          {activeTab === 'register-society' && (
            <form onSubmit={handleRegisterSocietySubmit} className="space-y-4">
              <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-200/60 mb-2">
                <p className="text-xs font-bold text-teal-900">New Society Onboarding</p>
                <p className="text-[11px] text-teal-700">
                  Register your residential society to create the master Society Admin account and configure wings, flats, and residents.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Society Information</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Society Name *</label>
                    <input
                      type="text"
                      required
                      value={societyName}
                      onChange={(e) => handleSocietyNameChange(e.target.value)}
                      placeholder="e.g. Emerald Heights Co-operative Housing Society"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>Society Code</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="w-2.5 h-2.5" /> Auto-Generated
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateCode}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition cursor-pointer"
                        title="Generate a new unique society code"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={societyCode}
                        onChange={(e) => {
                          setIsCodeCustomized(true);
                          setSocietyCode(e.target.value.toUpperCase());
                        }}
                        placeholder="Auto-generated e.g. EHC-8421"
                        className="w-full px-3 py-2 text-xs font-mono font-bold uppercase bg-slate-50 border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden text-teal-900 tracking-wider shadow-inner"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Unique society identifier automatically assigned. You can keep it or customize.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Pune, Mumbai, Bengaluru"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pincode <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 411014 (6-digit PIN)"
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Society Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Survey No. 42/1, Baner-Pashan Link Road, Baner"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-200">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Primary Administrator Account</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Full Name *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Rajesh K. Sharma"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Phone</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        placeholder="e.g. +91 98230 45678"
                        className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Email *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. rajesh.sharma@emeraldheights.in"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Admin Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Min. 8 characters (e.g. SecurePass#2026)"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Setting up Society...' : 'Complete Registration & Open Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
