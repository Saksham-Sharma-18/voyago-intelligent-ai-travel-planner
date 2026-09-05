'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import {
  CreditCard, Smartphone, Building2, Wallet, Lock, CheckCircle, ArrowRight,
  Car, Train, Ship, MapPin, Calendar, Users, ChevronDown, CheckCheck, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Destination } from '@/lib/types';

type TransportOptIn = 'pending' | 'yes' | 'no';

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
type TransportMode = 'cab' | 'train' | 'cruise';

// ─── Transport mode detection ────────────────────────────────────────────────
function detectTransportMode(dest: Destination): TransportMode {
  const cruiseRegions = ['Oceania', 'Indian Ocean'];
  const cruiseCities = ['Athens', 'Dublin', 'Singapore', 'Malé & Island Resorts'];
  const trainCountries = ['France', 'Austria', 'Finland', 'Spain', 'United Kingdom', 'Ireland', 'Japan', 'Germany', 'Italy', 'Netherlands', 'Switzerland'];

  if (cruiseRegions.includes(dest.region) || cruiseCities.includes(dest.city)) return 'cruise';
  if (trainCountries.includes(dest.country)) return 'train';
  return 'cab';
}

const TRANSPORT_META: Record<TransportMode, { icon: React.ElementType; label: string; color: string; gradient: string; tagline: string }> = {
  cab:    { icon: Car,   label: 'Cab / Taxi Booking',    color: 'yellow',  gradient: 'from-yellow-500/20 to-orange-500/10',  tagline: 'Private & comfortable city rides' },
  train:  { icon: Train, label: 'Train Booking',          color: 'cyan',    gradient: 'from-cyan-500/20 to-blue-500/10',      tagline: 'Scenic rail journeys across the country' },
  cruise: { icon: Ship,  label: 'Cruise / Ferry Booking', color: 'violet',  gradient: 'from-violet-500/20 to-indigo-500/10',  tagline: 'Luxury sea voyages & island hops' },
};

const CAB_CLASSES = ['Economy', 'Comfort', 'Premium SUV', 'Limousine'];
const TRAIN_CLASSES = ['Economy Class', 'Business Class', 'First Class', 'Sleeper'];
const CRUISE_LINES = ['Royal Caribbean', 'MSC Cruises', 'Costa Cruises', 'Norwegian Cruise Line', 'Princess Cruises', 'Celebrity Cruises'];
const CABIN_TYPES = ['Interior Cabin', 'Ocean View Cabin', 'Balcony Suite', 'Penthouse Suite'];

const PAYMENT_METHODS = [
  { value: 'card' as PaymentMethod, label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'upi' as PaymentMethod, label: 'UPI / QR', icon: Smartphone },
  { value: 'netbanking' as PaymentMethod, label: 'Net Banking', icon: Building2 },
  { value: 'wallet' as PaymentMethod, label: 'Digital Wallet', icon: Wallet },
];

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Yes Bank', 'Punjab National Bank'];
const WALLETS = ['PayPal', 'Apple Pay', 'Google Pay', 'Amazon Pay', 'PhonePe'];

// ─── Sub-components ──────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-muted-foreground uppercase font-semibold mb-1.5 block tracking-wide">{children}</label>;
}
function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
    />
  );
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 transition-all cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

// ─── Transport Form ──────────────────────────────────────────────────────────
function CabForm({ dest }: { dest: Destination }) {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState(dest.city + ' Airport');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [cabClass, setCabClass] = useState(CAB_CLASSES[0]);
  const [booked, setBooked] = useState(false);

  const handleBook = () => {
    if (!pickup || !date) { toast.error('Please fill all cab booking fields.'); return; }
    toast.loading('Confirming your cab…', { id: 'transport' });
    setTimeout(() => {
      toast.success('🚕 Cab booked successfully!', { id: 'transport' });
      setBooked(true);
    }, 1500);
  };

  if (booked) return <BookedBadge label="Cab Confirmed" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Pickup Location</FieldLabel>
          <div className="relative">
            <Input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Hotel name or address" className="pl-10" />
            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div>
          <FieldLabel>Drop-off Location</FieldLabel>
          <div className="relative">
            <Input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Airport, hotel, attraction…" className="pl-10" />
            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-violet-400" />
          </div>
        </div>
        <div>
          <FieldLabel>Date</FieldLabel>
          <div className="relative">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-10" />
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div>
          <FieldLabel>Pickup Time</FieldLabel>
          <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
      <div>
        <FieldLabel>Vehicle Class</FieldLabel>
        <Select value={cabClass} onChange={e => setCabClass(e.target.value)}>
          {CAB_CLASSES.map(c => <option key={c}>{c}</option>)}
        </Select>
      </div>
      <BookTransportButton onClick={handleBook} />
    </div>
  );
}

