'use client';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import { computeTSI } from '@/lib/tsi-engine';
import { TSIPanel } from '@/components/ui/tsi-panel';
import { ArrowRight, ShieldAlert, AlertTriangle, CheckCircle, XCircle, Cloud, Shirt, Dumbbell, Landmark, Info } from 'lucide-react';

export function SafetyStep() {
  const { selectedDestination, requirements, setStep } = useAppStore();
  if (!selectedDestination) return null;

  const { safety, cultural, weather, activities } = selectedDestination;
  const weatherForMonth = weather.find(w => w.month === requirements?.travelMonth) || weather[0];
  const adventureActivities = activities.filter(a => a.type === 'adventure' || a.type === 'sports');
  const culturalActivities = activities.filter(a => a.type === 'cultural' || a.type === 'recreational');

  // Compute TSI (Module 1)
  const tsi = requirements
    ? computeTSI(selectedDestination, requirements)
    : null;

  const riskColor = safety.geopoliticalRisk === 'low' ? 'text-emerald-400 bg-emerald-400/10' :
    safety.geopoliticalRisk === 'medium' ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10';

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-black mb-2">
            <span className="gradient-text">Safety, Culture & Weather</span>
          </h2>
          <p className="text-muted-foreground">{selectedDestination.city}, {selectedDestination.country}</p>
        </motion.div>

        {/* TSI Score Panel (Module 1) */}
        {tsi && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <TSIPanel tsi={tsi} />
          </motion.div>
        )}

        {/* Legacy Safety Details */}
        <Card title="Geopolitical Detail & Advisories" icon={ShieldAlert} color="#10B981">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <SafetyMeter label="Safety Index" value={safety.safetyIndex} color="#10B981" />
            <SafetyMeter label="Crime Index" value={safety.crimeIndex} color="#FF6B6B" invert />
            <div className="col-span-2 bg-muted rounded-xl p-4">
              <div className="text-xs text-muted-foreground mb-1 uppercase font-medium">Geo-Political Status</div>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${riskColor}`}>
                {safety.geopoliticalRisk === 'low' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {safety.geopoliticalRisk.toUpperCase()} RISK
              </span>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{safety.geopoliticalStatus}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase mb-3">Major Crime Types & Prevalence</p>
            <div className="space-y-2">
              {safety.majorCrimes.map(crime => (
                <div key={crime.type} className="flex items-center gap-3">
                  <div className="text-xs w-44 text-muted-foreground truncate">{crime.type}</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: crime.percentage > 25 ? '#FF6B6B' : crime.percentage > 15 ? '#F59E0B' : '#10B981' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${crime.percentage}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                  <div className="text-xs font-bold w-10 text-right">{crime.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">{safety.travelAdvisory}</p>
          </div>
        </Card>

        {/* Weather & Clothing */}
        <Card title={`Weather in ${requirements?.travelMonth || 'Your Travel Month'}`} icon={Cloud} color="#06B6D4">
          {weatherForMonth ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <WeatherRow label="Temperature" value={weatherForMonth.temp} />
                <WeatherRow label="Condition" value={weatherForMonth.condition} />
                <WeatherRow label="Humidity" value={weatherForMonth.humidity} />
                <WeatherRow label="UV Index" value={weatherForMonth.uvIndex} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2 flex items-center gap-2">
                  <Shirt className="w-4 h-4" /> What to Pack
                </p>
                <div className="flex flex-wrap gap-2">
                  {weatherForMonth.recommendedClothes.map(item => (
                    <span key={item} className="px-3 py-1.5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Weather data for your selected month is not available. Please check a local weather service.</p>
          )}
        </Card>

        {/* Cultural Attractions */}
        <Card title="Cultural Attractions" icon={Landmark} color="#F59E0B">
          <div className="flex flex-wrap gap-2 mb-4">
            {cultural.attractions.map(a => (
              <span key={a} className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">{a}</span>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase mb-2">✅ Dos</p>
              <ul className="space-y-1">
                {cultural.dos.map(d => (
                  <li key={d} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{d}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 uppercase mb-2">❌ Don'ts</p>
              <ul className="space-y-1">
                {cultural.donts.map(d => (
                  <li key={d} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />{d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <InfoChip label="Language" value={cultural.language} />
            <InfoChip label="Currency" value={cultural.currency.split('—')[0]} />
            <InfoChip label="Religion" value={cultural.religion} />
            <InfoChip label="Timezone" value={cultural.timezone} />
          </div>
        </Card>

        {/* Important Notes */}
        <Card title="Important Notes & Prohibited Items" icon={AlertTriangle} color="#FF6B6B">
          <div className="space-y-2">
            {cultural.importantNotes.map((note, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl bg-red-500/5 border border-red-400/20 text-sm"
              >
                {note}
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Activities */}
        <Card title="Sports, Adventure & Recreational Activities" icon={Dumbbell} color="#8B5CF6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...adventureActivities, ...culturalActivities].map(act => (
              <div key={act.id} className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold text-sm">{act.name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    act.type === 'adventure' ? 'bg-red-500/10 text-red-400' :
                    act.type === 'sports' ? 'bg-blue-500/10 text-blue-400' : 'bg-violet-500/10 text-violet-400'
                  }`}>{act.type}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{act.description}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>⏱ {act.duration}</span>
                  <span>💵 {formatCurrency(act.cost)}/person</span>
                  {act.difficulty && <span>💪 {act.difficulty}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <motion.button
          onClick={() => setStep('report')}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Generate Trip Report <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

function Card({ title, icon: Icon, color, children }: { title: string; icon: any; color: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="font-bold">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function SafetyMeter({ label, value, color, invert }: { label: string; value: number; color: string; invert?: boolean }) {
  const display = invert ? 100 - value : value;
  return (
    <div className="bg-muted rounded-xl p-4 text-center">
      <div className="text-2xl font-black mb-1" style={{ color }}>{value}</div>
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function WeatherRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-xl p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
}
