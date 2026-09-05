'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UnsplashPhoto } from '@/lib/types';

interface PhotoCarouselProps {
  photos: UnsplashPhoto[];
  height?: number;
  className?: string;
  overlay?: React.ReactNode; // content to render on top of photo
}

export function PhotoCarousel({ photos, height = 200, className = '', overlay }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(photos.map(() => false));
  const [errored, setErrored] = useState<boolean[]>(photos.map(() => false));

  // Auto-advance every 4s
  useEffect(() => {
    if (photos.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(i => (i + 1) % photos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [photos.length]);

  const markLoaded = (i: number) =>
    setLoaded(prev => { const n = [...prev]; n[i] = true; return n; });
  const markErrored = (i: number) =>
    setErrored(prev => { const n = [...prev]; n[i] = true; return n; });

  const GRADIENT_FALLBACKS = [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #0d1b2a 0%, #1b4332 50%, #2d6a4f 100%)',
    'linear-gradient(135deg, #2c1654 0%, #6c2fa8 50%, #9b5de5 100%)',
  ];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Stacked images */}
      {photos.map((photo, i) => (
        <div key={photo.url + i} className="absolute inset-0">
          <AnimatePresence>
            {i === activeIndex && (
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Blur placeholder */}
                {!loaded[i] && !errored[i] && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ background: GRADIENT_FALLBACKS[i % GRADIENT_FALLBACKS.length] }}
                  />
                )}

                {/* Actual photo */}
                {!errored[i] && (
                  <img
                    src={photo.thumbUrl}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                    style={{ opacity: loaded[i] ? 1 : 0, transition: 'opacity 0.5s' }}
                    onLoad={() => markLoaded(i)}
                    onError={() => markErrored(i)}
                    loading="lazy"
                  />
                )}

                {/* Gradient fallback on error */}
                {errored[i] && (
                  <div
                    className="absolute inset-0"
                    style={{ background: GRADIENT_FALLBACKS[i % GRADIENT_FALLBACKS.length] }}
                  />
                )}

                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Content overlay */}
      {overlay && (
        <div className="absolute inset-0 z-10">
          {overlay}
        </div>
      )}

      {/* Dot indicators */}
      {photos.length > 1 && (
        <div className="absolute bottom-3 right-3 z-20 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); setActiveIndex(i); }}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 16 : 6,
                height: 6,
                background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Unsplash attribution */}
      <a
        href="https://unsplash.com"
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="absolute bottom-2 left-3 z-20 text-[9px] text-white/40 hover:text-white/70 transition-colors"
      >
        Photos by Unsplash
      </a>
    </div>
  );
}
