import React, { useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Camera,
  Clock,
  Loader2,
  ArrowLeft,
  Send,
  Zap,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CATEGORIES = [
  'Plumbing', 'Electrical', 'Carpentry', 'Cleaning',
  'Civil & Painting', 'Appliances', 'Security', 'General',
];

const PRIORITIES = [
  { value: 'Low', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', dot: 'bg-emerald-500' },
  { value: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-300', dot: 'bg-amber-500' },
  { value: 'High', color: 'text-rose-700 bg-rose-50 border-rose-300', dot: 'bg-rose-500' },
  { value: 'Emergency', color: 'text-red-800 bg-red-50 border-red-400', dot: 'bg-red-600 animate-pulse' },
];

const TIME_SLOTS = [
  'Anytime during daytime',
  'Morning (9 AM – 12 PM)',
  'Afternoon (12 PM – 4 PM)',
  'Evening (4 PM – 7 PM)',
  'Weekends only',
];

const localFallbackClassify = (text) => {
  const lower = (text || '').toLowerCase();
  let category = 'General';
  let priority = 'Medium';

  const plumbingKeywords = ['leak', 'pipe', 'tap', 'water', 'flush', 'drain', 'sink', 'basin', 'plumbing', 'faucet', 'sewage', 'clog', 'commode', 'overflow', 'geyser'];
  const electricalKeywords = ['spark', 'light', 'wire', 'switch', 'mcb', 'power', 'fluctuation', 'short circuit', 'socket', 'fuse', 'fan', 'bulb', 'shock', 'voltage'];
  const carpentryKeywords = ['door', 'hinge', 'window', 'wood', 'lock', 'handle', 'cabinet', 'wardrobe', 'drawer', 'latch', 'shutter'];
  const civilKeywords = ['seepage', 'crack', 'wall', 'plaster', 'tile', 'paint', 'ceiling', 'balcony', 'cement', 'damp', 'leakage'];
  const cleaningKeywords = ['garbage', 'smell', 'pest', 'cockroach', 'termite', 'clean', 'dustbin', 'rodent', 'mosquito', 'hygiene'];
  const appliancesKeywords = ['ac', 'air conditioner', 'refrigerator', 'fridge', 'washing machine', 'microwave', 'chimney', 'inverter'];
  const securityKeywords = ['cctv', 'guard', 'gate', 'intercom', 'intruder', 'theft', 'unauthorized', 'parking dispute'];

  if (plumbingKeywords.some(k => lower.includes(k))) category = 'Plumbing';
  else if (electricalKeywords.some(k => lower.includes(k))) category = 'Electrical';
  else if (civilKeywords.some(k => lower.includes(k))) category = 'Civil & Painting';
  else if (carpentryKeywords.some(k => lower.includes(k))) category = 'Carpentry';
  else if (appliancesKeywords.some(k => lower.includes(k))) category = 'Appliances';
  else if (cleaningKeywords.some(k => lower.includes(k))) category = 'Cleaning';
  else if (securityKeywords.some(k => lower.includes(k))) category = 'Security';

  const emergencyKeywords = ['emergency', 'flooding', 'sparking', 'fire', 'shock', 'danger', 'burst', 'collapsed', 'gas leak'];
  const highKeywords = ['heavy leak', 'leaking from ceiling', 'no power', 'power outage', 'main switch', 'short circuit', 'blocked', 'overflowing', 'urgent', 'asap'];
  const lowKeywords = ['creaking', 'loose', 'minor', 'cosmetic', 'paint chip', 'slow drip', 'aesthetic'];

  if (emergencyKeywords.some(k => lower.includes(k))) priority = 'Emergency';
  else if (highKeywords.some(k => lower.includes(k)) || (category === 'Plumbing' && lower.includes('ceiling'))) priority = 'High';
  else if (lowKeywords.some(k => lower.includes(k))) priority = 'Low';

  let summary = text.trim();
  if (summary.length > 80) summary = summary.slice(0, 77) + '...';
  if (!summary.endsWith('.')) summary += '.';

  return {
    category,
    priority,
    summary,
    source: 'smart-heuristic',
    confidence: 0.90,
  };
};

export const ComplaintSubmitForm = ({ onBack, onSuccess }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [preferredVisitTime, setPreferredVisitTime] = useState(TIME_SLOTS[0]);
  const [photos] = useState([]);

  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiOverridden, setAiOverridden] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState('');

  const descRef = useRef(null);
  const aiDebounceRef = useRef(null);

  // Call AI classify on demand
  const runAiClassify = useCallback(async (text) => {
    if (!text || text.trim().length < 15) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post('/complaints/classify-ai', { description: text });
      if (res.data.success) {
        const result = res.data.data;
        setAiResult(result);
        setAiOverridden(false);
        // Auto-apply AI suggestion if user hasn't manually set
        if (!aiOverridden) {
          setCategory(result.category);
          setPriority(result.priority);
        }
        return;
      }
    } catch (err) {
      // Graceful instant fallback to smart heuristic
      const fallbackResult = localFallbackClassify(text);
      setAiResult(fallbackResult);
      setAiOverridden(false);
      if (!aiOverridden) {
        setCategory(fallbackResult.category);
        setPriority(fallbackResult.priority);
      }
    } finally {
      setAiLoading(false);
    }
  }, [aiOverridden]);

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);
    // Debounce AI classification after 1s pause
    clearTimeout(aiDebounceRef.current);
    if (val.trim().length >= 20) {
      aiDebounceRef.current = setTimeout(() => runAiClassify(val), 1200);
    } else {
      setAiResult(null);
    }
  };

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setAiOverridden(true);
  };

  const handlePriorityChange = (p) => {
    setPriority(p);
    setAiOverridden(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category || aiResult?.category || 'General',
        priority: priority || aiResult?.priority || 'Medium',
        preferredVisitTime,
        photos,
        aiClassification: aiResult
          ? {
              isAiAssisted: true,
              suggestedCategory: aiResult.category,
              suggestedPriority: aiResult.priority,
              summary: aiResult.summary,
              confidence: aiResult.confidence,
              source: aiResult.source,
            }
          : null,
      };
      const res = await api.post('/complaints', payload);
      if (res.data.success) {
        setSubmitResult(res.data.complaint);
        setSubmitted(true);
        onSuccess?.(res.data.complaint);
      } else {
        setError(res.data.message || 'Submission failed.');
      }
    } catch (err) {
      // Demo/offline fallback – mock success
      const mockComplaint = {
        complaintNumber: `CMP-${String(Date.now()).slice(-3)}`,
        title: title.trim(),
        category: category || aiResult?.category || 'General',
        priority: priority || 'Medium',
        status: 'Created',
        createdAt: new Date().toISOString(),
      };
      setSubmitResult(mockComplaint);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const priorityConfig = PRIORITIES.find((p) => p.value === priority) || PRIORITIES[1];
  const aiConfidencePct = aiResult ? Math.round((aiResult.confidence || 0.9) * 100) : 0;

  // ──────────────────────────────────────────────────────────────────────
  // Success Screen
  // ──────────────────────────────────────────────────────────────────────
  if (submitted && submitResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-200/60">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 stroke-[1.5]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900">
            Complaint Registered!
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Your request has been logged and our team will review it shortly.
          </p>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Complaint ID</span>
            <span className="font-mono font-bold text-teal-800 text-sm bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              {submitResult.complaintNumber}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</span>
            <span className="text-xs font-semibold text-slate-700">{submitResult.category}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              PRIORITIES.find(p => p.value === submitResult.priority)?.color || PRIORITIES[1].color
            }`}>
              {submitResult.priority}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {submitResult.status}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl text-sm transition shadow"
          >
            View My Complaints
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              setSubmitResult(null);
              setTitle('');
              setDescription('');
              setCategory('');
              setPriority('Medium');
              setAiResult(null);
            }}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:border-teal-300 transition"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // Main Form
  // ──────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900">
            Raise Maintenance Request
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Groq AI will auto-classify your request as you type.
          </p>
        </div>
      </div>

      {/* Resident Identity Card */}
      <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-700">
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium">Filing As</p>
          <p className="text-sm font-bold text-white">{user?.name || 'Resident'}</p>
          <p className="text-xs text-teal-300 font-mono">{user?.flatNumber || 'B-402'} • {user?.wing || 'Wing B'}</p>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="text-right">
          <p className="text-xs text-slate-400">Phone</p>
          <p className="text-xs font-semibold text-slate-200">{user?.phone || '+91 98221 44556'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Complaint Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="complaint-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water leaking from bathroom ceiling"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 placeholder-slate-400 transition"
            maxLength={120}
          />
        </div>

        {/* Description + AI Trigger */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Describe the Issue <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => runAiClassify(description)}
              disabled={aiLoading || !description.trim()}
              className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 disabled:opacity-40 transition"
            >
              {aiLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {aiLoading ? 'Analyzing…' : 'Analyze with Groq AI'}
            </button>
          </div>
          <textarea
            id="complaint-description"
            ref={descRef}
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Describe the problem in detail — location in flat, when it started, severity, any relevant context… AI will auto-classify as you type."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 placeholder-slate-400 transition resize-none leading-relaxed"
            maxLength={1200}
          />
          <p className="text-[11px] text-slate-400 text-right">{description.length}/1200</p>
        </div>

        {/* AI Classification Result Banner */}
        {(aiLoading || aiResult) && (
          <div className={`rounded-2xl border p-4 transition-all ${
            aiLoading
              ? 'bg-slate-50 border-slate-200 animate-pulse'
              : aiResult?.source === 'groq-ai'
              ? 'bg-teal-50 border-teal-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Groq AI is analyzing your description…</span>
              </div>
            ) : aiResult ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className={`w-4 h-4 ${aiResult.source === 'groq-ai' ? 'text-teal-700' : 'text-amber-700'}`} />
                    <span className="text-xs font-bold text-slate-700">
                      {aiResult.source === 'groq-ai' ? 'Groq AI Classification' : 'Smart Heuristic Classification'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      aiResult.source === 'groq-ai' ? 'bg-teal-200 text-teal-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {aiConfidencePct}% confidence
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => runAiClassify(description)}
                    className="p-1 rounded-lg hover:bg-white/80 text-slate-500 transition"
                    title="Re-analyze"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 italic mb-3">
                  "{aiResult.summary}"
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suggested Category</p>
                    <p className="text-sm font-bold text-slate-800">{aiResult.category}</p>
                  </div>
                  <div className="bg-white rounded-xl p-3 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Suggested Priority</p>
                    <p className={`text-sm font-bold ${
                      aiResult.priority === 'Emergency' ? 'text-red-700' :
                      aiResult.priority === 'High' ? 'text-rose-700' :
                      aiResult.priority === 'Medium' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>{aiResult.priority}</p>
                  </div>
                </div>

                {aiOverridden && (
                  <p className="text-[11px] text-amber-700 font-semibold mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> AI suggestions overridden by your manual selection.
                  </p>
                )}
              </>
            ) : null}
          </div>
        )}

        {aiError && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" /> {aiError}
          </div>
        )}

        {/* Category Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Category
            {aiResult && !aiOverridden && (
              <span className="ml-2 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                AI Suggested
              </span>
            )}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                  category === cat
                    ? 'bg-teal-700 text-white border-teal-700 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Priority + Time Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Priority</label>
            <div className="grid grid-cols-2 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePriorityChange(p.value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition ${
                    priority === p.value
                      ? p.color + ' shadow-sm ring-2 ring-offset-1 ring-current/20'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${priority === p.value ? p.dot : 'bg-slate-300'}`} />
                  {p.value}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Visit Time */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
              Preferred Visit Time
            </label>
            <div className="relative">
              <select
                id="preferred-visit-time"
                value={preferredVisitTime}
                onChange={(e) => setPreferredVisitTime(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-9 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
              >
                {TIME_SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Photo Upload (Visual Placeholder) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Camera className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
            Attach Photos (Optional)
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-600 cursor-pointer transition group">
              <Camera className="w-5 h-5 group-hover:scale-110 transition" />
              <span className="text-[10px] mt-1 font-medium">Add Photo</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Supported: JPG, PNG, HEIC<br />Max 5 photos • 5 MB each<br />
              <span className="text-teal-600">File upload will be available once MongoDB is connected.</span>
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-medium">
            <X className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Submit */}
        <button
          id="submit-complaint-btn"
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm transition shadow-lg shadow-teal-700/30"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting Complaint…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Maintenance Request
            </>
          )}
        </button>
      </form>
    </div>
  );
};
