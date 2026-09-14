import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Briefcase,
  Phone,
  Star,
  StarOff,
  Shield,
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Tag,
  BadgeCheck,
  MessageSquare,
} from 'lucide-react';

// ——————————————————————————
// Config
// ——————————————————————————
const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Civil', 'Carpentry', 'Pest Control', 'Cleaning', 'Painting', 'Appliance Repair', 'Other'];

const CATEGORY_CONFIG = {
  Plumbing:         { color: 'bg-blue-100 text-blue-800 border-blue-200',   icon: '🔧' },
  Electrical:       { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '⚡' },
  Civil:            { color: 'bg-stone-100 text-stone-800 border-stone-200', icon: '🏗️' },
  Carpentry:        { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🪵' },
  'Pest Control':   { color: 'bg-green-100 text-green-800 border-green-200', icon: '🪲' },
  Cleaning:         { color: 'bg-teal-100 text-teal-800 border-teal-200',    icon: '🧹' },
  Painting:         { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🎨' },
  'Appliance Repair':{ color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: '🔌' },
  Other:            { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🛠️' },
};

// ——————————————————————————
// Star Rating Display
// ——————————————————————————
function StarRating({ score, max = 5, size = 'sm' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < Math.round(score) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
        />
      ))}
    </div>
  );
}

// ——————————————————————————
// Interactive Star Picker
// ——————————————————————————
function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-7 h-7 ${s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
          />
        </button>
      ))}
    </div>
  );
}

