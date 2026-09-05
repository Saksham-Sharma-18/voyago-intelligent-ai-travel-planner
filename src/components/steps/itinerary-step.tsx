'use client';
import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { ItineraryDay, TouristAttraction } from '@/lib/types';
import { computeFatigueScore } from '@/lib/airo-engine';
import { Plus, Trash2, GripVertical, Clock, IndianRupee, ArrowRight, MapPin, Info, Zap, RefreshCw, AlertTriangle, Activity, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getActivityPhoto, getAttractionPhoto, getDestinationHero } from '@/lib/photos';

// ─── Activity photo thumbnail ─────────────────────────────────────────────────
function ActivityPhoto({ name, city }: { name: string; city: string }) {
  const photo = getActivityPhoto(name, city);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) return (
    <div className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
      <Zap className="w-5 h-5 text-violet-400" />
    </div>
  );

  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 relative bg-muted">
      {!loaded && <div className="absolute inset-0 shimmer" />}
      <img
        src={photo.thumbUrl}
        alt={name}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s' }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}

// ─── Attraction photo thumbnail ───────────────────────────────────────────────
function AttractionPhoto({ name, type, city }: { name: string; type: string; city: string }) {
  const photo = getAttractionPhoto(name);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const typeColors: Record<string, string> = {
    temple: 'text-orange-400 bg-orange-400/10',
    museum: 'text-blue-400 bg-blue-400/10',
    landmark: 'text-purple-400 bg-purple-400/10',
    nature: 'text-emerald-400 bg-emerald-400/10',
    market: 'text-yellow-400 bg-yellow-400/10',
    shopping: 'text-pink-400 bg-pink-400/10',
  };
  const colorClass = typeColors[type.toLowerCase()] || 'text-cyan-400 bg-cyan-400/10';

  if (errored) return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${colorClass}`}>
      {type[0].toUpperCase()}
    </div>
  );

  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative bg-muted">
      {!loaded && <div className="absolute inset-0 shimmer" />}
      <img
        src={photo.thumbUrl}
        alt={name}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s' }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}

// ─── Fatigue Meter ───────────────────────────────────────────────────────────────
function FatigueMeter({ attractions }: { attractions: TouristAttraction[] }) {
  const score = computeFatigueScore(attractions);
  const color = score >= 80 ? '#EF4444' : score >= 60 ? '#F97316' : score >= 40 ? '#F59E0B' : '#10B981';
  const label = score >= 80 ? 'Very Tiring' : score >= 60 ? 'Tiring' : score >= 40 ? 'Moderate' : 'Relaxed';
  return (
    <div className="flex items-center gap-2">
      <Activity className="w-3.5 h-3.5" style={{ color }} />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>{label} ({score}/100)</span>
    </div>
  );
}

// ─── Main Itinerary Step ───────────────────────────────────────────────────────
export function ItineraryStep() {
  const { itinerary, setItinerary, selectedDestination, addDay, removeDay, removeAttraction, addAttraction, setStep,
    optimizedDays, airoConstraints, optimizeDayById, optimizeAllDays, updateAIROConstraints } = useAppStore();
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [showAIROSettings, setShowAIROSettings] = useState(false);

  const availableAttractions = selectedDestination?.attractions || [];
  const city = selectedDestination?.city || '';

  // Hero photo for the destination
  const heroPhoto = selectedDestination ? getDestinationHero(selectedDestination.id) : null;

  const handleAddAttraction = (dayId: string, attraction: TouristAttraction) => {
    const day = itinerary.find(d => d.id === dayId);
    if (day?.attractions.find(a => a.id === attraction.id)) {
      toast.error('Already added!');
      return;
    }
    addAttraction(dayId, attraction);
    setAddingToDay(null);
    toast.success(`Added ${attraction.name}!`);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      temple: 'text-orange-400 bg-orange-400/10',
      museum: 'text-blue-400 bg-blue-400/10',
      landmark: 'text-purple-400 bg-purple-400/10',
      nature: 'text-emerald-400 bg-emerald-400/10',
      market: 'text-yellow-400 bg-yellow-400/10',
      shopping: 'text-pink-400 bg-pink-400/10',
    };
    return colors[type.toLowerCase()] || 'text-cyan-400 bg-cyan-400/10';
  };

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Hero banner */}
        {heroPhoto && (
          <div className="relative h-40 rounded-3xl overflow-hidden mb-6 border border-border">
            <img src={heroPhoto.thumbUrl} alt={city} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-8">
              <div className="text-4xl mb-1">{selectedDestination?.emoji}</div>
              <h2 className="text-3xl md:text-4xl font-black text-white drop-shadow">
                Your <span className="gradient-text">{city}</span> Itinerary
              </h2>
              <p className="text-white/70 text-sm mt-1">Drag to reorder days · Add or remove attractions as you like</p>
            </div>
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer"
              className="absolute bottom-2 right-3 text-[9px] text-white/30 hover:text-white/60 transition-colors">
              Photo by Unsplash
            </a>
          </div>
        )}

        {!heroPhoto && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black mb-2">
              Your <span className="gradient-text">{city}</span> Itinerary
            </h2>
            <p className="text-muted-foreground">Drag to reorder days. Add or remove attractions as you like.</p>
          </motion.div>
        )}

        {/* AIRO Controls */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 bg-card rounded-2xl border border-border p-4">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold">AIRO™ Adaptive Optimizer</div>
              <div className="text-xs text-muted-foreground">Max {airoConstraints.maxHoursPerDay}h/day · $
              {airoConstraints.maxEntryFeePerDay} fee limit · Fatigue ≤ {airoConstraints.maxFatigueScore}</div>
            </div>
            <button
              onClick={() => { optimizeAllDays(); toast.success('All days optimized by AIRO! ⚡'); }}
              className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> Optimize All
            </button>
            <button
              onClick={() => setShowAIROSettings(v => !v)}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {showAIROSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-card border border-border border-t-0 rounded-b-2xl px-5 pb-4 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Max Hours / Day</label>
                  <div className="flex items-center gap-2">
                    {[6, 8, 10, 12].map(h => (
                      <button key={h}
                        onClick={() => updateAIROConstraints({ maxHoursPerDay: h })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          airoConstraints.maxHoursPerDay === h ? 'bg-violet-500/20 text-violet-400' : 'bg-muted text-muted-foreground'
                        }`}>{h}h</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Max Entry Fee / Day ($)</label>
                  <div className="flex items-center gap-2">
                    {[50, 100, 150, 200].map(f => (
                      <button key={f}
                        onClick={() => updateAIROConstraints({ maxEntryFeePerDay: f })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          airoConstraints.maxEntryFeePerDay === f ? 'bg-cyan-500/20 text-cyan-400' : 'bg-muted text-muted-foreground'
                        }`}>${f}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2 block">Max Fatigue Score</label>
                  <div className="flex items-center gap-2">
                    {[50, 65, 80, 100].map(f => (
                      <button key={f}
                        onClick={() => updateAIROConstraints({ maxFatigueScore: f })}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          airoConstraints.maxFatigueScore === f ? 'bg-emerald-500/20 text-emerald-400' : 'bg-muted text-muted-foreground'
                        }`}>{f}</button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <Reorder.Group axis="y" values={itinerary} onReorder={setItinerary} className="space-y-4">
          {itinerary.map((day) => (
            <Reorder.Item key={day.id} value={day}>
              <motion.div
                layout
                className="bg-card rounded-2xl border border-border overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Day Header */}
                <div className="flex items-center gap-3 p-4 border-b border-border cursor-grab active:cursor-grabbing"
                  style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(6,182,212,0.05))' }}>
                  <GripVertical className="w-5 h-5 text-muted-foreground/50" />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
                    D{day.day}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">Day {day.day} — {day.location}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {day.hotel}
                    </div>
                  </div>
                  {/* AIRO Re-optimize button */}
                  <button
                    onClick={() => { optimizeDayById(day.id); toast.success(`Day ${day.day} optimized by AIRO! ⚡`); }}
                    className="p-2 rounded-lg hover:bg-violet-500/10 text-muted-foreground hover:text-violet-400 transition-colors"
                    title="AIRO Re-optimize this day"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { removeDay(day.id); toast.success('Day removed'); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Attractions */}
                <div className="p-4 space-y-3">
                  {/* Fatigue meter */}
                  {day.attractions.length > 0 && (
                    <div className="bg-muted/30 rounded-xl px-3 py-2">
                      <div className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Day Fatigue</div>
                      <FatigueMeter attractions={day.attractions} />
                    </div>
                  )}

                  {/* AIRO violation alerts */}
                  {(() => {
                    const optDay = optimizedDays.find(od => od.dayId === day.id);
                    if (!optDay || optDay.violations.length === 0) return null;
                    return optDay.violations.map((v, vi) => (
                      <div key={vi} className={`flex items-start gap-2 p-2.5 rounded-xl text-xs ${
                        v.severity === 'critical' ? 'bg-red-500/10 border border-red-400/30' : 'bg-amber-500/10 border border-amber-400/30'
                      }`}>
                        <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${v.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
                        <div>
                          <div className={`font-medium ${v.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>{v.message}</div>
                          <div className="text-muted-foreground mt-0.5">{v.suggestedFix}</div>
                        </div>
                      </div>
                    ));
                  })()}

                  {day.attractions.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground text-sm">No attractions yet. Add some below.</div>
                  )}
                  {day.attractions.map(att => (
                    <motion.div
                      key={att.id}
                      layout
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 group"
                    >
                      {/* Attraction thumbnail photo */}
                      <AttractionPhoto name={att.name} type={att.type} city={city} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm">{att.name}</div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />{att.timeNeeded}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <IndianRupee className="w-3 h-3" />{att.entryFee === 0 ? 'Free' : formatCurrency(att.entryFee)}
                          </span>
                          <span className="text-xs text-muted-foreground">Best: {att.bestTime}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeAttraction(day.id, att.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Activities with photos */}
                  {day.activities.map(act => (
                    <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-violet-400/30 bg-violet-500/5">
                      {/* Activity photo thumbnail */}
                      <ActivityPhoto name={act.name} city={city} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-violet-300">{act.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{act.description}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{act.duration}</span>
                          <span className="text-xs text-muted-foreground">{formatCurrency(act.cost)}</span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 shrink-0">{act.type}</span>
                    </div>
                  ))}

                  {/* AI insight for day if available */}
                  {selectedDestination?.activityInsights && day.activities.length > 0 && (
                    (() => {
                      const firstAct = day.activities[0];
                      const tip = selectedDestination.activityInsights?.[firstAct.name];
                      if (!tip) return null;
                      return (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-400/20">
                          <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                        </div>
                      );
                    })()
                  )}

                  {/* Notes */}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/5 border border-blue-400/20">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{day.notes}</p>
                  </div>

                  {/* Add Attraction */}
                  {addingToDay === day.id ? (
                    <div className="border border-dashed border-border rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">Select an attraction to add:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {availableAttractions.map(att => (
                          <button
                            key={att.id}
                            onClick={() => handleAddAttraction(day.id, att)}
                            className="text-left p-2 rounded-lg hover:bg-violet-500/10 text-xs transition-colors border border-transparent hover:border-violet-500/30"
                          >
                            <div className="font-medium">{att.name}</div>
                            <div className="text-muted-foreground">{att.timeNeeded} · {att.entryFee === 0 ? 'Free' : formatCurrency(att.entryFee)}</div>
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setAddingToDay(null)} className="mt-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingToDay(day.id)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-violet-400/30 text-violet-400 text-sm hover:bg-violet-500/5 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Attraction
                    </button>
                  )}
                </div>
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add Day */}
        <motion.button
          onClick={() => { addDay(); toast.success('Day added!'); }}
          className="w-full mt-4 py-4 rounded-2xl border-2 border-dashed border-violet-400/30 text-violet-400 font-semibold hover:bg-violet-500/5 transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
        >
          <Plus className="w-5 h-5" /> Add Another Day
        </motion.button>

        {/* Continue */}
        <motion.button
          onClick={() => setStep('costs')}
          className="w-full mt-6 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Review Costs <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
