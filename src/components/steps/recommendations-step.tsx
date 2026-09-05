'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Destination, GRRAdjustedScore } from '@/lib/types';
import {
  ArrowRight, Star, Shield, Cloud, Activity, Check,
  Sparkles, Hotel, Zap, ChevronDown, ChevronUp, Lightbulb, Calendar,
  AlertTriangle, Globe, TrendingDown
} from 'lucide-react';
import { PhotoCarousel } from '@/components/ui/photo-carousel';
import { SkeletonGrid } from '@/components/ui/skeleton-card';
import { HotelPickerModal, generateHotelOptions, type HotelOption } from '@/components/ui/hotel-picker';

// ─── Typing animation for AI tip ─────────────────────────────────────────────
function TypedText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  // Start typing after delay
  useState(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 18);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(startTimer);
  });

  return (
    <span>
      {displayed}
      {displayed.length < text.length && started && (
        <span className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
      )}
    </span>
  );
}

// ─── AI Insight expandable panel ──────────────────────────────────────────────
function AIInsightPanel({ dest }: { dest: Destination & { matchScore: number } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-border/50 mt-3 pt-3">
      <button
        onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
        className="flex items-center gap-2 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors w-full"
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Analysis
        {expanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">
              {/* Reasoning */}
              {dest.aiReasoning && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">Why We Recommend</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dest.aiReasoning}</p>
                </div>
              )}

              {/* Suggested Hotels */}
              {dest.suggestedHotels && dest.suggestedHotels.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Hotel className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Recommended Hotels</span>
                  </div>
                  <div className="space-y-1">
                    {dest.suggestedHotels.map((hotel, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        {hotel}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Must-do activity */}
              {dest.mustDoActivity && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">AI Must-Do Pick</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{dest.mustDoActivity}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── GRR Advisory Banner ───────────────────────────────────────────────────
function GRRAdvisoryBanner({ grrScore }: { grrScore: GRRAdjustedScore }) {
  if (!grrScore.triggerAdvisory) return null;
  const colors = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-400/30', text: 'text-blue-400', icon: Globe },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-400/30', text: 'text-amber-400', icon: AlertTriangle },
    critical: { bg: 'bg-red-500/10', border: 'border-red-400/30', text: 'text-red-400', icon: AlertTriangle },
  };
  const c = colors[grrScore.advisoryLevel];
  const Icon = c.icon;
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-xl ${c.bg} border ${c.border} mt-2`}>
      <Icon className={`w-3.5 h-3.5 ${c.text} flex-shrink-0 mt-0.5`} />
      <p className="text-[10px] text-muted-foreground leading-relaxed">{grrScore.advisoryText}</p>
    </div>
  );
}

// ─── Main Recommendations Step ──────────────────────────────────────────────────
export function RecommendationsStep() {
  const { recommendations, selectDestination, setStep, requirements, aiLoading, overallTip, monthTip, aiSource, userArchetype, setSelectedHotel } = useAppStore();
  const [pendingDest, setPendingDest] = useState<Destination | null>(null);
  const [hotelOptions, setHotelOptions] = useState<HotelOption[]>([]);

  const openHotelPicker = (dest: Destination) => {
    const suggested = (dest as any).suggestedHotels || [];
    const hotels = generateHotelOptions(
      suggested,
      dest,
      requirements?.hotelStar ?? 4,
      requirements?.duration ?? 7,
      requirements?.groupSize ?? 2,
    );
    setHotelOptions(hotels);
    setPendingDest(dest);
  };

  const handleHotelConfirm = (hotel: HotelOption) => {
    if (!pendingDest) return;
    setSelectedHotel(hotel);
    selectDestination(pendingDest);
    setPendingDest(null);
    setStep('itinerary');
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'low') return 'text-emerald-500';
    if (risk === 'medium') return 'text-yellow-500';
    return 'text-red-500';
  };

  const getBudgetBadgeColor = (budget: string) => {
    if (budget === 'budget') return 'bg-emerald-500/10 text-emerald-400';
    if (budget === 'moderate') return 'bg-blue-500/10 text-blue-400';
    if (budget === 'luxury') return 'bg-purple-500/10 text-purple-400';
    return 'bg-yellow-500/10 text-yellow-400';
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Recommendations
            {aiSource === 'gemini' && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold tracking-wide border border-blue-500/30">
                ❆ Gemini AI
              </span>
            )}
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Your <span className="gradient-text">Perfect Destinations</span>
          </h2>
          <p className="text-muted-foreground">
            GRR-ranked for {requirements?.purpose} travel in {requirements?.travelMonth}
            {userArchetype && <span className="ml-2 text-violet-400 font-medium">· {userArchetype.emoji} {userArchetype.label}</span>}
          </p>
          {/* GRR info banner */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-xs text-muted-foreground">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Results recalibrated by Geopolitical Risk (GRR) for your risk tolerance
          </div>
        </motion.div>

        {/* Loading State */}
        {aiLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* AI thinking banner */}
            <div className="mb-8 bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/40 animate-ping" />
              </div>
              <div>
                <p className="font-semibold text-sm text-violet-300">AI is analyzing your preferences…</p>
                <p className="text-xs text-muted-foreground mt-0.5">Matching destinations, hotels &amp; activities to your profile</p>
              </div>
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-violet-400"
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
            <SkeletonGrid count={4} />
          </motion.div>
        )}

        {/* Results */}
        {!aiLoading && recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* AI Tips Banner */}
            {(overallTip || monthTip) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {overallTip && (
                  <div className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-violet-400 mb-1 uppercase tracking-wide">AI Travel Tip</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <TypedText text={overallTip} delay={300} />
                      </p>
                    </div>
                  </div>
                )}
                {monthTip && (
                  <div className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wide">{requirements?.travelMonth} Travel</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <TypedText text={monthTip} delay={800} />
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Destination Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((dest, i) => (
                <motion.div
                  key={dest.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative bg-card rounded-3xl overflow-hidden border border-border card-hover cursor-pointer"
                  onClick={() => openHotelPicker(dest)}
                >
                  {/* Match Badge */}
                  {i === 0 && (
                    <div
                      className="absolute top-4 left-4 z-20 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)', color: 'white' }}
                    >
                      <Star className="w-3 h-3" /> Top AI Pick
                    </div>
                  )}
                  {/* GRR Score Badge */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1">
                    <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-bold">
                      {dest.grrScore ? dest.grrScore.finalScore : dest.matchScore}% Match
                    </div>
                    {dest.grrScore && dest.grrScore.scoreDelta > 5 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/80 text-white text-[10px] font-bold">
                        <TrendingDown className="w-2.5 h-2.5" /> GRR −{dest.grrScore.scoreDelta}
                      </div>
                    )}
                  </div>

                  {/* Photo Carousel */}
                  <PhotoCarousel
                    photos={dest.photos && dest.photos.length > 0 ? dest.photos : []}
                    height={200}
                    overlay={
                      <div className="absolute bottom-4 left-5 z-10">
                        <div className="text-3xl mb-1">{dest.emoji}</div>
                        <h3 className="text-white text-xl font-black drop-shadow">{dest.city}</h3>
                        <p className="text-white/75 text-sm drop-shadow">{dest.country} · {dest.region}</p>
                      </div>
                    }
                  />

                  {/* Content */}
                  <div className="p-5">
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">{dest.description}</p>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <StatChip icon={Shield} label="Safety" value={`${dest.safety.safetyIndex}%`} color="text-emerald-400" />
                      <StatChip
                        icon={Activity}
                        label="Risk"
                        value={dest.safety.geopoliticalRisk.toUpperCase()}
                        color={getRiskColor(dest.safety.geopoliticalRisk)}
                      />
                      <StatChip icon={Cloud} label="Best Month" value={dest.weather[0]?.month || requirements?.travelMonth || 'Year-round'} color="text-cyan-400" />
                    </div>

                    {/* Highlights */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dest.highlights.slice(0, 3).map(h => (
                        <span key={h} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          <Check className="w-3 h-3 text-violet-400" />{h}
                        </span>
                      ))}
                    </div>

                    {/* Budget + Select */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2 flex-wrap">
                        {dest.budgetRange.map(b => (
                          <span key={b} className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBudgetBadgeColor(b)}`}>
                            {b}
                          </span>
                        ))}
                      </div>
                      <motion.button
                        className="flex items-center gap-1 text-sm font-semibold text-violet-400 hover:text-violet-300 shrink-0"
                        whileHover={{ x: 4 }}
                        onClick={e => { e.stopPropagation(); openHotelPicker(dest); }}
                      >
                        <Hotel className="w-3.5 h-3.5" /> Choose Hotel
                      </motion.button>
                    </div>

                    {/* GRR Advisory */}
                    {dest.grrScore && <GRRAdvisoryBanner grrScore={dest.grrScore} />}

                    {/* AI Insight Expandable */}
                    {(dest.aiReasoning || dest.suggestedHotels?.length || dest.mustDoActivity) && (
                      <AIInsightPanel dest={dest} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        )}
      </div>

      {/* Hotel Picker Modal */}
      <AnimatePresence>
        {pendingDest && (
          <HotelPickerModal
            hotels={hotelOptions}
            destination={pendingDest}
            groupSize={requirements?.groupSize ?? 2}
            duration={requirements?.duration ?? 7}
            onSelect={handleHotelConfirm}
            onClose={() => setPendingDest(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatChip({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-muted rounded-xl p-2.5 text-center">
      <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
      <div className={`text-xs font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
