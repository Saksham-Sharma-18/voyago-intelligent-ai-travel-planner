'use client';
import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <motion.div
      className="bg-card rounded-3xl overflow-hidden border border-border"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Photo skeleton */}
      <div className="h-48 bg-muted relative overflow-hidden">
        <div className="absolute inset-0 shimmer" />
      </div>

      <div className="p-5 space-y-4">
        {/* Title skeleton */}
        <div className="space-y-2">
          <div className="h-5 w-2/3 rounded-lg bg-muted relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="h-3 w-1/2 rounded-lg bg-muted relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>

        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 w-full rounded-lg bg-muted relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
          <div className="h-3 w-5/6 rounded-lg bg-muted relative overflow-hidden">
            <div className="absolute inset-0 shimmer" />
          </div>
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-16 rounded-xl bg-muted relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>

        {/* Tags skeleton */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-6 w-20 rounded-full bg-muted relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
}