// ——————————————————————————
// Rate Vendor Modal
// ——————————————————————————
function RateModal({ vendor, onClose, onSubmit }) {
  const [score, setScore] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!score) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({ score, review });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to submit rating.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-5 rounded-t-3xl text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">Rate & Review</p>
            <h3 className="font-bold text-base mt-0.5">{vendor.name}</h3>
            <p className="text-xs opacity-70">{vendor.businessName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">Your Rating *</p>
            <StarPicker value={score} onChange={setScore} />
            {score > 0 && (
              <p className="mt-2 text-sm text-amber-700 font-semibold">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][score]}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-1 block">Review (optional)</label>
            <textarea
              value={review}
              onChange={e => setReview(e.target.value)}
              rows={3}
              placeholder="Share your experience with this vendor..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-medium rounded-2xl hover:bg-slate-50 transition">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !score}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-bold rounded-2xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
              Submit Rating
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————
// Add/Edit Vendor Modal
// ——————————————————————————
function VendorFormModal({ vendor, onClose, onSave }) {
  const isEdit = Boolean(vendor?._id);
  const [form, setForm] = useState({
    name: vendor?.name || '',
    businessName: vendor?.businessName || '',
    category: vendor?.category || 'Plumbing',
    phone: vendor?.phone || '',
    emergencyPhone: vendor?.emergencyPhone || '',
    email: vendor?.email || '',
    description: vendor?.description || '',
    licenseNumber: vendor?.licenseNumber || '',
    serviceAreas: vendor?.serviceAreas?.join(', ') || 'Wing A, Wing B, Wing C',
    tags: vendor?.tags?.join(', ') || '',
    isEmergencyContact: vendor?.isEmergencyContact || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.category || !form.phone) { setError('Name, category, and phone are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSave({
        ...form,
        serviceAreas: form.serviceAreas.split(',').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
        emergencyPhone: form.emergencyPhone || null,
        email: form.email || null,
        licenseNumber: form.licenseNumber || null,
      });
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save vendor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 p-5 rounded-t-3xl text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Vendor Directory</p>
            <h3 className="font-bold text-base mt-0.5">{isEdit ? 'Edit Vendor' : 'Add New Vendor'}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Vendor Name *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sunil Kumar" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Business Name</label>
              <input value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Apex Plumbing Solutions" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Phone *</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98XXX XXXXX" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Emergency Phone</label>
              <input value={form.emergencyPhone} onChange={e => set('emergencyPhone', e.target.value)} placeholder="24/7 line" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="vendor@email.com" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Brief description of services..." className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">License No.</label>
              <input value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="Optional" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Service Areas</label>
              <input value={form.serviceAreas} onChange={e => set('serviceAreas', e.target.value)} placeholder="Wing A, Wing B, Wing C" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 mb-1 block">Tags (comma-separated)</label>
              <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Leak Repair, Pipeline, Fittings" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-teal-300 transition">
            <input
              type="checkbox"
              checked={form.isEmergencyContact}
              onChange={e => set('isEmergencyContact', e.target.checked)}
              className="w-4 h-4 accent-teal-600"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">Emergency Contact</p>
              <p className="text-xs text-slate-500">Vendor will appear in the Emergency Contacts section</p>
            </div>
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-medium rounded-2xl hover:bg-slate-50 transition">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-teal-700 to-teal-800 text-white text-sm font-bold rounded-2xl hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Add Vendor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ——————————————————————————
// Vendor Card
// ——————————————————————————
function VendorCard({ vendor, isAdmin, onRate, onEdit, onToggleStatus }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORY_CONFIG[vendor.category] || CATEGORY_CONFIG.Other;
  const isInactive = vendor.status === 'inactive';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden ${isInactive ? 'border-slate-200 opacity-70' : 'border-slate-200 hover:border-teal-200'}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg flex-shrink-0 ${cfg.color}`}>
            {cfg.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm truncate">{vendor.name}</h3>
              {vendor.isEmergencyContact && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5" /> Emergency
                </span>
              )}
              {isInactive && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  Inactive
                </span>
              )}
            </div>
            {vendor.businessName && (
              <p className="text-xs text-slate-500 truncate">{vendor.businessName}</p>
            )}

            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <StarRating score={vendor.avgRating || 0} />
                <span className="text-xs text-slate-600 font-semibold">
                  {vendor.avgRating ? vendor.avgRating.toFixed(1) : 'No ratings'}
                </span>
                {vendor.totalRatings > 0 && (
                  <span className="text-[10px] text-slate-400">({vendor.totalRatings})</span>
                )}
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.color}`}>
                {vendor.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <>
                <button onClick={() => onEdit?.(vendor)} className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition" title="Edit">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onToggleStatus?.(vendor)}
                  className={`p-1.5 rounded-lg transition ${isInactive ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                  title={isInactive ? 'Activate' : 'Deactivate'}
                >
                  {isInactive ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4" />}
                </button>
              </>
            )}
            {!isAdmin && !isInactive && (
              <button onClick={() => onRate?.(vendor)} className="px-2.5 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg transition flex items-center gap-1">
                <Star className="w-3 h-3" /> Rate
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick contact row */}
        <div className="flex items-center gap-3 mt-3">
          <a href={`tel:${vendor.phone}`} className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg border border-teal-200 transition">
            <Phone className="w-3 h-3" /> {vendor.phone}
          </a>
          {vendor.emergencyPhone && vendor.emergencyPhone !== vendor.phone && (
            <a href={`tel:${vendor.emergencyPhone}`} className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 transition">
              <Zap className="w-3 h-3" /> Emergency
            </a>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {vendor.description && (
            <p className="text-xs text-slate-600 leading-relaxed">{vendor.description}</p>
          )}

          {vendor.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {vendor.tags.map(tag => (
                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            {vendor.licenseNumber && (
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-teal-600" />
                <span className="font-mono">{vendor.licenseNumber}</span>
              </div>
            )}
            {vendor.serviceAreas?.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {vendor.serviceAreas.join(', ')}
              </div>
            )}
          </div>

          {/* Recent Reviews */}
          {vendor.ratings?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Resident Reviews
              </p>
              {vendor.ratings.slice(0, 3).map((r, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-2.5 text-xs border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <StarRating score={r.score} />
                    <span className="text-slate-500">Flat {r.flatNumber}</span>
                    <span className="ml-auto text-slate-400">{new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {r.review && <p className="text-slate-600 leading-snug">{r.review}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ——————————————————————————
// MAIN EXPORT
// ——————————————————————————
export const VendorDirectoryHub = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      if (search) params.search = search;
      if (isAdmin && showInactive) params.status = 'all';
      const res = await api.get('/vendors', { params });
      if (res.data.success) setVendors(res.data.vendors || []);
    } catch (e) {
      console.error('Failed to load vendors:', e);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, showInactive, isAdmin]);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleSaveVendor = async (data) => {
    if (editTarget?._id) {
      await api.put(`/vendors/${editTarget._id}`, data);
      showToast('Vendor updated.');
    } else {
      await api.post('/vendors', data);
      showToast(`${data.name} added to directory.`);
    }
    fetchVendors();
  };

  const handleToggleStatus = async (vendor) => {
    const newStatus = vendor.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/vendors/${vendor._id}/status`, { status: newStatus });
      showToast(`${vendor.name} ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
      fetchVendors();
    } catch (e) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleRate = async ({ score, review }) => {
    await api.post(`/vendors/${ratingTarget._id}/rate`, { score, review });
    showToast(`${score}-star rating submitted for ${ratingTarget.name}!`);
    fetchVendors();
  };

  const emergencyVendors = vendors.filter(v => v.isEmergencyContact && v.status === 'active');
  const displayVendors = vendors.filter(v => {
    if (!isAdmin && v.status !== 'active') return false;
    if (!showInactive && isAdmin && v.status !== 'active') return false;
    return true;
  });

  return (
    <div className="space-y-5 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-teal-700'
        }`}>
          <Briefcase className="w-5 h-5" /> {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white border border-teal-700 shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-1">Society Services</p>
            <h2 className="text-xl font-bold">Approved Vendor Directory</h2>
            <p className="text-teal-200 text-sm mt-1">Society-vetted service providers with resident ratings & reviews</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchVendors} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={() => { setEditTarget(null); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl text-sm shadow-md transition"
              >
                <Plus className="w-4 h-4" /> Add Vendor
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Contacts Quick Access */}
      {emergencyVendors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-red-800">Emergency Contacts</h3>
            <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full">24/7</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {emergencyVendors.map(v => (
              <a
                key={v._id}
                href={`tel:${v.emergencyPhone || v.phone}`}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 hover:border-red-400 rounded-xl text-xs font-semibold text-red-800 transition shadow-sm hover:shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{v.name}</span>
                <span className="text-red-600 font-mono">{v.emergencyPhone || v.phone}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors, services, tags..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {isAdmin && (
          <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 text-xs font-semibold text-slate-600 transition">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="accent-teal-600"
            />
            Show Inactive
          </label>
        )}
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              activeCategory === cat
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            {cat !== 'All' && <span>{CATEGORY_CONFIG[cat]?.icon}</span>}
            {cat}
          </button>
        ))}
      </div>

      {/* Vendor Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : displayVendors.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
          <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">No vendors found.</p>
          {isAdmin && (
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="mt-4 px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-xl hover:bg-teal-800 transition"
            >
              Add First Vendor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayVendors.map(vendor => (
            <VendorCard
              key={vendor._id}
              vendor={vendor}
              isAdmin={isAdmin}
              onRate={setRatingTarget}
              onEdit={(v) => { setEditTarget(v); setShowForm(true); }}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Rate Modal */}
      {ratingTarget && (
        <RateModal
          vendor={ratingTarget}
          onClose={() => setRatingTarget(null)}
          onSubmit={handleRate}
        />
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <VendorFormModal
          vendor={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSaveVendor}
        />
      )}
    </div>
  );
};
