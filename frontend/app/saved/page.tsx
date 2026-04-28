'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import SavedPropertyCard from '@/components/SavedPropertyCard';
import ScrollingPhotoPropertyCard from '@/components/ScrollingPhotoPropertyCard';
import Toast from '@/components/Toast';
import ThemeToggle from '@/components/ThemeToggle';
import { Property, Sector } from '@/types/property';
import { API_BASE } from '@/lib/env';
import { Share2, Settings, User } from 'lucide-react';
import Header from '@/components/Header';

interface SavedProperty {
  user_id: string;
  property_id: string;
  saved_at: string;
  property?: Property;
}

export default function SavedPropertiesPage() {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot'>('saved');
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [sectorsById, setSectorsById] = useState<Record<string, Sector>>({});
  const router = useRouter();

  useEffect(() => {
    // Get user_id from localStorage
    const storedUserId = localStorage.getItem('user_id');
    setUserId(storedUserId);

    // If not logged in, redirect to landing page
    if (!storedUserId) {
      window.location.href = '/';
      return;
    }

    // Load saved properties
    loadSavedProperties(storedUserId);
    loadSectors();
  }, [router]);

  const loadSavedProperties = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/saved-properties`, {
        headers: {
          'X-User-Id': userId,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch saved properties');

      const data = await response.json();
      setSavedProperties(data.savedProperties || []);
    } catch (error) {
      console.error('Error loading saved properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSectors = async () => {
    try {
      const response = await fetch(`${API_BASE}/sectors`);
      if (!response.ok) return;
      const data = await response.json();
      const sectorMap: Record<string, Sector> = {};
      (data.sectors || []).forEach((sector: Sector) => {
        sectorMap[sector.id] = sector;
      });
      setSectorsById(sectorMap);
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };

  const handleRemoveSaved = async (propertyId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE}/saved-properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': userId,
        },
      });
      if (!response.ok) throw new Error('Failed to remove saved property');
      setSavedProperties(prev => prev.filter(sp => sp.property_id !== propertyId));
      setToast({ message: 'Removed from saved properties' });
    } catch (error) {
      console.error('Error removing saved property:', error);
      setToast({ message: 'Failed to remove property' });
    }
  };

  return (
    <div className="flex h-screen bg-[#E6E6E6]">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        userId={userId}
      />
      <div className="flex-1 flex flex-col bg-[#E6E6E6]">
        <Header title="RealtyPal – Saved Properties" onToast={(msg: string) => setToast({ message: msg })} />

        {/* Animated Orbs Overlay Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" />
          <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-purple-400/10 dark:bg-purple-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-[-10%] left-[40%] w-[400px] h-[400px] bg-teal-400/5 dark:bg-teal-600/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 animate-blob" style={{ animationDelay: "4s" }} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 relative">
          {loading ? (
            <div className="text-center py-32 relative z-10 flex flex-col items-center justify-center">
              <div className="relative w-20 h-20 mb-6">
                <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Curating your portfolio...</p>
            </div>
          ) : savedProperties.length === 0 ? (
            <div className="text-center relative z-10 inset-0 flex flex-col items-center justify-center py-32 px-6">
              <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center mb-8 shadow-2xl border border-gray-100 dark:border-gray-700 relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                <div className="relative z-10 text-gray-300 group-hover:text-blue-500 transition-all transform group-hover:scale-110">
                  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Your Portfolio is Empty</h3>
              <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
                Save properties during your discovery process to start building your personalized investment portfolio.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-10 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all text-sm tracking-wide"
              >
                Start Discovering
              </button>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {savedProperties.length} {savedProperties.length === 1 ? 'Saved Property' : 'Saved Properties'}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Your curated portfolio of potential investments.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {savedProperties.map((savedProp) => (
                  savedProp.property ? (
                    <SavedPropertyCard
                      key={savedProp.property_id}
                      property={savedProp.property}
                      savedAt={savedProp.saved_at}
                      onRemove={() => handleRemoveSaved(savedProp.property_id)}
                      sectorNameOverride={sectorsById[savedProp.property.sector_id]?.name}
                      sectorCityOverride={sectorsById[savedProp.property.sector_id]?.city}
                    />
                  ) : <></>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 md:px-8 py-4 border-t border-[#D0D0D0] bg-[#E6E6E6]">
          <p className="text-xs text-gray-500 text-center">
            Saved properties sync with your account.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
