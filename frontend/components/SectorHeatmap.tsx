'use client';

/**
 * Sector Heatmap overlay with color-coded price density zones
 * Renders on top of the Google Map iframe in the value estimator
 */
export default function SectorHeatmap() {
  // Hardcoded price zones for Sector 150 area
  const zones = [
    { label: 'Sector 150', color: 'rgba(239, 68, 68, 0.35)', x: '42%', y: '30%', w: '22%', h: '20%', price: '₹10-13K/sqft' },
    { label: 'Sector 143B', color: 'rgba(245, 158, 11, 0.30)', x: '65%', y: '25%', w: '18%', h: '18%', price: '₹8-10K/sqft' },
    { label: 'Sector 137', color: 'rgba(59, 130, 246, 0.25)', x: '25%', y: '50%', w: '20%', h: '16%', price: '₹7-9K/sqft' },
    { label: 'Sector 128', color: 'rgba(16, 185, 129, 0.25)', x: '55%', y: '55%', w: '18%', h: '15%', price: '₹11-15K/sqft' },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Map iframe */}
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14024.57!2d77.3943!3d28.5691!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5f0f9b8fe03%3A0x7a9e21d3a8b7c7e0!2sSector%20150%2C%20Noida%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1706000000000!5m2!1sen!2sin"
        width="100%"
        height="280"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Sector 150, Noida Map"
      />

      {/* Heatmap overlay zones */}
      <div className="absolute inset-0 pointer-events-none">
        {zones.map((zone, i) => (
          <div
            key={i}
            className="absolute rounded-xl border border-white/40 flex flex-col items-center justify-center transition-opacity"
            style={{
              backgroundColor: zone.color,
              left: zone.x,
              top: zone.y,
              width: zone.w,
              height: zone.h,
            }}
          >
            <span className="text-[9px] font-bold text-white drop-shadow-md leading-tight">{zone.label}</span>
            <span className="text-[8px] text-white/90 drop-shadow-md">{zone.price}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-[9px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Price Density</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-red-400/60" />
            <span className="text-[8px] text-gray-500">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-amber-400/50" />
            <span className="text-[8px] text-gray-500">Mid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 rounded-sm bg-blue-400/40" />
            <span className="text-[8px] text-gray-500">Emerging</span>
          </div>
        </div>
      </div>
    </div>
  );
}
