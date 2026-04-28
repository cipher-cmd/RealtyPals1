'use client';

import { useState, useEffect, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import DiscoveryContent from '@/components/DiscoveryContent';
import { Property } from '@/types/property';
import { API_BASE } from '@/lib/env';

export default function DiscoverPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot'>('discovery');
  const [userId, setUserId] = useState<string | null>(null);
  const [defaultSector, setDefaultSector] = useState<string>('');

  useEffect(() => {
    // Get user_id from localStorage
    const storedUserId = localStorage.getItem('user_id');
    setUserId(storedUserId);

    // If not logged in, redirect to landing page
    if (!storedUserId) {
      window.location.href = '/';
      return;
    }

    if (storedUserId) {
      loadSectors();
      
      return () => {
      };
    }
  }, []);

  const loadSectors = async () => {
    try {
      const response = await fetch(`${API_BASE}/sectors`);
      if (!response.ok) return;
      const data = await response.json();
      const sectors = data.sectors || [];
      if (sectors.length > 0) {
        setDefaultSector(sectors[0].name);
      }
    } catch (error) {
      console.error('Error loading sectors:', error);
    }
  };

  const loadProperties = async (filters: { sector?: string; bhk?: number; property_type?: string; min_price?: number; max_price?: number }) => {
    setLoading(true);
    try {
      const sectorName = filters.sector || defaultSector;
      if (!sectorName) throw new Error('No sector available');
      const params = new URLSearchParams({
        sector: sectorName,
        ...(filters.bhk && { bhk: filters.bhk.toString() }),
        ...(filters.property_type && { property_type: filters.property_type }),
        ...(filters.min_price && { min_price: filters.min_price.toString() }),
        ...(filters.max_price && { max_price: filters.max_price.toString() }),
      });

      const response = await fetch(`${API_BASE}/properties?${params}`);
      if (!response.ok) throw new Error('Failed to fetch properties');

      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#E6E6E6] overflow-hidden no-overscroll">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        userId={userId}
      />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>}>
          <DiscoveryContent
            properties={properties}
            loading={loading}
            onLoadProperties={loadProperties}
            onUpdateProperties={setProperties}
            userId={userId}
            onResetChat={() => { }}
          />
        </Suspense>
      </main>
    </div>
  );
}
