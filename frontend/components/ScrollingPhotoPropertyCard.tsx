'use client';

import { useState, useEffect } from 'react';

// Visual “slides” for the scrolling gallery (gradients + label so no external images needed)
const SLIDES = [
  { label: 'Living', gradient: 'from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/30' },
  { label: 'Bedroom', gradient: 'from-sky-100 to-blue-200 dark:from-sky-900/30 dark:to-blue-900/30' },
  { label: 'Kitchen', gradient: 'from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30' },
  { label: 'View', gradient: 'from-violet-100 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30' },
  { label: 'Amenity', gradient: 'from-rose-100 to-pink-200 dark:from-rose-900/30 dark:to-pink-900/30' },
];

export default function ScrollingPhotoPropertyCard() {
  const [scrollIndex, setScrollIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollIndex((i) => (i + 1) % SLIDES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-surface rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col">
        {/* Scrolling photo gallery */}
        <div className="relative w-full h-52 overflow-hidden bg-gray-100 dark:bg-gray-800">
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} flex items-center justify-center transition-opacity duration-700 ease-in-out`}
              style={{ opacity: i === scrollIndex ? 1 : 0 }}
            >
              <span className="text-lg font-medium text-gray-600 dark:text-gray-400">{slide.label}</span>
            </div>
          ))}
          {/* Dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`View slide ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === scrollIndex ? 'bg-gray-800 dark:bg-white shadow' : 'bg-gray-400 dark:bg-gray-500'}`}
                onClick={() => setScrollIndex(i)}
              />
            ))}
          </div>
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">3 BHK + 1,575 sq.ft</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Scrolling gallery · Shortlisted</p>
        </div>
      </div>
    </div>
  );
}
