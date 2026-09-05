'use client';
import { motion } from 'framer-motion';
import { TSIResult } from '@/lib/types';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface TSIPanelProps {
  tsi: TSIResult;
  compact?: boolean;
}

// ─── Animated Radar / Pentagon Chart ──────────────────────────────────────────
function RadarChart({ components, color }: { components: TSIResult['components']; color: string }) {
  const SIZE = 120;
  const CENTER = SIZE / 2;
  const MAX_RADIUS = 45;
  const n = components.length;

  // Compute polygon points for a given radius multiplier per vertex
  function polygonPoints(values: number[], maxRadius: number): string {
    return values.map((val, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = (val / 100) * maxRadius;
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  }

  // Background grid lines (20, 40, 60, 80, 100)
  const gridLevels = [20, 40, 60, 80, 100];
  const axisAngles = components.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const dataPoints = polygonPoints(components.map(c => c.rawScore), MAX_RADIUS);
  const fullPoints = polygonPoints(Array(n).fill(100), MAX_RADIUS);

  // Label positions (outside the pentagon)
  const labelRadius = MAX_RADIUS + 14;
  const labels = components.map((c, i) => {
    const angle = axisAngles[i];
    return {
      x: CENTER + labelRadius * Math.cos(angle),
      y: CENTER + labelRadius * Math.sin(angle),
      name: c.name.split(' ')[0], // first word only
      score: Math.round(c.rawScore),
    };
  });

  return (
    <svg width={SIZE + 40} height={SIZE + 40} viewBox={`-20 -20 ${SIZE + 40} ${SIZE + 40}`} className="overflow-visible">
      {/* Background grid pentagons */}
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={polygonPoints(Array(n).fill(level), MAX_RADIUS)}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border opacity-40"
        />
      ))}

      {/* Axis lines */}
      {axisAngles.map((angle, i) => (
        <line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={CENTER + MAX_RADIUS * Math.cos(angle)}
          y2={CENTER + MAX_RADIUS * Math.sin(angle)}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-border opacity-30"
        />
      ))}

      {/* Data polygon */}
      <motion.polygon
        points={polygonPoints(Array(n).fill(0), MAX_RADIUS)}
        animate={{ points: dataPoints }}
        transition={{ duration: 1, ease: 'easeOut' }}
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={2}
      />

      {/* Data vertex dots */}
      {components.map((c, i) => {
        const angle = axisAngles[i];
        const r = (c.rawScore / 100) * MAX_RADIUS;
        const x = CENTER + r * Math.cos(angle);
        const y = CENTER + r * Math.sin(angle);
        return (
          <motion.circle
            key={i}
            cx={CENTER}
            cy={CENTER}
            animate={{ cx: x, cy: y }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + i * 0.05 }}
            r={3}
            fill={color}
            strokeWidth={1.5}
            stroke="white"
          />
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <g key={i}>
          <text
            x={l.x}
            y={l.y - 4}
            textAnchor="middle"
            fontSize={7}
            fill="currentColor"
            className="text-muted-foreground"
            fontWeight="500"
          >
            {l.name}
          </text>
          <text
            x={l.x}
            y={l.y + 6}
            textAnchor="middle"
            fontSize={8}
            fill={color}
            fontWeight="700"
          >
            {l.score}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Main TSI Panel ────────────────────────────────────────────────────────────
export function TSIPanel({ tsi, compact = false }: TSIPanelProps) {
  const riskIcon = tsi.riskLabel === 'Very Safe' || tsi.riskLabel === 'Safe'
    ? CheckCircle
    : tsi.riskLabel === 'Moderate'
    ? Shield
    : AlertTriangle;
  const RiskIcon = riskIcon;

  return (
    <div className={compact ? '' : 'bg-card rounded-2xl border border-border p-6'}>
      {!compact && (
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${tsi.riskColor}20` }}>
            <Shield className="w-5 h-5" style={{ color: tsi.riskColor }} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Travel Safety Index (TSI)</h3>
            <p className="text-xs text-muted-foreground">Voyago Composite Risk Score™</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-black" style={{ color: tsi.riskColor }}>{tsi.overallScore}</div>
            <div className="text-xs text-muted-foreground">/100</div>
          </div>
        </div>
      )}

      <div className={`flex flex-col md:flex-row gap-6 items-center ${compact ? '' : ''}`}>
        {/* Radar chart */}
        <div className="flex flex-col items-center">
          <RadarChart components={tsi.components} color={tsi.riskColor} />
          <div
            className="mt-2 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
            style={{ background: `${tsi.riskColor}20`, color: tsi.riskColor }}
          >
            <RiskIcon className="w-3.5 h-3.5" />
            {tsi.riskLabel}
          </div>
        </div>

        {/* Component breakdown */}
        <div className="flex-1 w-full space-y-3">
          {tsi.components.map((comp, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted-foreground">{comp.name}</span>
                <span className="text-xs font-bold" style={{ color: comp.rawScore >= 70 ? '#10B981' : comp.rawScore >= 50 ? '#F59E0B' : '#EF4444' }}>
                  {Math.round(comp.rawScore)}/100
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: comp.rawScore >= 70 ? '#10B981' : comp.rawScore >= 50 ? '#F59E0B' : '#EF4444' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${comp.rawScore}%` }}
                  transition={{ duration: 0.7, delay: i * 0.1 }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Weight: {Math.round(comp.weight * 100)}% · Contribution: {Math.round(comp.weightedScore)}/100
              </div>
            </div>
          ))}

          {/* Score modifiers */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-muted/60 rounded-xl p-2.5 text-center">
              <div className="text-xs text-muted-foreground">Geo Multiplier</div>
              <div className="text-sm font-black" style={{ color: tsi.geopoliticalMultiplier === 1 ? '#10B981' : tsi.geopoliticalMultiplier > 0.7 ? '#F59E0B' : '#EF4444' }}>
                ×{tsi.geopoliticalMultiplier.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted/60 rounded-xl p-2.5 text-center">
              <div className="text-xs text-muted-foreground">Seasonal</div>
              <div className="text-sm font-black" style={{ color: tsi.seasonalCorrection >= 0 ? '#10B981' : '#F59E0B' }}>
                {tsi.seasonalCorrection >= 0 ? '+' : ''}{tsi.seasonalCorrection} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory */}
      {!compact && (
        <div
          className="mt-4 p-3 rounded-xl text-xs leading-relaxed flex gap-2"
          style={{ background: `${tsi.riskColor}10`, border: `1px solid ${tsi.riskColor}30`, color: tsi.riskColor }}
        >
          <RiskIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-foreground/80">{tsi.advisory}</span>
        </div>
      )}
    </div>
  );
}
