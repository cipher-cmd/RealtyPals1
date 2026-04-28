'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    // Default to light mode as requested. Only use dark mode if explicitly set.
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white dark:bg-gray-700 rounded-full transition-all duration-300 border border-[#D0D0D0] dark:border-gray-600 hover:shadow-sm"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        <Sun size={18} className="text-amber-500" />
      ) : (
        <Moon size={18} className="text-gray-600" />
      )}
    </button>
  );
}
