'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Map, Users } from 'lucide-react';
import Link from 'next/link';
import { AnimatedText } from '@/components/ui/animated-shiny-text';

interface SidebarProps {
  activeView?: 'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot';
  onViewChange?: (view: 'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot') => void;
  userId: string | null;
}

export default function Sidebar({ activeView: activeViewProp, onViewChange, userId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const routeToView: Record<string, 'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot'> = {
    '/discover': 'discovery',
    '/saved': 'saved',
    '/compare': 'compare',
    '/value-estimator': 'value-estimator',
    '/market-intelligence': 'market-intelligence',
    '/lead-snapshot': 'lead-snapshot',
  };
  const activeView = routeToView[pathname ?? ''] ?? activeViewProp ?? 'discovery';

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    window.location.href = '/';
  };


  const menuItems = [
    { id: 'discovery', label: 'Property Discovery', icon: '/images/icons/property-discover.svg', href: '/discover' },
    { id: 'saved', label: 'Saved Property', icon: '/images/icons/saved-property.svg', href: '/saved' },
    { id: 'compare', label: 'Compare', icon: '/images/icons/compare.svg', href: '/compare' },
    { id: 'value-estimator', label: 'Value Estimator', icon: '/images/icons/value-estimator.svg', href: '/value-estimator' },
    { id: 'market-intelligence', label: 'Market Intelligence', icon: <Map size={24} />, href: '/market-intelligence' },
    { id: 'lead-snapshot', label: 'Lead Snapshot', icon: <Users size={24} />, href: '/lead-snapshot' },
  ];

  // Static placeholder recent chats for MVP
  const recentChats = [
    { id: 'placeholder-1', label: '3BHK in sector 150', icon: '/images/icons/recent.svg' },
    { id: 'placeholder-2', label: 'Commercial Plots', icon: '/images/icons/recent.svg' },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-3 z-40 w-11 h-11 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center border border-gray-100 dark:border-gray-700 active:scale-95 transition-all text-gray-700 dark:text-gray-200"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={closeMobile} />
      )}

      <div className={`
        w-72 md:w-80 text-gray-900 dark:text-gray-100 flex flex-col h-full border-r border-white/40 dark:border-gray-700 glass-surface
        fixed md:relative z-50 md:z-auto
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="md:hidden absolute top-4 right-3 w-11 h-11 flex items-center justify-center text-gray-500 hover:text-gray-900"
          aria-label="Close menu"
        >
          ✕
        </button>

        {/* Logo - exact height aligned with header (88px) for flush border */}
        <div className="px-6 md:px-8 h-[88px] flex items-center border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 w-full justify-center lg:justify-start">
            <Image
              src="/images/logo/realtypals.png"
              alt="RealtyPal Logo"
              width={48}
              height={48}
              className="flex-shrink-0 drop-shadow-md scale-110"
            />
            <AnimatedText
              text="RealtyPal"
              className="py-0 flex-shrink-0"
              textClassName="font-bold text-xl tracking-wide dark:text-white"
            />
          </div>
        </div>

        {/* New Chat */}
        <div className="p-4">
          <button
            onClick={() => {
              closeMobile();
              if (activeView === 'discovery' && typeof window !== 'undefined' && (window as any).__resetDiscoveryChat && typeof (window as any).__resetDiscoveryChat === 'function') {
                (window as any).__resetDiscoveryChat();
              } else {
                router.push('/discover?new=1');
              }
            }}
            className="w-full bg-[#E6E6E6] hover:bg-[#DEDEDE] text-gray-900 font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-[#D0D0D0] shadow-sm"
          >
            <Image src="/images/icons/add.svg" alt="Add" width={20} height={20} className="grayscale" />
            <span className="text-base">New Chat</span>
          </button>
        </div>

        {/* Menu Section */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-4 font-medium">Menu</div>
          <div className="space-y-1 mb-6">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                onClick={(e) => {
                  // If we're already on this page, don't trigger a full reload
                  if (pathname === item.href) {
                    e.preventDefault();
                    if (item.id === 'discovery' && typeof window !== 'undefined' && (window as any).__resetDiscoveryChat) {
                      (window as any).__resetDiscoveryChat();
                    }
                  }
                  closeMobile();
                  onViewChange?.(item.id as any);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border group ${activeView === item.id
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-blue-500 shadow-[0_5px_15px_rgba(37,99,235,0.4)] scale-[1.02] z-10'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:text-blue-600 dark:hover:text-blue-400 border-transparent hover:border-blue-100 dark:hover:border-blue-900/30'
                  }`}
              >
                {/* Icon wrapper with subtle scale animation */}
                <div className={`p-1.5 rounded-lg transition-transform duration-300 group-hover:scale-110 ${activeView === item.id ? 'bg-white/20' : 'bg-transparent'}`}>
                  {typeof item.icon === 'string' ? (
                    <Image
                      src={item.icon}
                      alt=""
                      width={22}
                      height={22}
                      className={`flex-shrink-0 transition-all duration-300 ${activeView === item.id ? 'brightness-0 invert' : 'grayscale group-hover:grayscale-0'}`}
                    />
                  ) : (
                    <div className={`flex-shrink-0 transition-colors duration-300 ${activeView === item.id ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'}`}>
                      {item.icon}
                    </div>
                  )}
                </div>
                <span className={`text-sm font-semibold tracking-tight transition-colors ${activeView === item.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Recent Section - Static placeholders for MVP */}
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-4 font-medium">Recent</div>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 cursor-default"
                  title="Coming soon"
                >
                  <Image src={chat.icon} alt="" width={20} height={20} className="flex-shrink-0 grayscale opacity-40" />
                  <span className="text-sm opacity-60">{chat.label}</span>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-300">
          <button
            onClick={() => { handleLogout(); closeMobile(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-300 transition-all duration-200"
          >
            <Image src="/images/icons/logout.svg" alt="" width={24} height={24} className="flex-shrink-0 grayscale" />
            <span className="text-base">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
