'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';
import { Property } from '@/types/property';
import { API_BASE } from '@/lib/env';
import { formatPriceCr } from '@/lib/format';
import AmenityIcon, { AmenityGrid } from '@/components/AmenityIcon';
import PropertyRadarChart, { generateRadarScores } from '@/components/PropertyRadarChart';
import PriceTimeline from '@/components/PriceTimeline';
import ShareCard from '@/components/ShareCard';
import ThemeToggle from '@/components/ThemeToggle';
import Header from '@/components/Header';
import { StickyScroll } from '@/components/ui/sticky-scroll-reveal';
import { Share2, Settings, User, ArrowLeft, Heart, Info, X } from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'discovery' | 'saved' | 'compare' | 'value-estimator' | 'market-intelligence' | 'lead-snapshot'>('discovery');
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [showDnaInfo, setShowDnaInfo] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    setUserId(storedUserId);
    if (!storedUserId) {
      window.location.href = '/';
      return;
    }

    loadProperty();
    if (storedUserId) {
      loadSavedStatus(storedUserId);
    }
  }, [propertyId, router]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/properties/${propertyId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setToast({ message: 'Property not found' });
          router.push('/discover');
          return;
        }
        throw new Error('Failed to fetch property');
      }

      const data = await response.json();
      setProperty(data.property);
    } catch (error) {
      console.error('Error loading property:', error);
      setToast({ message: 'Failed to load property details' });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedStatus = async (userIdValue: string) => {
    try {
      const response = await fetch(`${API_BASE}/saved-properties`, {
        headers: { 'X-User-Id': userIdValue },
      });
      if (!response.ok) return;
      const data = await response.json();
      const savedList: Array<{ property_id: string }> = data.savedProperties || [];
      setIsSaved(savedList.some((s) => s.property_id === propertyId));
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleToggleSave = async () => {
    if (!userId || !property || saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        const response = await fetch(`${API_BASE}/saved-properties/${property.id}`, {
          method: 'DELETE',
          headers: { 'X-User-Id': userId },
        });
        if (!response.ok) throw new Error('Failed to remove saved property');
        setIsSaved(false);
        setToast({ message: 'Removed from saved properties' });
      } else {
        const response = await fetch(`${API_BASE}/saved-properties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({ property_id: property.id }),
        });
        if (!response.ok) throw new Error('Failed to save property');
        setIsSaved(true);
        setToast({ message: 'Property saved successfully' });
      }
    } catch (error) {
      console.error('Error saving property:', error);
      setToast({ message: 'Failed to update saved property' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-[#E6E6E6]">
        <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex h-screen bg-[#E6E6E6]">
        <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Property not found</p>
            <button onClick={() => router.push('/discover')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Discovery
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sectorName = property.sector?.name ?? 'Unknown sector';
  const sectorCity = property.sector?.city ?? 'Unknown city';
  const propertyTypeLabel = property.property_type === 'flat' ? 'Apartment' : 'Plot';
  const amenities = property.amenities ?? [];
  const highlights = property.highlights ?? [];
  const images = property.images ?? [];

  // Build gallery: use images from DB, fallback to main image_url
  const galleryImages = images.length > 0
    ? images.map((img) => ({ url: img.image_url, caption: img.caption || '', type: img.image_type }))
    : property.image_url
      ? [{ url: property.image_url, caption: property.project_name || 'Property', type: 'exterior' as const }]
      : [];

  // (Amenity rendering now handled by shared AmenityIcon component)

  return (
    <div className="flex h-screen bg-[#E6E6E6]">
      <Sidebar activeView={activeView} onViewChange={setActiveView} userId={userId} />

      <div className="flex-1 flex flex-col bg-[#E6E6E6]">
        <Header title="Property Details" onToast={(msg: string) => setToast({ message: msg })} onShare={() => setShowShareCard(true)} />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mb-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back
            </button>

            {/* ── Image Gallery ── */}
            {galleryImages.length > 0 && (
              <div className="mb-6">
                {/* Main image */}
                <div
                  className="relative w-full h-80 md:h-[400px] lg:h-[480px] bg-gray-200 rounded-2xl overflow-hidden cursor-pointer group"
                  onClick={() => setShowFullImage(true)}
                >
                  <Image
                    src={galleryImages[activeImageIndex]?.url || galleryImages[0].url}
                    alt={galleryImages[activeImageIndex]?.caption || 'Property'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  {/* Image type badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full capitalize">
                    {galleryImages[activeImageIndex]?.type?.replace('_', ' ') || 'Photo'}
                  </div>
                  {/* Image count */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
                    {activeImageIndex + 1} / {galleryImages.length}
                  </div>
                  {/* Caption */}
                  {galleryImages[activeImageIndex]?.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3">
                      <p className="text-white text-sm">{galleryImages[activeImageIndex].caption}</p>
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                {galleryImages.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                    {galleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 ${activeImageIndex === idx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                      >
                        <Image src={img.url} alt={img.caption || ''} fill className="object-cover" unoptimized />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Property Details Card ── */}
            <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 border border-[#E0E0E0]">
              {/* Header with Status Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    {property.project_name || `${property.bhk} BHK ${property.property_type === 'flat' ? 'Flat' : 'Plot'}`}
                  </h2>
                  <p className="text-gray-600 text-sm md:text-base">
                    {sectorName}, {sectorCity} | {property.bhk} BHK {propertyTypeLabel}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {property.bhk} BHK
                    {property.bathrooms ? ` · ${property.bathrooms} Baths` : ''}
                    {property.balconies ? ` · ${property.balconies} Balconies` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${property.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}
                  >
                    {property.status === 'ready' ? 'Ready to Move' : 'Under Construction'}
                  </span>
                  <button
                    onClick={handleToggleSave}
                    disabled={saving}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 ${isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-[#CFCFCF] text-gray-400 hover:text-red-400'
                      }`}
                  >
                    <Heart size={18} fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              {/* Price Information */}
              <div className="border-b border-gray-200 pb-6 mb-6">
                <div className="grid grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Broker Quoted Price</p>
                    <p className="text-xl md:text-2xl font-bold text-[#0064E5]">{formatPriceCr(property.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Price per Sq. Ft</p>
                    <p className="text-lg md:text-xl font-semibold text-gray-900">
                      ₹{property.price_per_sqft?.toLocaleString('en-IN') ?? 'N/A'} / sq.ft
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-4 italic">
                  Prices shown are as listed. Use Value Estimator for independent market validation.
                </p>
              </div>

              {/* ── Sequential Details Sections ── */}
              <div className="flex flex-col gap-12 lg:gap-16 mb-12 mt-4 w-full py-8 text-gray-900 dark:text-white">

                {/* 1. Property Specifications */}
                <div className="flex flex-col md:flex-row gap-8 items-stretch bg-[#F4F5F7] dark:bg-gray-800/50 rounded-3xl p-6 lg:p-8 border border-white dark:border-gray-700 shadow-sm">
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl lg:text-3xl font-black mb-6 tracking-tight text-gray-800 dark:text-gray-100">Property Specifications</h3>
                    <div className="grid grid-cols-2 gap-4 lg:gap-6 w-full">
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Size</p>
                        <p className="text-xl lg:text-2xl font-black text-[#0064E5] dark:text-blue-400 leading-tight">{property.size_sqft.toLocaleString('en-IN')} sqft</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Builder</p>
                        <p className="text-xl lg:text-2xl font-black text-[#0064E5] dark:text-blue-400 leading-tight">{property.builder}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Floor</p>
                        <p className="text-xl lg:text-2xl font-black text-[#0064E5] dark:text-blue-400 leading-tight">{property.floor === 0 ? 'Ground' : property.floor}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Config</p>
                        <p className="text-xl lg:text-2xl font-black text-[#0064E5] dark:text-blue-400 leading-tight">{property.bhk} BHK</p>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-[45%] lg:w-[40%] min-h-[320px] rounded-2xl overflow-hidden relative shadow-md">
                    <Image src={galleryImages[0]?.url || '/placeholder.png'} fill alt="Specifications" className="object-cover hover:scale-105 transition-transform duration-700" unoptimized />
                  </div>
                </div>

                {/* 2. Apartment Highlights */}
                {highlights.length > 0 && (
                  <div className="flex flex-col md:flex-row gap-8 items-stretch rounded-3xl p-6 lg:p-8 border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-2xl lg:text-3xl font-black mb-6 tracking-tight text-gray-800 dark:text-gray-100">Apartment Highlights</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 w-full">
                        {highlights.map((h, idx) => (
                          <div key={idx} className="flex items-start gap-4 bg-[#F4F5F7] dark:bg-gray-800 rounded-2xl px-6 py-5 border border-transparent shadow-sm hover:border-blue-100 dark:hover:border-blue-900 transition-colors">
                            <span className="text-blue-500 font-black text-xl leading-none mt-1">•</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-base leading-snug">{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="w-full md:w-[45%] lg:w-[40%] min-h-[320px] rounded-2xl overflow-hidden relative shadow-md bg-gray-100 dark:bg-gray-800">
                      <Image src={galleryImages[1]?.url || galleryImages[0]?.url || '/placeholder.png'} fill alt="Highlights" className="object-cover hover:scale-105 transition-transform duration-700" unoptimized />
                      <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
                    </div>
                  </div>
                )}

                {/* 3. Premium Amenities */}
                {amenities.length > 0 && (
                  <div className="flex flex-col md:flex-row gap-8 items-stretch bg-[#F4F5F7] dark:bg-gray-800/50 rounded-3xl p-6 lg:p-8 border border-white dark:border-gray-700 shadow-sm">
                    <div className="flex-1 flex flex-col justify-center">
                      <h3 className="text-2xl lg:text-3xl font-black mb-6 tracking-tight text-gray-800 dark:text-gray-100">Premium Amenities</h3>
                      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-10 shadow-sm border border-gray-100 dark:border-gray-700 w-full h-full flex items-center">
                        <div className="w-full">
                          <AmenityGrid amenities={amenities} max={18} size="xl" showLabel={true} cols="grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-6" />
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-[45%] lg:w-[40%] min-h-[320px] rounded-2xl overflow-hidden relative shadow-md">
                      <Image src={galleryImages[2]?.url || galleryImages[0]?.url || '/placeholder.png'} fill alt="Amenities" className="object-cover hover:scale-105 transition-transform duration-700" unoptimized />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Property DNA Radar + Price Timeline ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Radar Chart */}
                <div className="bg-[#F7F7F7] dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 relative">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center">Property DNA</h3>
                    <button
                      onClick={() => setShowDnaInfo(!showDnaInfo)}
                      className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      title="What is Property DNA?"
                    >
                      <Info size={12} className="text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>

                  {/* Info popup */}
                  {showDnaInfo && (
                    <div className="absolute top-12 left-2 right-2 z-20 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 animate-fade-in-up">
                      <button onClick={() => setShowDnaInfo(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                        <X size={14} />
                      </button>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">What is Property DNA?</p>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                        Property DNA is a multi-dimensional score that rates this property across 5 key investment factors, giving you a holistic view at a glance.
                      </p>
                      <ul className="text-[11px] text-gray-500 dark:text-gray-400 space-y-1">
                        <li><span className="font-medium text-gray-700 dark:text-gray-300">Value</span> — Price competitiveness vs market</li>
                        <li><span className="font-medium text-gray-700 dark:text-gray-300">Location</span> — Sector connectivity & infrastructure</li>
                        <li><span className="font-medium text-gray-700 dark:text-gray-300">Amenities</span> — Facilities & lifestyle offerings</li>
                        <li><span className="font-medium text-gray-700 dark:text-gray-300">Builder</span> — Developer reputation & track record</li>
                        <li><span className="font-medium text-gray-700 dark:text-gray-300">Growth</span> — Future appreciation potential</li>
                      </ul>
                    </div>
                  )}

                  <PropertyRadarChart axes={generateRadarScores(property)} size={200} />

                  {/* Score summary below chart */}
                  <div className="mt-2 grid grid-cols-5 gap-1 text-center">
                    {generateRadarScores(property).map((axis, i) => (
                      <div key={i} className="text-[9px]">
                        <div className={`font-bold ${axis.value >= 80 ? 'text-green-600' : axis.value >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>{axis.value}</div>
                        <div className="text-gray-400 truncate">{axis.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Timeline */}
                <PriceTimeline currentPricePerSqft={property.price_per_sqft ?? undefined} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleToggleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:cursor-not-allowed"
                >
                  {isSaved ? 'Remove from Saved' : 'Save Property'}
                </button>
                <button
                  onClick={() => {
                    const queryParams = new URLSearchParams({
                      bhk: String(property.bhk),
                      size_sqft: String(property.size_sqft),
                      builder: property.builder || '',
                      floor: String(property.floor ?? ''),
                      status: property.status,
                      quoted_price: String(property.price),
                    });
                    if (property.project_name) queryParams.set('project_name', property.project_name);
                    router.push(`/value-estimator?${queryParams.toString()}`);
                  }}
                  className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  Get second-opinion on price
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fullscreen Image Modal ── */}
      {showFullImage && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setShowFullImage(false)}>
          <div className="relative max-w-5xl w-full max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-2 right-2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 z-10 transition-colors"
            >
              ✕
            </button>
            {/* Prev / Next buttons */}
            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 z-10 transition-colors"
                >
                  ‹
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/40 z-10 transition-colors"
                >
                  ›
                </button>
              </>
            )}
            <Image
              src={galleryImages[activeImageIndex].url}
              alt={galleryImages[activeImageIndex].caption || 'Property'}
              width={1400}
              height={900}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
              unoptimized
            />
            <p className="text-white text-center mt-3 text-sm">
              {galleryImages[activeImageIndex].caption || `${property.project_name || property.builder}`}
            </p>
          </div>
        </div>
      )}

      {/* Share Card Modal */}
      {showShareCard && property && (
        <ShareCard
          property={property}
          onClose={() => setShowShareCard(false)}
          onToast={(msg) => setToast({ message: msg })}
        />
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
