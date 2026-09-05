'use client';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import {
  ArrowRight, Printer, Download, Loader2,
  Shield, CloudSun, Globe, AlertTriangle, Brain,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── AI Analysis types ────────────────────────────────────────────────────────
interface AIAnalysis {
  crimeAnalysis: string;
  crimeRealWorld: string;
  weatherAnalysis: string;
  weatherMonthly: string;          // full 12-month weather breakdown
  geopoliticalAnalysis: string;
  geopoliticalRealWorld: string;
  _isFallback?: boolean;           // set by API when Gemini is unavailable
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3.5 rounded-full bg-muted"
          style={{ width: `${i === lines - 1 ? 65 : 100}%`, opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}

// ─── AI Analysis Card ─────────────────────────────────────────────────────────
interface AnalysisCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  text: string | null;
  realWorldText?: string | null;   // optional current-situation paragraph
  realWorldLabel?: string;
  loading: boolean;
  gradient: string;
  iconColor: string;
  borderColor: string;
  accentColor?: string;            // tailwind color token prefix e.g. 'red'
}

function AnalysisCard({
  icon: Icon, title, subtitle, text, realWorldText, realWorldLabel,
  loading, gradient, iconColor, borderColor, accentColor = 'violet',
}: AnalysisCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 ${borderColor}`}
      style={{ background: gradient }}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <div>
          <div className="font-bold text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        {loading && (
          <div className="ml-auto">
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          </div>
        )}
      </div>

      {/* Primary analysis */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="skeleton" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Skeleton lines={3} />
          </motion.div>
        ) : (
          <motion.p
            key="text"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-sm text-foreground/85 leading-relaxed"
          >
            {text}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Current situation sub-paragraph */}
      {(realWorldText || loading) && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              {realWorldLabel ?? 'Current Situation'}
            </span>
          </div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="rw-skeleton" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Skeleton lines={2} />
              </motion.div>
            ) : (
              <motion.p
                key="rw-text"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="text-sm text-amber-200/80 leading-relaxed"
              >
                {realWorldText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReportStep() {
  const { tripPlan, selectedDestination, itinerary, costs, requirements, finalizePlan, setStep } = useAppStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // AI analysis state — NOT auto-fetched; user must click "Generate"
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);      // true only on network/parse failure
  const [isFallback, setIsFallback] = useState(false); // true when API served fallback data
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAnalysis = async () => {
    if (!selectedDestination || !requirements) return;
    setAiLoading(true);
    setAiError(false);
    setIsFallback(false);
    setAiAnalysis(null);
    setHasFetched(true);
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: selectedDestination,
          travelMonth: requirements.travelMonth,
        }),
      });
      // API always returns 200 — either live Gemini data or enriched fallback
      if (!res.ok) throw new Error(`Network error ${res.status}`);
      const data: AIAnalysis = await res.json();
      if (data._isFallback) setIsFallback(true);
      setAiAnalysis(data);
    } catch (err) {
      console.error('[ReportStep] AI analysis fetch failed:', err);
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  if (!selectedDestination || !costs || !requirements) return null;

  const handleProceedToBooking = () => {
    finalizePlan();
    setStep('booking');
  };

  const handlePrint = () => {
    toast.success('Opening print dialog…');
    setTimeout(() => window.print(), 200);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    const toastId = toast.loading('Generating PDF…');
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const patchModernColors = (docClone: Document) => {
        const unsupported = /\b(oklch|lab|lch|color\s*\(|display-p3)\b/i;
        const allEls = Array.from(docClone.querySelectorAll('*')) as HTMLElement[];
        allEls.forEach(el => {
          const orig = document.querySelector(
            el.tagName + (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : '')
          ) as HTMLElement | null;
          if (!orig) return;
          const cs = window.getComputedStyle(orig);
          const props: (keyof CSSStyleDeclaration)[] = ['backgroundColor', 'color', 'borderColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];
          props.forEach(prop => {
            const val = cs[prop] as string;
            if (val && unsupported.test(val)) {
              (el.style as unknown as Record<string, string>)[prop as string] = val;
            }
          });
        });
      };

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0d0d14',
        logging: false,
        onclone: (_doc, el) => {
          const cloneDoc = el.ownerDocument;
          Array.from(cloneDoc.styleSheets).forEach(sheet => {
            try {
              const rules = Array.from(sheet.cssRules || []);
              if (rules.some(r => /oklch|lab\(|lch\(/.test(r.cssText))) {
                (sheet as CSSStyleSheet & { disabled: boolean }).disabled = true;
              }
            } catch { /* cross-origin — skip */ }
          });
          patchModernColors(cloneDoc);
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, imgW, imgH);
        yOffset += pageH;
      }

      const filename = `Voyago_${selectedDestination.city}_TripReport.pdf`;
      pdf.save(filename);
      toast.success(`PDF saved as "${filename}"`, { id: toastId });
    } catch (err) {
      console.error('[PDF export]', err);
      toast.error('PDF generation failed. Please try Print instead.', { id: toastId });
    } finally {
      setPdfLoading(false);
    }
  };

  const safetyIndex = selectedDestination.safety.safetyIndex;

  return (
    <div className="min-h-screen pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-black mb-2">
            Your <span className="gradient-text">Trip Report</span>
          </h2>
          <p className="text-muted-foreground">Complete summary of your planned adventure</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6 no-print">
          <motion.button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30 hover:bg-violet-500/20 text-violet-300 text-sm font-semibold transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Printer className="w-4 h-4" /> Print Trip Report
          </motion.button>

          <motion.button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-300 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            whileHover={pdfLoading ? {} : { scale: 1.02 }}
            whileTap={pdfLoading ? {} : { scale: 0.97 }}
          >
            {pdfLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
              : <><Download className="w-4 h-4" /> Download PDF</>
            }
          </motion.button>
        </div>

        {/* Print-only header */}
        <div className="print-only hidden mb-6">
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
            <div className="text-2xl font-black">✈ VOYAGO</div>
            <div className="text-sm text-gray-600">Official Trip Planning Report</div>
            <div className="text-xs text-gray-400 mt-1">Generated on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Report Content */}
        <div ref={reportRef} className="bg-card rounded-3xl border border-border overflow-hidden">
          {/* Report Header */}
          <div className="p-8 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #1a1040, #0f2a4a, #0a2030)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="text-[200px] absolute -right-10 -top-10">{selectedDestination.emoji}</div>
            </div>
            <div className="relative z-10">
              <div className="text-xs text-white/50 mb-4 uppercase tracking-widest">Voyago — Official Trip Report</div>
              <h1 className="text-4xl font-black mb-2">{selectedDestination.city} Trip</h1>
              <p className="text-white/60">{selectedDestination.country} · {selectedDestination.tagline}</p>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <ReportStat label="Traveller" value={requirements.name} />
                <ReportStat label="Duration" value={`${requirements.duration} days`} />
                <ReportStat label="Group Size" value={`${requirements.groupSize} people`} />
                <ReportStat label="Travel Month" value={requirements.travelMonth} />
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Trip Overview */}
            <Section title="🌍 Destination Overview">
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedDestination.description}</p>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoBox label="Language" value={selectedDestination.cultural.language} />
                <InfoBox label="Currency" value={selectedDestination.cultural.currency.split('—')[0]} />
                <InfoBox label="Religion" value={selectedDestination.cultural.religion} />
                <InfoBox label="Timezone" value={selectedDestination.cultural.timezone} />
              </div>
            </Section>

            <Divider />

            {/* Itinerary */}
            <Section title="📅 Day-by-Day Itinerary">
              <div className="space-y-4">
                {itinerary.map(day => (
                  <div key={day.id} className="border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-muted font-bold text-sm flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg text-white text-xs flex items-center justify-center font-black"
                        style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
                        {day.day}
                      </span>
                      Day {day.day} — {day.location} | Hotel: {day.hotel}
                    </div>
                    <div className="p-4">
                      {day.attractions.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">ATTRACTIONS</p>
                          {day.attractions.map(att => (
                            <div key={att.id} className="flex items-center gap-2 text-sm py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                              <span>{att.name}</span>
                              <span className="text-muted-foreground text-xs ml-auto">{att.timeNeeded} · {att.entryFee === 0 ? 'Free' : formatCurrency(att.entryFee)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {day.activities.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">ACTIVITIES</p>
                          {day.activities.map(act => (
                            <div key={act.id} className="flex items-center gap-2 text-sm py-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                              <span>{act.name}</span>
                              <span className="text-muted-foreground text-xs ml-auto">{formatCurrency(act.cost)}/person</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground italic">{day.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Divider />

            {/* Cost Summary */}
            <Section title="💰 Cost Summary">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Visa', value: costs.visa * requirements.groupSize },
                  { label: 'Flights', value: costs.flights },
                  { label: 'Hotel', value: costs.totalHotel },
                  { label: 'Food', value: costs.totalFood },
                  { label: 'Activities', value: costs.activities },
                  { label: 'Shopping', value: costs.shopping },
                  { label: 'Transport', value: costs.transport },
                  { label: 'Insurance', value: costs.insurance },
                  { label: 'Miscellaneous', value: costs.miscellaneous },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center p-3 bg-muted rounded-xl text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl text-center text-white"
                style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}>
                <div className="text-sm mb-1">Total Estimated Cost</div>
                <div className="text-3xl font-black">{formatCurrency(costs.total)}</div>
                <div className="text-white/70 text-sm mt-1">≈ {formatCurrency(costs.total / requirements.groupSize)} per person</div>
              </div>
            </Section>

            <Divider />

            {/* ── AI Intelligence Report ── */}
            <Section title="">
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
                  >
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-lg">🤖 AI Intelligence Report</div>
                    <div className="text-xs text-muted-foreground">Gemini-powered deep analysis for {selectedDestination.city}</div>
                  </div>
                </div>
                {/* Retry button — only shown on error */}
                {aiError && !aiLoading && (
                  <button
                    onClick={fetchAnalysis}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Retry
                  </button>
                )}
              </div>

              {/* ── IDLE STATE — report not yet generated ── */}
              {!hasFetched && !aiLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-violet-500/30 p-8 text-center"
                  style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.05), rgba(6,182,212,0.03))' }}
                >
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
                    style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.2), rgba(6,182,212,0.15))' }}>
                    🛡️
                  </div>
                  <h4 className="font-black text-lg mb-2">Intelligence Report Ready to Generate</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
                    Get a Gemini AI–powered deep-dive into <strong className="text-foreground">{selectedDestination.city}</strong>'s
                    crime landscape, real-time weather intelligence for <strong className="text-foreground">{requirements?.travelMonth}</strong>,
                    and geopolitical scenario analysis — all written as detailed expert briefings.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                    {[
                      { icon: '🔴', label: 'Crime & Safety Analysis', desc: 'Detailed risk briefing' },
                      { icon: '🌤️', label: 'Weather Intelligence', desc: `${requirements?.travelMonth} + all 12 months` },
                      { icon: '📅', label: 'Monthly Weather Forecast', desc: 'Full year weather guide' },
                      { icon: '🌐', label: 'Geopolitical Scenario', desc: 'April 2026 political analysis' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-xs">
                        <span className="text-base">{item.icon}</span>
                        <div className="text-left">
                          <div className="font-semibold text-foreground">{item.label}</div>
                          <div className="text-muted-foreground">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    onClick={fetchAnalysis}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm flex items-center gap-2 mx-auto"
                    style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
                  >
                    <Brain className="w-4 h-4" />
                    Generate AI Intelligence Report
                  </motion.button>
                  <p className="text-xs text-muted-foreground mt-3">Uses Gemini AI · Takes ~5–10 seconds · One API call</p>
                </motion.div>
              )}

              {/* Error banner */}
              {aiError && !aiLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 mb-4 text-sm text-yellow-300"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Gemini analysis unavailable — check your API key or click Retry above.
                </motion.div>
              )}

              {/* Three analysis cards — shown once user has triggered generation */}
              {(hasFetched) && (
                <div className="grid grid-cols-1 gap-4">
                  <AnalysisCard
                    icon={Shield}
                    title="Crime & Safety Analysis"
                    subtitle={`Safety Index: ${selectedDestination.safety.safetyIndex}/100 · Crime Index: ${selectedDestination.safety.crimeIndex}/100`}
                    text={aiAnalysis?.crimeAnalysis ?? null}
                    realWorldText={aiAnalysis?.crimeRealWorld ?? null}
                    realWorldLabel="Real-World Crime Situation (April 2026)"
                    loading={aiLoading}
                    gradient="linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))"
                    iconColor="bg-red-500/20 text-red-400"
                    borderColor="border-red-500/20"
                    accentColor="red"
                  />
                  <AnalysisCard
                    icon={CloudSun}
                    title="Weather Intelligence"
                    subtitle={`Travel Month: ${requirements.travelMonth} · Seasonal deep-dive`}
                    text={aiAnalysis?.weatherAnalysis ?? null}
                    loading={aiLoading}
                    gradient="linear-gradient(135deg, rgba(6,182,212,0.06), rgba(6,182,212,0.02))"
                    iconColor="bg-cyan-500/20 text-cyan-400"
                    borderColor="border-cyan-500/20"
                    accentColor="cyan"
                  />
                  <AnalysisCard
                    icon={Globe}
                    title="Monthly Weather Forecast — Full Year"
                    subtitle={`All 12 months · ${selectedDestination.city} climate guide`}
                    text={aiAnalysis?.weatherMonthly ?? null}
                    loading={aiLoading}
                    gradient="linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))"
                    iconColor="bg-emerald-500/20 text-emerald-400"
                    borderColor="border-emerald-500/20"
                    accentColor="emerald"
                  />
                  <AnalysisCard
                    icon={Globe}
                    title="Geopolitical Scenario"
                    subtitle={`Risk Level: ${selectedDestination.safety.geopoliticalRisk.toUpperCase()} · April 2026 analysis`}
                    text={aiAnalysis?.geopoliticalAnalysis ?? null}
                    realWorldText={aiAnalysis?.geopoliticalRealWorld ?? null}
                    realWorldLabel="Real-World Political Situation (April 2026)"
                    loading={aiLoading}
                    gradient="linear-gradient(135deg, rgba(108,99,255,0.06), rgba(108,99,255,0.02))"
                    iconColor="bg-violet-500/20 text-violet-400"
                    borderColor="border-violet-500/20"
                    accentColor="violet"
                  />
                </div>
              )}

              {!aiLoading && !aiError && aiAnalysis && !isFallback && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  ✨ Live analysis by Gemini AI · Geo-political data current as of April 2026 · Always verify with official government travel advisories.
                </p>
              )}
              {!aiLoading && !aiError && aiAnalysis && isFallback && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl border border-amber-500/25 bg-amber-500/5 text-xs text-amber-300/80">
                  <span className="mt-0.5 shrink-0">⚡</span>
                  <span>
                    <strong className="text-amber-300">Fallback Intelligence Mode</strong> — Gemini AI is currently unavailable (check your API key). This report was generated from destination data + our built-in knowledge base. Retry for a live Gemini analysis.
                  </span>
                </div>
              )}
              {!aiLoading && aiError && hasFetched && (
                <p className="text-xs text-red-400/70 mt-3 text-center">
                  ⚠️ Could not connect to the analysis service. Check your network connection and retry.
                </p>
              )}
            </Section>

            <Divider />

            {/* Safety Summary */}
            <Section title="🛡️ Safety Summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-emerald-400">{safetyIndex}%</div>
                      <div className="text-xs text-muted-foreground">Safety Index</div>
                    </div>
                    <div className="flex-1 bg-muted rounded-xl p-3 text-center">
                      <div className={`text-2xl font-black ${selectedDestination.safety.geopoliticalRisk === 'low' ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {selectedDestination.safety.geopoliticalRisk.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground">Geo-Political Risk</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{selectedDestination.safety.travelAdvisory}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground uppercase">Top 3 Things to Remember</p>
                  {selectedDestination.cultural.importantNotes.slice(0, 3).map((note, i) => (
                    <div key={i} className="text-xs p-2 bg-muted rounded-lg mb-1">{note}</div>
                  ))}
                </div>
              </div>
            </Section>

            <Divider />

            {/* Footer */}
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">Report generated by Voyago · {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-muted-foreground">All costs are estimates. Actual prices may vary.</p>
            </div>
          </div>
        </div>

        {/* Proceed to Booking */}
        <motion.button
          onClick={handleProceedToBooking}
          className="w-full mt-6 py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Proceed to Booking <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/10 rounded-xl p-3">
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="text-sm font-bold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <h3 className="font-black text-lg mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted rounded-xl p-3 text-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xs font-bold">{value}</div>
    </div>
  );
}
