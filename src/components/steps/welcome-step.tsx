'use client';
import { motion } from 'framer-motion';
import { Plane, Globe2, Map, Shield, Star, ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const features = [
  { icon: Globe2, title: 'AI Recommendations', desc: 'Personalized destination matches based on your preferences' },
  { icon: Map, title: 'Smart Itinerary', desc: 'Drag-and-drop day planner with real attractions & timing' },
  { icon: Star, title: 'Cost Breakdown', desc: 'Transparent pricing — visa, hotels, food, activities & more' },
  { icon: Shield, title: 'Safety & Culture Guide', desc: 'Crime data, geo-political status, dos & don\'ts' },
  { icon: Sparkles, title: 'Trip Report & Booking', desc: 'Full PDF report + simulated payment & confirmation' },
];

const floatingCards = [
  { emoji: '🗼', city: 'Paris', country: 'France', delay: 0 },
  { emoji: '🏯', city: 'Tokyo', country: 'Japan', delay: 1 },
  { emoji: '🌴', city: 'Bali', country: 'Indonesia', delay: 2 },
  { emoji: '🏙️', city: 'Dubai', country: 'UAE', delay: 0.5 },
];

export function WelcomeStep() {
  const { setStep } = useAppStore();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-20 animate-aurora"
            style={{
              width: `${200 + i * 80}px`,
              height: `${200 + i * 80}px`,
              left: `${10 + i * 15}%`,
              top: `${5 + i * 12}%`,
              background: i % 2 === 0
                ? 'radial-gradient(circle, #6C63FF, transparent)'
                : 'radial-gradient(circle, #06B6D4, transparent)',
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}
      </div>

      {/* Floating destination cards */}
      <div className="absolute inset-0 pointer-events-none">
        {floatingCards.map((card, i) => (
          <motion.div
            key={i}
            className="absolute glass rounded-2xl p-3 hidden md:flex items-center gap-3"
            style={{
              right: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
              left: i % 2 !== 0 ? `${2 + i * 2}%` : undefined,
              top: `${20 + i * 15}%`,
            }}
            animate={{ y: [0, -12, 0], rotate: [0, 1, -1, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: card.delay, ease: 'easeInOut' }}
          >
            <span className="text-2xl">{card.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-white">{card.city}</div>
              <div className="text-xs text-white/60">{card.country}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm font-medium text-white/80">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            AI-Powered Premium Travel Planning
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none">
            Travel Without
            <br />
            <span className="gradient-text">Limits</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-12 leading-relaxed">
            From dream destination to confirmed booking — your complete premium travel experience, crafted by AI in minutes.
          </p>

          <motion.button
            onClick={() => setStep('requirements')}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-white overflow-hidden animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #06B6D4)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Plane className="w-5 h-5" />
            Plan My Dream Trip
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-20 max-w-5xl w-full pb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              className="glass rounded-2xl p-4 text-white card-hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <f.icon className="w-8 h-8 mb-3 text-cyan-400" />
              <div className="font-semibold text-sm mb-1">{f.title}</div>
              <div className="text-xs text-white/60 leading-relaxed">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
