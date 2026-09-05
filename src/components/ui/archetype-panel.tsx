'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { UserArchetype } from '@/lib/types';

interface ArchetypePanelProps {
  archetype: UserArchetype;
  compact?: boolean;
}

const DIMENSION_CONFIG = [
  {
    key: 'riskSeeker' as keyof UserArchetype,
    label: 'Risk Appetite',
    lowLabel: 'Cautious',
    highLabel: 'Thrill Seeker',
    colorLow: '#10B981',
    colorHigh: '#EF4444',
    emoji: '⚡',
  },
  {
    key: 'luxuryOriented' as keyof UserArchetype,
    label: 'Comfort Level',
    lowLabel: 'Budget',
    highLabel: 'Ultra-Luxury',
    colorLow: '#06B6D4',
    colorHigh: '#F59E0B',
    emoji: '👑',
  },
  {
    key: 'socialTraveler' as keyof UserArchetype,
    label: 'Social Style',
    lowLabel: 'Solo',
    highLabel: 'Group',
    colorLow: '#8B5CF6',
    colorHigh: '#EC4899',
    emoji: '🤝',
  },
  {
    key: 'culturalDepth' as keyof UserArchetype,
    label: 'Cultural Immersion',
    lowLabel: 'Surface',
    highLabel: 'Deep Dive',
    colorLow: '#F97316',
    colorHigh: '#6C63FF',
    emoji: '🏛️',
  },
];

function interpolateColor(low: string, high: string, value: number): string {
  // Simple interpolation based on value 0-100
  return value >= 60 ? high : value >= 40 ? '#94A3B8' : low;
}

export function ArchetypePanel({ archetype, compact = false }: ArchetypePanelProps) {
  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="text-2xl">{archetype.emoji}</div>
          <div>
            <div className="font-bold text-sm text-violet-300">{archetype.label}</div>
            <div className="text-xs text-muted-foreground">Your Traveler DNA</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DIMENSION_CONFIG.map(dim => {
            const value = archetype[dim.key] as number;
            const color = interpolateColor(dim.colorLow, dim.colorHigh, value);
            return (
              <div key={dim.key}>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{dim.lowLabel}</span>
                  <span className="font-medium" style={{ color }}>{value}</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="bg-card rounded-2xl border border-border overflow-hidden"
      >
        {/* Header */}
        <div
          className="p-5 flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.1), rgba(6,182,212,0.05))' }}
        >
          <motion.div
            key={archetype.label}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl"
          >
            {archetype.emoji}
          </motion.div>
          <div className="flex-1">
            <motion.div
              key={archetype.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-black text-lg gradient-text"
            >
              {archetype.label}
            </motion.div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{archetype.description}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Traveler DNA</div>
            <div className="text-xs text-violet-400 font-bold mt-0.5">Live Profile</div>
          </div>
        </div>

        {/* Dimension bars */}
        <div className="p-5 space-y-4">
          {DIMENSION_CONFIG.map((dim, i) => {
            const value = archetype[dim.key] as number;
            const color = interpolateColor(dim.colorLow, dim.colorHigh, value);
            const label = value >= 70 ? dim.highLabel : value >= 40 ? 'Balanced' : dim.lowLabel;

            return (
              <motion.div
                key={dim.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{dim.emoji}</span>
                    <span className="text-xs font-medium text-muted-foreground">{dim.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color }}>{label}</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-mono font-bold" style={{ color }}>
                      {value}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative">
                  <motion.div
                    className="h-full rounded-full relative"
                    style={{ background: `linear-gradient(90deg, ${dim.colorLow}, ${color})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground/60">
                  <span>{dim.lowLabel}</span>
                  <span>{dim.highLabel}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-muted-foreground/60 text-center">
            🔄 DNA updates live as you adjust your preferences
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