function TrainForm({ dest }: { dest: Destination }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(dest.city + ' Central');
  const [date, setDate] = useState('');
  const [trainClass, setTrainClass] = useState(TRAIN_CLASSES[0]);
  const [passengers, setPassengers] = useState(1);
  const [booked, setBooked] = useState(false);

  const handleBook = () => {
    if (!from || !date) { toast.error('Please fill all train booking fields.'); return; }
    toast.loading('Reserving your seats…', { id: 'transport' });
    setTimeout(() => {
      toast.success('🚂 Train tickets reserved!', { id: 'transport' });
      setBooked(true);
    }, 1500);
  };

  if (booked) return <BookedBadge label="Train Reserved" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>From Station</FieldLabel>
          <div className="relative">
            <Input value={from} onChange={e => setFrom(e.target.value)} placeholder="Departure station" className="pl-10" />
            <Train className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div>
          <FieldLabel>To Station</FieldLabel>
          <div className="relative">
            <Input value={to} onChange={e => setTo(e.target.value)} placeholder="Arrival station" className="pl-10" />
            <Train className="absolute left-3 top-3.5 w-4 h-4 text-cyan-400" />
          </div>
        </div>
        <div>
          <FieldLabel>Travel Date</FieldLabel>
          <div className="relative">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="pl-10" />
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div>
          <FieldLabel>Passengers</FieldLabel>
          <div className="relative">
            <Input type="number" value={passengers} min={1} max={20} onChange={e => setPassengers(Number(e.target.value))} className="pl-10" />
            <Users className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      <div>
        <FieldLabel>Travel Class</FieldLabel>
        <Select value={trainClass} onChange={e => setTrainClass(e.target.value)}>
          {TRAIN_CLASSES.map(c => <option key={c}>{c}</option>)}
        </Select>
      </div>
      <BookTransportButton onClick={handleBook} />
    </div>
  );
}

