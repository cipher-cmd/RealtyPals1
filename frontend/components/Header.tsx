"use client";

import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import { Share2, Settings, User } from 'lucide-react';
import { HyperText } from '@/components/ui/hyper-text';

interface HeaderProps {
    title: string;
    onToast?: (message: string) => void;
    onShare?: () => void;
    onSettings?: () => void;
}

export default function Header({ title, onToast, onShare, onSettings }: HeaderProps) {
    const handleShare = () => {
        if (onShare) onShare();
        else if (onToast) onToast('Coming soon');
    };

    const handleSettings = () => {
        if (onSettings) onSettings();
        else if (onToast) onToast('Coming soon');
    };

    return (
        <header className="flex-shrink-0 pl-14 pr-4 md:px-8 h-[73px] md:h-[88px] flex items-center justify-between border-b border-white/20 dark:border-gray-800/60 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-300 z-30 sticky top-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none">
            <div className="flex items-center gap-1 md:gap-3 min-w-0 flex-1 mr-2 px-1">
                <div className="flex-1 min-w-0">
                    {/* Mobile: two-line layout with better typography */}
                    <div className="md:hidden flex flex-col leading-none">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 dark:from-blue-400 dark:to-indigo-300">
                                RealtyPal Intelligence
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em] mt-0.5">
                            Engine™ for Noida
                        </span>
                    </div>
                    {/* Desktop: single-line animated */}
                    <div className="hidden md:block truncate">
                        <HyperText
                            text={title}
                            animateOnLoad={true}
                            className="text-lg md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight"
                        />
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <div className="flex items-center gap-1 md:gap-3 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-full border border-gray-200/50 dark:border-gray-700/50">
                    <ThemeToggle />
                    
                    <button
                        onClick={handleShare}
                        className="w-10 h-10 md:w-10 md:h-10 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md active:scale-90 transition-all"
                        aria-label="Share"
                    >
                        <Share2 size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>

                    <button
                        onClick={handleSettings}
                        className="hidden sm:flex w-10 h-10 md:w-10 md:h-10 items-center justify-center bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md active:scale-90 transition-all"
                        aria-label="Settings"
                    >
                        <Settings size={18} className="text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                <div className="group relative cursor-pointer active:scale-90 transition-all">
                    <div className="w-11 h-11 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg transition-all hover:shadow-blue-500/50 overflow-hidden relative">
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <User size={22} className="text-white drop-shadow-sm" />
                    </div>
                </div>
            </div>
        </header>
    );
}
