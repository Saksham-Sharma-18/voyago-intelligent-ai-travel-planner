'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { ArrowRight, Plane, Hotel, Utensils, ShoppingBag, Activity, Car, Shield, Package, Stamp, Zap, Star, Check } from 'lucide-react';

const items = [
  { key: 'visa', label: 'Visa Fees', icon: Stamp, desc: 'Per person', color: '#6C63FF', perPerson: true },
  { key: 'flights', label: 'Flights (Return)', icon: Plane, desc: 'Total for group', color: '#06B6D4' },
  { key: 'totalHotel', label: 'Hotel Stay', icon: Hotel, desc: 'Total for all nights', color: '#F59E0B' },
  { key: 'totalFood', label: 'Food & Dining', icon: Utensils, desc: 'Total for group', color: '#10B981' },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag, desc: 'Estimated budget', color: '#FF6B6B' },
  { key: 'activities', label: 'Activities & Tours', icon: Activity, desc: 'Total for group', color: '#8B5CF6' },
  { key: 'transport', label: 'Local Transport', icon: Car, desc: 'Total', color: '#EC4899' },
  { key: 'insurance', label: 'Travel Insurance', icon: Shield, desc: 'Total for group', color: '#14B8A6' },
  { key: 'miscellaneous', label: 'Miscellaneous', icon: Package, desc: 'Buffer / extras', color: '#F97316' },
];

const PLAN_COLORS: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  bestValue: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300', text: 'text-cyan-400' },
  dream:     { bg: 'bg-violet-500/5', border: 'border-violet-500/30', badge: 'bg-violet-500/20 text-violet-300', text: 'text-violet-400' },
  safe:      { bg: 'bg-emerald-500/5', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300', text: 'text-emerald-400' },
};

// ─── Efficiency Ring Chart ────────────────────────────────────────────────────
function EfficiencyRing({ score, color }: { score: number; color: string }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg width={56} height={56} viewBox="0 0 56 56" className="-rotate-90">
        <circle cx={28} cy={28} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted opacity-30" />
        <motion.circle
          cx={28} cy={28} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute text-xs font-black" style={{ color }}>{score}</div>
    </div>
  );
}

