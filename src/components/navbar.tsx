'use client';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Sun, Moon, Plane, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const { step, reset } = useAppStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16">
      <div className="glass-dark dark:glass h-full px-6 flex items-center justify-between border-b border-white/10">
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold gradient-text">Voyago</span>
        </motion.div>

        <div className="flex items-center gap-3">
          {step !== 'welcome' && (
            <motion.button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:block">Start Over</span>
            </motion.button>
          )}
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>
    </nav>
  );
}
