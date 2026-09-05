'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { WelcomeStep } from '@/components/steps/welcome-step';
import { RequirementsStep } from '@/components/steps/requirements-step';
import { RecommendationsStep } from '@/components/steps/recommendations-step';
import { ItineraryStep } from '@/components/steps/itinerary-step';
import { CostsStep } from '@/components/steps/costs-step';
import { SafetyStep } from '@/components/steps/safety-step';
import { ReportStep } from '@/components/steps/report-step';
import { BookingStep } from '@/components/steps/booking-step';
import { ConfirmedStep } from '@/components/steps/confirmed-step';
import { Navbar } from '@/components/navbar';
import { StepIndicator } from '@/components/step-indicator';

const STEP_ORDER = ['welcome','requirements','recommendations','itinerary','costs','safety','report','booking','confirmed'] as const;

export default function Home() {
  const { step } = useAppStore();

  const stepIndex = STEP_ORDER.indexOf(step);

  // Scroll to top whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const renderStep = () => {
    switch (step) {
      case 'welcome': return <WelcomeStep />;
      case 'requirements': return <RequirementsStep />;
      case 'recommendations': return <RecommendationsStep />;
      case 'itinerary': return <ItineraryStep />;
      case 'costs': return <CostsStep />;
      case 'safety': return <SafetyStep />;
      case 'report': return <ReportStep />;
      case 'booking': return <BookingStep />;
      case 'confirmed': return <ConfirmedStep />;
      default: return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {step !== 'welcome' && step !== 'confirmed' && (
        <StepIndicator currentStep={stepIndex} />
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

