'use client';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const STEPS = [
  { label: 'Requirements', appStep: 'requirements' },
  { label: 'Destinations', appStep: 'recommendations' },
  { label: 'Itinerary',    appStep: 'itinerary' },
  { label: 'Costs',        appStep: 'costs' },
  { label: 'Safety',       appStep: 'safety' },
  { label: 'Trip Report',  appStep: 'report' },
  { label: 'Booking',      appStep: 'booking' },
] as const;

type NavStep = typeof STEPS[number]['appStep'];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  // currentStep mirrors STEP_ORDER index from page.tsx:
  // 0=welcome,1=req,2=recs,3=itinerary,4=costs,5=safety,6=report,7=booking,8=confirmed
  // STEPS array here maps 1-to-1: index 0 → requirements (STEP_ORDER[1])
  const { step, setStep, requirements, selectedDestination, costs } = useAppStore();
  const active = currentStep - 1; // offset; 0 = requirements pill

  const canNavigateTo = (stepName: NavStep): boolean => {
    switch (stepName) {
      case 'requirements': return true;
      case 'recommendations': return !!requirements;
      case 'itinerary': return !!selectedDestination;
      case 'costs': return !!selectedDestination;
      case 'safety': return !!selectedDestination;
      case 'report': return !!selectedDestination && !!costs;
      case 'booking': return !!selectedDestination && !!costs;
      default: return false;
    }
  };

  const handleClick = (stepName: NavStep, index: number) => {
    // Allow navigating to completed steps or the current step
    if (index <= active && canNavigateTo(stepName)) {
      setStep(stepName);
    }
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-5xl mx-auto px-4 py-3 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STEPS.map(({ label, appStep }, i) => {
            const done = i < active;
            const current = i === active;
            const clickable = done && canNavigateTo(appStep);

            return (
              <div key={label} className="flex items-center">
                <motion.button
                  onClick={() => handleClick(appStep, i)}
                  disabled={!clickable && !current}
                  whileHover={clickable ? { scale: 1.05 } : {}}
                  whileTap={clickable ? { scale: 0.95 } : {}}
                  title={clickable ? `Go to ${label}` : label}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    done
                      ? clickable
                        ? 'step-complete cursor-pointer hover:brightness-125 hover:shadow-md'
                        : 'step-complete'
                      : current
                      ? 'step-active'
                      : 'step-inactive cursor-default'
                  }`}
                >
                  {done ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
                  <span className={current ? 'block' : 'hidden sm:block'}>{label}</span>
                </motion.button>
                {i < STEPS.length - 1 && (
                  <motion.div
                    className="w-6 h-0.5 mx-1 rounded-full"
                    style={{ background: done ? 'var(--brand-emerald)' : 'var(--border)' }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