function CruiseForm() {
  const [line, setLine] = useState(CRUISE_LINES[0]);
  const [cabin, setCabin] = useState(CABIN_TYPES[0]);
  const [embarkDate, setEmbarkDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [booked, setBooked] = useState(false);

  const handleBook = () => {
    if (!embarkDate) { toast.error('Please select an embarkation date.'); return; }
    toast.loading('Securing your cabin…', { id: 'transport' });
    setTimeout(() => {
      toast.success('🚢 Cruise cabin secured!', { id: 'transport' });
      setBooked(true);
    }, 1500);
  };

  if (booked) return <BookedBadge label="Cruise Booked" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Cruise Line</FieldLabel>
          <Select value={line} onChange={e => setLine(e.target.value)}>
            {CRUISE_LINES.map(c => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Cabin Type</FieldLabel>
          <Select value={cabin} onChange={e => setCabin(e.target.value)}>
            {CABIN_TYPES.map(c => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>Embarkation Date</FieldLabel>
          <div className="relative">
            <Input type="date" value={embarkDate} onChange={e => setEmbarkDate(e.target.value)} className="pl-10" />
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div>
          <FieldLabel>Guests</FieldLabel>
          <div className="relative">
            <Input type="number" value={guests} min={1} max={10} onChange={e => setGuests(Number(e.target.value))} className="pl-10" />
            <Users className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
      <BookTransportButton label="Reserve Cabin" onClick={handleBook} />
    </div>
  );
}

function BookTransportButton({ onClick, label = 'Book Transport' }: { onClick: () => void; label?: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
    >
      <CheckCircle className="w-4 h-4" /> {label}
    </motion.button>
  );
}

function BookedBadge({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center justify-center gap-3 py-5 rounded-xl border border-emerald-500/30"
      style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))' }}
    >
      <CheckCheck className="w-6 h-6 text-emerald-400" />
      <div>
        <div className="font-bold text-emerald-400">{label}</div>
        <div className="text-xs text-muted-foreground">Confirmation will be sent to your email</div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function BookingStep() {
  const { costs, requirements, selectedDestination, setStep, setBookingComplete } = useAppStore();
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [upiId, setUpiId] = useState('');
  const [bank, setBank] = useState(BANKS[0]);
  const [wallet, setWallet] = useState(WALLETS[0]);
  const [transportOptIn, setTransportOptIn] = useState<TransportOptIn>('pending');

  const formatCard = (v: string) => v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '');
    return d.length >= 2 ? `${d.slice(0, 2)}/${d.slice(2, 4)}` : d;
  };

  const handlePay = async () => {
    if (!agreed) { toast.error('Please agree to the terms and conditions.'); return; }
    if (method === 'card' && (!card.number || !card.name || !card.expiry || !card.cvv)) {
      toast.error('Please fill all card details.'); return;
    }
    if (method === 'upi' && !upiId) { toast.error('Please enter your UPI ID.'); return; }

    setProcessing(true);
    toast.loading('Processing payment securely...', { id: 'payment' });
    await new Promise(r => setTimeout(r, 2500));
    toast.dismiss('payment');
    toast.success('Payment successful! 🎉');
    setProcessing(false);
    setBookingComplete();
    setStep('confirmed');
  };

  if (!costs || !requirements || !selectedDestination) return null;

  const transportMode = detectTransportMode(selectedDestination);
  const meta = TRANSPORT_META[transportMode];
  const TransportIcon = meta.icon;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-2">
            <span className="gradient-text">Secure Booking</span>
          </h2>
          <p className="text-muted-foreground">Display only — no real payment processed</p>
        </motion.div>

        {/* ── Transport Opt-In ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border p-5 mb-6 overflow-hidden"
        >
          {/* Header always visible */}
          <div className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${meta.gradient} border border-border mb-4`}>
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
            >
              <TransportIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{meta.label}</div>
              <div className="text-xs text-muted-foreground">{meta.tagline} — recommended for {selectedDestination.city}</div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Pending — ask user */}
            {transportOptIn === 'pending' && (
              <motion.div
                key="optin"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-center"
              >
                <p className="text-sm text-muted-foreground mb-4">
                  Would you like to add <span className="font-semibold text-foreground">{meta.label.toLowerCase()}</span> to your booking?
                </p>
                <div className="flex gap-3 justify-center">
                  <motion.button
                    onClick={() => setTransportOptIn('yes')}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 rounded-xl text-white font-bold text-sm flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
                  >
                    <CheckCircle className="w-4 h-4" /> Yes, Book Transport
                  </motion.button>
                  <motion.button
                    onClick={() => setTransportOptIn('no')}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 rounded-xl border border-border text-muted-foreground font-semibold text-sm flex items-center gap-2 hover:border-red-400/50 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" /> Skip for Now
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* No — declined */}
            {transportOptIn === 'no' && (
              <motion.div
                key="declined"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between py-2"
              >
                <p className="text-sm text-muted-foreground">Transport booking skipped.</p>
                <button
                  onClick={() => setTransportOptIn('pending')}
                  className="text-xs text-violet-400 hover:underline"
                >
                  Change
                </button>
              </motion.div>
            )}

            {/* Yes — show full form */}
            {transportOptIn === 'yes' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Mode switcher tabs */}
                <div className="flex gap-2 mb-5">
                  {(['cab', 'train', 'cruise'] as TransportMode[]).map(mode => {
                    const m = TRANSPORT_META[mode];
                    const Icon = m.icon;
                    return (
                      <button
                        key={mode}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                          mode === transportMode
                            ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                            : 'border-border text-muted-foreground hover:border-violet-400/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" /> {m.label.split(' ')[0]}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setTransportOptIn('no')}
                    className="ml-auto text-xs text-muted-foreground hover:text-red-400 border border-transparent hover:border-red-400/40 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancel
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={transportMode}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {transportMode === 'cab' && <CabForm dest={selectedDestination} />}
                    {transportMode === 'train' && <TrainForm dest={selectedDestination} />}
                    {transportMode === 'cruise' && <CruiseForm />}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Order Summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-5 mb-6"
        >
          <h3 className="font-bold mb-3">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Trip Package</span><span className="font-medium">{formatCurrency(costs.total)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Processing Fee (2%)</span><span className="font-medium">{formatCurrency(costs.total * 0.02)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span className="font-medium">{formatCurrency(costs.total * 0.18)}</span></div>
            <div className="border-t border-border pt-2 flex justify-between font-black text-lg">
              <span>Total</span>
              <span className="gradient-text">{formatCurrency(costs.total * 1.20)}</span>
            </div>
          </div>
        </motion.div>

        {/* ── Payment Method ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-5 mb-6"
        >
          <h3 className="font-bold mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {PAYMENT_METHODS.map(pm => (
              <motion.button
                key={pm.value}
                onClick={() => setMethod(pm.value)}
                className={`p-3 rounded-xl border text-center text-sm transition-all ${
                  method === pm.value
                    ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                    : 'border-border hover:border-violet-400/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <pm.icon className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs font-medium">{pm.label}</div>
              </motion.button>
            ))}
          </div>

          {method === 'card' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div>
                <FieldLabel>Card Number</FieldLabel>
                <div className="relative">
                  <input
                    value={card.number}
                    onChange={e => setCard(c => ({ ...c, number: formatCard(e.target.value) }))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10"
                  />
                  <CreditCard className="absolute right-3 top-3.5 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <FieldLabel>Cardholder Name</FieldLabel>
                <input
                  value={card.name}
                  onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Expiry Date</FieldLabel>
                  <input
                    value={card.expiry}
                    onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <FieldLabel>CVV</FieldLabel>
                  <input
                    value={card.cvv}
                    onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    placeholder="•••"
                    type="password"
                    maxLength={4}
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {method === 'upi' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <FieldLabel>UPI ID</FieldLabel>
              <input
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <div className="mt-4 p-4 bg-muted rounded-xl text-center">
                <div className="w-24 h-24 bg-white rounded-xl mx-auto mb-2 flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-0.5">
                    {[...Array(25)].map((_, i) => (
                      <div key={i} className="w-3 h-3 bg-black rounded-sm" style={{ opacity: Math.random() > 0.5 ? 1 : 0 }} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Scan QR Code to pay</p>
              </div>
            </motion.div>
          )}

          {method === 'netbanking' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <FieldLabel>Select Bank</FieldLabel>
              <select
                value={bank}
                onChange={e => setBank(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </motion.div>
          )}

          {method === 'wallet' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <FieldLabel>Select Wallet</FieldLabel>
              <div className="grid grid-cols-3 gap-3">
                {WALLETS.map(w => (
                  <button key={w} onClick={() => setWallet(w)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all ${wallet === w ? 'border-violet-500 bg-violet-500/10 text-violet-400' : 'border-border'}`}>
                    {w}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Terms */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex items-start gap-3 mb-6 p-4 bg-card rounded-xl border border-border">
          <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 accent-violet-500 w-4 h-4 flex-shrink-0" />
          <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
            I agree to the <span className="text-violet-400">Terms & Conditions</span>, <span className="text-violet-400">Privacy Policy</span>, and <span className="text-violet-400">Cancellation Policy</span>. I understand this is a demo booking and no actual payment will be processed.
          </label>
        </motion.div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mb-6 text-xs text-muted-foreground">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          256-bit SSL Encrypted · PCI DSS Compliant · Secure Payment Gateway
        </div>

        {/* Pay Button */}
        <motion.button
          onClick={handlePay}
          disabled={processing}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          whileHover={{ scale: processing ? 1 : 1.02 }}
          whileTap={{ scale: processing ? 1 : 0.98 }}
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Pay {formatCurrency(costs.total * 1.20)} & Confirm Booking
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
