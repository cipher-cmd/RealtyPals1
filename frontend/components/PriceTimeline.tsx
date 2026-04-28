'use client';

import { useEffect, useState } from 'react';

// Hardcoded realistic price data for Sector 150, Noida
const SECTOR_150_PRICES = [
  { year: 2020, price: 4500, label: '₹4,500' },
  { year: 2021, price: 5200, label: '₹5,200' },
  { year: 2022, price: 6100, label: '₹6,100' },
  { year: 2023, price: 7800, label: '₹7,800' },
  { year: 2024, price: 9500, label: '₹9,500' },
  { year: 2025, price: 11200, label: '₹11,200' },
  { year: 2026, price: 13000, label: '₹13,000', projected: true },
];

interface PriceTimelineProps {
  currentPricePerSqft?: number;
  className?: string;
}

export default function PriceTimeline({ currentPricePerSqft, className }: PriceTimelineProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const data = SECTOR_150_PRICES;
  const w = 380;
  const h = 160;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const minP = Math.min(...data.map((d) => d.price)) * 0.85;
  const maxP = Math.max(...data.map((d) => d.price)) * 1.1;

  const getX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const getY = (price: number) => {
    const ratio = (price - minP) / (maxP - minP);
    return padT + chartH - ratio * chartH;
  };

  // Line path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${animated ? getY(d.price) : getY(minP)}`)
    .join(' ');

  // Area path
  const areaPath = `${linePath} L${getX(data.length - 1)},${padT + chartH} L${getX(0)},${padT + chartH} Z`;

  // Growth percentage
  const growth = Math.round(((data[data.length - 1].price - data[0].price) / data[0].price) * 100);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 ${className || ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Price Trend — Sector 150</h4>
          <p className="text-[10px] text-gray-400">Average price per sq.ft (2020–2026)</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
          <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+{growth}%</span>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padT + chartH - ratio * chartH;
          const price = Math.round(minP + ratio * (maxP - minP));
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="#f3f4f6" strokeWidth={1} className="dark:stroke-gray-700" />
              {i % 2 === 0 && (
                <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-gray-400 text-[8px]">
                  ₹{(price / 1000).toFixed(1)}k
                </text>
              )}
            </g>
          );
        })}

        {/* Gradient area */}
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#priceGradient)" className="transition-all duration-1000 ease-out" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000 ease-out" />

        {/* Data points */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = animated ? getY(d.price) : getY(minP);
          return (
            <g key={i} className="transition-all duration-1000 ease-out">
              {/* Point */}
              <circle cx={x} cy={y} r={d.projected ? 4 : 3} fill={d.projected ? '#f59e0b' : '#3b82f6'} stroke="white" strokeWidth={2} />

              {/* Year label */}
              <text x={x} y={padT + chartH + 16} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[8px]">
                {d.year}
              </text>

              {/* Price label on hover-like display for first, last, and current */}
              {(i === 0 || i === data.length - 1) && (
                <text x={x} y={y - 10} textAnchor="middle" className="fill-gray-700 dark:fill-gray-300 text-[8px] font-semibold">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Current price marker */}
        {currentPricePerSqft && animated && (
          <g>
            <line
              x1={padL}
              y1={getY(currentPricePerSqft)}
              x2={padL + chartW}
              y2={getY(currentPricePerSqft)}
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="4 3"
            />
            <text x={padL + chartW + 4} y={getY(currentPricePerSqft) + 3} className="fill-red-500 text-[8px] font-semibold">
              Your property
            </text>
          </g>
        )}

        {/* Projected zone indicator */}
        <rect x={getX(data.length - 2)} y={padT} width={getX(data.length - 1) - getX(data.length - 2)} height={chartH} fill="#f59e0b" opacity={0.05} rx={4} />
        <text x={(getX(data.length - 2) + getX(data.length - 1)) / 2} y={padT + 10} textAnchor="middle" className="fill-amber-500 text-[7px] font-medium">
          Projected
        </text>
      </svg>
    </div>
  );
}