export function CostsStep() {
  const { costs, requirements, selectedDestination, setStep, scoVariants, applyActiveSCOPlan, activeSCOPlan } = useAppStore();
  const [showSCO, setShowSCO] = useState(true);

  if (!costs || !requirements) return null;

  const groupSize = requirements.groupSize;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-2">
            Estimated <span className="gradient-text">Cost Breakdown</span>
          </h2>
          <p className="text-muted-foreground">
            {requirements.duration} days · {groupSize} {groupSize === 1 ? 'person' : 'people'} · {requirements.hotelStar}★ hotel · {selectedDestination?.city}
          </p>
        </motion.div>

        {/* Total Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl p-8 mb-8 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4, #10B981)' }}
        >
          <div className="absolute inset-0 opacity-20">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="absolute rounded-full animate-aurora"
                style={{ width: 200, height: 200, left: `${20 * i}%`, top: '-50%', background: 'white' }} />
            ))}
          </div>
          <p className="text-white/70 text-sm mb-2 relative z-10">
            TOTAL ESTIMATED TRIP COST
            {activeSCOPlan && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                {activeSCOPlan === 'bestValue' ? '⚡ Best Value' : activeSCOPlan === 'dream' ? '🌟 Dream' : '🛡️ Safe'} Plan
              </span>
            )}
          </p>
          <div className="text-5xl md:text-6xl font-black relative z-10">{formatCurrency(costs.total)}</div>
          <div className="text-white/60 text-sm mt-2 relative z-10">
            ≈ {formatCurrency(costs.total / groupSize)} per person
          </div>
        </motion.div>

        {/* ─── Module 4: SCO Plan Variants ────────────────────────────────── */}
        {scoVariants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <button
              onClick={() => setShowSCO(v => !v)}
              className="flex items-center gap-2 text-sm font-bold mb-4 text-foreground w-full"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              Smart Cost Optimizer (SCO)™
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium">3 Plans</span>
              <span className="ml-auto text-muted-foreground text-xs">{showSCO ? '▲' : '▼'}</span>
            </button>

            <AnimatePresence>
              {showSCO && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {scoVariants.map((plan, i) => {
                      const colors = PLAN_COLORS[plan.type];
                      const isActive = activeSCOPlan === plan.type;
                      const effColor = plan.type === 'bestValue' ? '#06B6D4' : plan.type === 'dream' ? '#8B5CF6' : '#10B981';
                      return (
                        <motion.div
                          key={plan.type}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`rounded-2xl border p-5 relative transition-all cursor-pointer ${colors.bg} ${
                            isActive ? colors.border + ' ring-2 ring-offset-2 ring-offset-background' : colors.border + ' hover:border-opacity-60'
                          }`}
                          style={{}}
                          onClick={() => applyActiveSCOPlan(plan.type)}
                        >
                          {isActive && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: effColor }}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-4">
                            <div className="text-2xl">{plan.emoji}</div>
                            <div>
                              <div className={`font-bold text-sm ${colors.text}`}>{plan.label}</div>
                              <div className="text-xs text-muted-foreground">Tap to apply</div>
                            </div>
                            <div className="ml-auto">
                              <EfficiencyRing score={plan.efficiencyScore} color={effColor} />
                            </div>
                          </div>

                          <div className="text-2xl font-black mb-1">{formatCurrency(plan.adjustedCosts.total)}</div>
                          <div className="text-xs text-muted-foreground mb-3">{plan.description}</div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-2 mb-3 text-center">
                            <div className="bg-background/50 rounded-lg p-2">
                              <div className="text-xs text-muted-foreground">Quality</div>
                              <div className="font-bold text-sm" style={{ color: effColor }}>{plan.qualityScore}/100</div>
                            </div>
                            <div className="bg-background/50 rounded-lg p-2">
                              <div className="text-xs text-muted-foreground">Budget Use</div>
                              <div className="font-bold text-sm" style={{ color: effColor }}>{plan.budgetUtilization}%</div>
                            </div>
                          </div>

                          {/* Budget utilization bar */}
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: effColor }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(plan.budgetUtilization, 100)}%` }}
                              transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                            />
                          </div>

                          {/* Highlights */}
                          <div className="space-y-1">
                            {plan.highlights.slice(0, 3).map((h, j) => (
                              <div key={j} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                                <Star className="w-2.5 h-2.5 flex-shrink-0 mt-0.5" style={{ color: effColor }} />
                                {h}
                              </div>
                            ))}
                          </div>

                          {plan.savingsVsDream > 0 && (
                            <div className="mt-2 text-[10px] font-bold" style={{ color: effColor }}>
                              Saves ${plan.savingsVsDream.toLocaleString()} vs Dream
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-3">
                    SCO™ uses Pareto efficiency optimization to generate these variants. Tap a plan to apply it.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Hotel Detail */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-amber-400/20 p-5 mb-6"
          style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Hotel className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold">Hotel Details ({requirements.hotelStar}★)</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-amber-400/5 rounded-xl p-3">
              <div className="text-lg font-black text-amber-400">{formatCurrency(costs.hotel)}</div>
              <div className="text-xs text-muted-foreground">Per night / room</div>
            </div>
            <div className="bg-amber-400/5 rounded-xl p-3">
              <div className="text-lg font-black text-amber-400">{requirements.duration}</div>
              <div className="text-xs text-muted-foreground">Nights</div>
            </div>
            <div className="bg-amber-400/5 rounded-xl p-3">
              <div className="text-lg font-black text-amber-400">{Math.ceil(groupSize / 2)}</div>
              <div className="text-xs text-muted-foreground">Rooms needed</div>
            </div>
            <div className="bg-amber-400/5 rounded-xl p-3">
              <div className="text-lg font-black text-amber-400">{formatCurrency(costs.totalHotel)}</div>
              <div className="text-xs text-muted-foreground">Total hotel cost</div>
            </div>
          </div>
        </motion.div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {items.map((item, i) => {
            const value = costs[item.key as keyof typeof costs] as number;
            const percent = Math.round((value / costs.total) * 100);
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 card-hover"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.desc}</div>
                  </div>
                </div>
                <div className="text-2xl font-black mb-2">{formatCurrency(value)}</div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <motion.div
                    className="h-1.5 rounded-full"
                    style={{ background: item.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">{percent}% of total</div>
              </motion.div>
            );
          })}
        </div>

        {/* Per Person Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-2xl border border-border p-5 mb-6"
        >
          <h3 className="font-bold mb-4">Per-Person Cost Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-black text-violet-400">{formatCurrency(costs.visa)}</div>
              <div className="text-xs text-muted-foreground">Visa</div>
            </div>
            <div>
              <div className="text-xl font-black text-cyan-400">{formatCurrency(costs.flights / groupSize)}</div>
              <div className="text-xs text-muted-foreground">Flights</div>
            </div>
            <div>
              <div className="text-xl font-black text-amber-400">{formatCurrency(costs.totalHotel / groupSize)}</div>
              <div className="text-xs text-muted-foreground">Hotel</div>
            </div>
            <div>
              <div className="text-xl font-black text-emerald-400">{formatCurrency(costs.total / groupSize)}</div>
              <div className="text-xs text-muted-foreground font-bold">TOTAL / PERSON</div>
            </div>
          </div>
        </motion.div>

        <motion.button
          onClick={() => setStep('safety')}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Safety & Culture Guide <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
