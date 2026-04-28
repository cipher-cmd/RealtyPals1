'use client';

import Image from 'next/image';

export default function AIThinkingIndicator({ query }: { query?: string }) {
  // Extract a location or key phrase from the query if possible, or just use it directly
  const displayTarget = query && query.length < 60 ? query : 'the market';

  return (
    <div className="flex items-start gap-3 animate-message-in">
      {/* Bot avatar */}
      <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border border-[#E0E0E0] dark:border-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
        <Image src="/images/logo/realtypals.png" alt="RP" width={40} height={40} className="opacity-90 drop-shadow-sm" />
      </div>

      <div className="flex flex-col">
        {/* Hacker-style shimmering text instead of just dots */}
        <div className="bg-[#F7F7F7] dark:bg-gray-800 border border-[#E8E8E8] dark:border-gray-700 rounded-[22px] px-5 py-3 shadow-sm flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-400 dark:bg-blue-500 blur-sm opacity-50 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-ping" />
          </div>
          <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 animate-pulse">
            Scanning live data for &quot;{displayTarget}&quot;...
          </span>
        </div>
      </div>
    </div>
  );
}
