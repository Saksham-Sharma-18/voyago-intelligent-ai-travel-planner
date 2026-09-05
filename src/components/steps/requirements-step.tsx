'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { CustomerRequirements, TravelPurpose, HotelStar, BudgetRange } from '@/lib/types';
import { computeArchetype } from '@/lib/behavior-tracker';
import { ArchetypePanel } from '@/components/ui/archetype-panel';
import { TripChatbot, type ChatbotUpdate } from '@/components/ui/trip-chatbot';
import { ArrowRight, User, IndianRupee, Home, Sparkles, Loader2, ShieldAlert, Heart, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

const PURPOSES: { value: TravelPurpose; label: string; emoji: string }[] = [
  { value: 'leisure', label: 'Leisure & Relaxation', emoji: '🏖️' },
  { value: 'adventure', label: 'Adventure & Thrill', emoji: '🏔️' },
  { value: 'culture', label: 'Culture & History', emoji: '🏛️' },
  { value: 'honeymoon', label: 'Honeymoon / Romance', emoji: '💑' },
  { value: 'family', label: 'Family Holiday', emoji: '👨‍👩‍👧‍👦' },
  { value: 'solo', label: 'Solo Exploration', emoji: '🧍' },
  { value: 'business', label: 'Business + Leisure', emoji: '💼' },
  { value: 'group', label: 'Group / Friends', emoji: '🎉' },
];

const BUDGETS: { value: BudgetRange; label: string; range: string }[] = [
  { value: 'budget', label: 'Budget', range: 'Under ₹1,25,000' },
  { value: 'moderate', label: 'Moderate', range: '₹1,25,000–₹4,15,000' },
  { value: 'luxury', label: 'Luxury', range: '₹4,15,000–₹12,45,000' },
  { value: 'ultra-luxury', label: 'Ultra-Luxury', range: '₹12,45,000+' },
];

const INTERESTS = ['Beaches', 'Temples', 'Shopping', 'Nightlife', 'Food', 'Museums', 'Nature', 'Sports', 'Spa', 'Architecture', 'Photography', 'Diving'];

const HOTELS: { value: HotelStar; label: string; desc: string }[] = [
  { value: 3, label: '3-Star', desc: 'Comfortable & affordable' },
  { value: 4, label: '4-Star', desc: 'Superior comfort & amenities' },
  { value: 5, label: '5-Star', desc: 'Premium luxury experience' },
  { value: 7, label: '7-Star', desc: 'Unparalleled ultra-luxury' },
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const BUDGET_SLIDER_MAP: Record<BudgetRange, { min: number; max: number; default: number }> = {
  'budget':       { min: 50_000,     max: 1_25_000,  default: 80_000 },
  'moderate':     { min: 1_25_000,   max: 4_15_000,  default: 2_50_000 },
  'luxury':       { min: 4_15_000,   max: 12_45_000, default: 7_50_000 },
  'ultra-luxury': { min: 12_45_000,  max: 40_00_000, default: 20_00_000 },
};

const HEALTH_CONCERNS = ['Diabetes', 'Heart Condition', 'Mobility Issues', 'Respiratory Issues', 'Allergies'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'No Pork', 'No Alcohol'];

const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+1',   flag: '🇺🇸', name: 'USA/Canada' },
  { code: '+44',  flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: '+33',  flag: '🇫🇷', name: 'France' },
  { code: '+81',  flag: '🇯🇵', name: 'Japan' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Philippines' },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea' },
  { code: '+55',  flag: '🇧🇷', name: 'Brazil' },
  { code: '+27',  flag: '🇿🇦', name: 'South Africa' },
  { code: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+7',   flag: '🇷🇺', name: 'Russia' },
  { code: '+34',  flag: '🇪🇸', name: 'Spain' },
  { code: '+39',  flag: '🇮🇹', name: 'Italy' },
  { code: '+31',  flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46',  flag: '🇸🇪', name: 'Sweden' },
  { code: '+41',  flag: '🇨🇭', name: 'Switzerland' },
];

// ─── Validation helpers ────────────────────────────────────────────────────────
function validateName(v: string) {
  if (!v.trim()) return 'Full name is required';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  return '';
}
function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required';
  if (!v.includes('@')) return 'Email must contain "@"';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address';
  return '';
}
function validatePhone(v: string) {
  if (!v.trim()) return ''; // optional field, empty is fine
  const digits = v.replace(/\D/g, '');
  if (digits.length < 10) return 'Phone must contain at least 10 digits';
  if (digits.length > 10) return 'Phone number cannot exceed 10 digits';
  return '';
}

export function RequirementsStep() {
  const { runAIRecommendations, aiLoading, addBehaviorSignal } = useAppStore();
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    countryCode: '+91',
    purpose: 'leisure' as TravelPurpose,
    budgetRange: 'moderate' as BudgetRange,
    budgetUSD: 5000,
    duration: 7,
    groupSize: 2,
    hotelStar: 4 as HotelStar,
    departureCity: '',
    travelMonth: 'June',
    interests: [] as string[],
    specialRequirements: '',
    riskTolerance: 3,
    healthConcerns: [] as string[],
    dietaryRestrictions: [] as string[],
  });

  const [chatbotDone, setChatbotDone] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatbotRef = useRef<HTMLDivElement>(null);


  // Track which fields have been touched (for showing errors only after blur)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched(t => ({ ...t, [field]: true }));

  const nameError  = validateName(form.name);
  const emailError = validateEmail(form.email);
  const phoneError = validatePhone(form.phone);

  // Personal info is "complete" once name + email are valid and phone is either empty or valid
  const personalInfoComplete =
    !nameError && form.name.trim().length >= 2 &&
    !emailError && form.email.includes('@') &&
    !phoneError;

  // Auto-scroll to chatbot when personal info is first completed
  useEffect(() => {
    if (showChatbot && chatbotRef.current) {
      setTimeout(() => {
        chatbotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showChatbot]);

  const [budgetINR, setBudgetINR] = useState(BUDGET_SLIDER_MAP['moderate'].default);

  // Live archetype (BPL Module 2)
  const [liveArchetype, setLiveArchetype] = useState(() =>
    computeArchetype(form, [])
  );

  // Recompute archetype whenever form changes
  useEffect(() => {
    const archetype = computeArchetype(form, []);
    setLiveArchetype(archetype);
  }, [form.purpose, form.budgetRange, form.groupSize, form.interests, form.riskTolerance]);

  const syncBudgetRange = (inr: number): BudgetRange => {
    if (inr <= 1_25_000) return 'budget';
    if (inr <= 4_15_000) return 'moderate';
    if (inr <= 12_45_000) return 'luxury';
    return 'ultra-luxury';
  };

  const toggleInterest = (i: string) => {
    const selected = !form.interests.includes(i);
    setForm(f => ({
      ...f,
      interests: selected ? [...f.interests, i] : f.interests.filter(x => x !== i)
    }));
    addBehaviorSignal({ type: 'interest_toggle', payload: { interest: i, selected } });
  };

  const toggleHealthConcern = (h: string) => setForm(f => ({
    ...f, healthConcerns: f.healthConcerns.includes(h) ? f.healthConcerns.filter(x => x !== h) : [...f.healthConcerns, h]
  }));

  const toggleDietary = (d: string) => setForm(f => ({
    ...f, dietaryRestrictions: f.dietaryRestrictions.includes(d) ? f.dietaryRestrictions.filter(x => x !== d) : [...f.dietaryRestrictions, d]
  }));

  const handleSubmit = () => {
    // Touch all personal fields to reveal inline errors
    setTouched(t => ({ ...t, name: true, email: true, phone: true }));

    if (nameError) { toast.error(nameError); return; }
    if (emailError) { toast.error(emailError); return; }
    if (phoneError) { toast.error(phoneError); return; }
    if (!form.departureCity.trim()) {
      toast.error('Please complete the trip chatbot — departure city is required.');
      return;
    }

    const fullPhone = form.phone.trim() ? `${form.countryCode} ${form.phone.trim()}` : '';
    const req: CustomerRequirements = { ...form, phone: fullPhone };
    toast.success('AI is analyzing your preferences… 🤖', { duration: 2500 });
    runAIRecommendations(req);
  };

  const riskLabels = ['', 'Very Cautious', 'Careful', 'Balanced', 'Adventurous', 'Thrill Seeker'];
  const riskColors = ['', '#10B981', '#22D3EE', '#F59E0B', '#F97316', '#EF4444'];

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Tell Us About Your <span className="gradient-text">Dream Trip</span></h2>
          <p className="text-muted-foreground">We'll craft the perfect itinerary tailored just for you</p>
        </motion.div>

        <div className="space-y-8">
          {/* Personal Info */}
          <Section title="Personal Information" icon={User}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name */}
              <ValidatedInput
                label="Full Name *"
                value={form.name}
                onChange={v => setForm(f => ({ ...f, name: v }))}
                onBlur={() => touch('name')}
                placeholder="John Doe"
                error={touched.name ? nameError : ''}
              />

              {/* Email */}
              <ValidatedInput
                label="Email Address *"
                value={form.email}
                onChange={v => setForm(f => ({ ...f, email: v }))}
                onBlur={() => touch('email')}
                placeholder="john@email.com"
                type="email"
                error={touched.email ? emailError : ''}
              />

              {/* Phone with Country Code */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  {/* Country code dropdown */}
                  <select
                    value={form.countryCode}
                    onChange={e => setForm(f => ({ ...f, countryCode: e.target.value }))}
                    className="px-2 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all shrink-0 w-[88px] cursor-pointer"
                    style={{ minWidth: '88px' }}
                  >
                    {COUNTRY_CODES.map((c, i) => (
                      <option key={i} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  {/* Phone digits input */}
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={e => {
                        // Allow only digits — hard cap at 10 digits
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm(f => ({ ...f, phone: digits }));
                      }}
                      onBlur={() => touch('phone')}
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all ${
                        touched.phone && phoneError ? 'border-red-500/60 focus:ring-red-500/40' : 'border-border'
                      }`}
                    />
                  </div>
                </div>
                {/* Phone error / digit counter */}
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-xs ${
                    touched.phone && phoneError ? 'text-red-400' : 'text-transparent'
                  }`}>
                    {touched.phone && phoneError ? phoneError : '\u00a0'}
                  </span>
                  <span className={`text-[10px] font-mono ${
                    form.phone.replace(/\D/g, '').length === 10 ? 'text-emerald-400' : form.phone.replace(/\D/g, '').length > 0 ? 'text-amber-400' : 'text-muted-foreground/50'
                  }`}>
                    {form.phone.replace(/\D/g, '').length}/10 digits
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* ─── Trip Chatbot + all sections below: revealed after personal info ─── */}
          <AnimatePresence>
            {showChatbot && (
              <motion.div
                ref={chatbotRef}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="space-y-8"
              >
          {/* ─── Trip Chatbot replaces Purpose, Trip Details, Departure & Interests ─── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wide">Plan Your Trip</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">AI Chat</span>
              {chatbotDone && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium ml-auto">
                  ✓ Complete
                </span>
              )}
            </div>
            <TripChatbot
              onUpdate={(updates: Partial<ChatbotUpdate>) => {
                setForm(f => {
                  const next = { ...f };
                  if (updates.departureCity !== undefined) next.departureCity = updates.departureCity;
                  if (updates.purpose !== undefined) next.purpose = updates.purpose as TravelPurpose;
                  if (updates.travelMonth !== undefined) next.travelMonth = updates.travelMonth;
                  if (updates.duration !== undefined) next.duration = Number(updates.duration);
                  if (updates.groupSize !== undefined) next.groupSize = Number(updates.groupSize);
                  if (updates.interests !== undefined) next.interests = updates.interests;
                  if (updates.specialRequirements !== undefined) next.specialRequirements = updates.specialRequirements;
                  return next;
                });
                // Fire behavior signals for BPL
                if (updates.interests) {
                  updates.interests.forEach(i =>
                    addBehaviorSignal({ type: 'interest_toggle', payload: { interest: i, selected: true } })
                  );
                }
              }}
              onComplete={() => setChatbotDone(true)}
            />
          </motion.div>

          {/* Budget */}
          <Section title="Budget Range" icon={IndianRupee}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {BUDGETS.map(b => (
                <motion.button
                  key={b.value}
                  onClick={() => {
                    const bounds = BUDGET_SLIDER_MAP[b.value];
                    setForm(f => ({...f, budgetRange: b.value, budgetUSD: Math.round(bounds.default / 83)}));
                    setBudgetINR(bounds.default);
                    addBehaviorSignal({ type: 'budget_change', payload: { range: b.value, delta: bounds.default - budgetINR } });
                  }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.budgetRange === b.value
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-border hover:border-cyan-400/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-bold text-sm">{b.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{b.range}</div>
                </motion.button>
              ))}
            </div>

            <div className="bg-muted/40 rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exact Budget (INR)</label>
                <motion.div
                  key={budgetINR}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-black gradient-text"
                >
                  ₹{budgetINR.toLocaleString('en-IN')}
                </motion.div>
              </div>
              <input
                type="range"
                className="budget-slider"
                min={BUDGET_SLIDER_MAP[form.budgetRange].min}
                max={BUDGET_SLIDER_MAP[form.budgetRange].max}
                step={5000}
                value={budgetINR}
                onChange={e => {
                  const inr = Number(e.target.value);
                  setBudgetINR(inr);
                  const newRange = syncBudgetRange(inr);
                  setForm(f => ({ ...f, budgetRange: newRange, budgetUSD: Math.round(inr / 83) }));
                  addBehaviorSignal({ type: 'slider_drag', payload: { value: inr, delta: inr - budgetINR } });
                }}
                style={{
                  background: `linear-gradient(90deg, #6C63FF ${
                    ((budgetINR - BUDGET_SLIDER_MAP[form.budgetRange].min) /
                    (BUDGET_SLIDER_MAP[form.budgetRange].max - BUDGET_SLIDER_MAP[form.budgetRange].min)) * 100
                  }%, var(--muted) 0%)`,
                }}
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>₹{BUDGET_SLIDER_MAP[form.budgetRange].min.toLocaleString('en-IN')}</span>
                <span>₹{BUDGET_SLIDER_MAP[form.budgetRange].max.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Section>

          {/* Hotel */}
          <Section title="Hotel Preference" icon={Home}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {HOTELS.map(h => (
                <motion.button
                  key={h.value}
                  onClick={() => setForm(f => ({...f, hotelStar: h.value}))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.hotelStar === h.value
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-border hover:border-yellow-400/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="font-bold text-lg mb-0.5">{'⭐'.repeat(Math.min(h.value, 5))}</div>
                  <div className="font-semibold text-xs">{h.label}</div>
                  <div className="text-xs text-muted-foreground">{h.desc}</div>
                </motion.button>
              ))}
            </div>
          </Section>

          {/* ─── Module 5 + 1: Risk Tolerance (GRR + TSI input) ───────────────── */}
          <Section title="Risk Tolerance Profile" icon={ShieldAlert}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Risk Appetite</label>
                  <motion.div
                    key={form.riskTolerance}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-sm font-bold px-3 py-1 rounded-full"
                    style={{ background: `${riskColors[form.riskTolerance]}20`, color: riskColors[form.riskTolerance] }}
                  >
                    {riskLabels[form.riskTolerance]}
                  </motion.div>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(level => (
                    <motion.button
                      key={level}
                      onClick={() => setForm(f => ({ ...f, riskTolerance: level }))}
                      className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                        form.riskTolerance === level
                          ? 'text-white'
                          : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                      }`}
                      style={form.riskTolerance === level ? {
                        background: `linear-gradient(135deg, ${riskColors[level]}, ${riskColors[level]}cc)`,
                        borderColor: riskColors[level],
                      } : {}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {level}
                    </motion.button>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>🛡️ Very Cautious</span>
                  <span>Used by GRR & TSI algorithms</span>
                  <span>Thrill Seeker ⚡</span>
                </div>
              </div>
            </div>
          </Section>


          {/* Health & Dietary (TSI input) */}
          <Section title="Health & Dietary Profile" icon={Heart}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-red-400" /> Health Considerations
                </label>
                <div className="flex flex-wrap gap-2">
                  {HEALTH_CONCERNS.map(h => (
                    <button
                      key={h}
                      onClick={() => toggleHealthConcern(h)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.healthConcerns.includes(h)
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Affects TSI Health Risk dimension</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" /> Dietary Restrictions
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleDietary(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.dietaryRestrictions.includes(d)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">Helps personalize dining recommendations</p>
              </div>
            </div>
          </Section>

          {/* ─── Module 2: Live Traveler DNA (BPL) ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-500" />
              </div>
              <h3 className="font-bold text-sm uppercase tracking-wide">Your Traveler DNA™</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">Live</span>
            </div>
            <ArchetypePanel archetype={liveArchetype} />
          </motion.div>

          {/* Submit */}
          <motion.button
            onClick={handleSubmit}
            disabled={aiLoading}
            className="w-full py-4 rounded-2xl text-lg font-bold text-white flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
            whileHover={!aiLoading ? { scale: 1.02 } : {}}
            whileTap={!aiLoading ? { scale: 0.98 } : {}}
          >
            <AnimatePresence mode="wait">
              {aiLoading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI Analyzing Your Trip…
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <Sparkles className="w-5 h-5" />
                  Find My Perfect Destinations
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Show a gentle hint when personal info is not yet complete */}
          <AnimatePresence>
            {!showChatbot && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 text-sm text-muted-foreground flex flex-col items-center gap-4"
              >
                {!personalInfoComplete ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
                    <span>👆</span> Fill in your name and email above to continue planning
                  </span>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setShowChatbot(true)}
                    className="px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors flex items-center gap-2"
                  >
                    Continue to Trip Planning <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div
      className="bg-card rounded-2xl p-6 border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-500" />
        </div>
        <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ValidatedInput({
  label, value, onChange, onBlur, placeholder, type = 'text', error = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  type?: string;
  error?: string;
}) {
  const hasError = Boolean(error);
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 transition-all ${
            hasError
              ? 'border-red-500/60 focus:ring-red-500/40'
              : 'border-border focus:ring-violet-500'
          }`}
        />
        {/* Validation indicator dot */}
        {value && (
          <span
            className={`absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-colors ${
              hasError ? 'bg-red-400' : 'bg-emerald-400'
            }`}
          />
        )}
      </div>
      {/* Error message — always occupies space to avoid layout shift */}
      <p className={`text-xs mt-1.5 min-h-[16px] transition-all ${
        hasError ? 'text-red-400' : 'text-transparent'
      }`}>
        {hasError ? error : '\u00a0'}
      </p>
    </div>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 font-bold text-lg flex items-center justify-center transition-colors"
      >−</button>
      <span className="flex-1 text-center font-bold text-lg">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 font-bold text-lg flex items-center justify-center transition-colors"
      >+</button>
    </div>
  );
}
