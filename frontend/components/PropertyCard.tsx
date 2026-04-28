'use client';

import { useState, useCallback, useEffect } from 'react';
import { Property } from '@/types/property';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPriceCr } from '@/lib/format';
import { API_BASE } from '@/lib/env';
import { Heart, Maximize2, ChevronLeft, ChevronRight, MessageCircle, GitCompare, LineChart, Info } from 'lucide-react';
import { motion } from 'framer-motion';

interface PropertyCardProps {
  property: Property;
  userId?: string | null;
  autoPlay?: boolean;
}

export default function PropertyCard({ property, userId, autoPlay = true }: PropertyCardProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);

  // Build image list: main image + any additional images from property
  const images: string[] = [];
  if (property.image_url) images.push(property.image_url);
  if ((property as any).images?.length) {
    (property as any).images.forEach((img: any) => {
      const url = typeof img === 'string' ? img : img.url || img.image_url;
      if (url && !images.includes(url)) images.push(url);
    });
  }

  const [isInView, setIsInView] = useState(false);

  // Auto-scroll images only when in view and autoPlay is enabled
  useEffect(() => {
    if (images.length > 1 && isInView && autoPlay) {
      const interval = setInterval(() => {
        setCarouselIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        setImgLoaded(false);
      }, 5000); // Slower interval for better performance
      return () => clearInterval(interval);
    }
  }, [images.length, isInView, autoPlay]);

  // Viewport tracking for optimization
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    const element = document.getElementById(`property-card-${property.id}`);
    if (element) observer.observe(element);
    return () => { if (element) observer.unobserve(element); };
  }, [property.id]);

  const handleClick = () => {
    router.push(`/property/${property.id}`);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || saving) return;

    setSaving(true);
    try {
      if (isSaved) {
        await fetch(`${API_BASE}/saved-properties/${property.id}`, {
          method: 'DELETE',
          headers: { 'X-User-Id': userId },
        });
        setIsSaved(false);
      } else {
        await fetch(`${API_BASE}/saved-properties`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
          body: JSON.stringify({ property_id: property.id }),
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error saving property:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCarouselNav = useCallback((e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.stopPropagation();
    setCarouselIdx(prev => {
      if (dir === 'next') return prev < images.length - 1 ? prev + 1 : 0;
      return prev > 0 ? prev - 1 : images.length - 1;
    });
    setImgLoaded(false); // show shimmer briefly on nav
  }, [images.length]);

  const displayName = property.project_name ? property.project_name : property.builder;
  const isLiveResult = String(property.id).startsWith('google-place-');

  const formatCrRange = (low: number, high: number) => {
    const toCr = (value: number) => value / 10000000;
    const lowCr = toCr(low);
    const highCr = toCr(high);
    const format = (value: number) =>
      value >= 1 ? `${value.toFixed(2).replace(/\.00$/, '')} Cr` : `${(value * 100).toFixed(0)} L`;
    return `₹ ${format(lowCr)} - ${format(highCr)}`;
  };

  const currentImgUrl = images[carouselIdx] || null;

  return (
    <motion.div
      id={`property-card-${property.id}`}
      onClick={handleClick}
      className="glass-surface rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 h-full flex flex-col"
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="p-4 flex flex-col flex-1">
        {/* ── Image section with shimmer + carousel ── */}
        <div className="relative w-full h-44 sm:h-48 md:h-52 rounded-xl overflow-hidden image-card-bg group flex-shrink-0">
          {/* Shimmer skeleton (shown while loading or no image) */}
          {!imgLoaded && currentImgUrl && !imgError && (
            <div className="absolute inset-0 img-skeleton z-[1]" />
          )}

          {currentImgUrl && !imgError ? (
            <Image
              src={currentImgUrl}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              className={`object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          )}

          {/* Carousel navigation arrows (visible on hover, only if multiple images) */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => handleCarouselNav(e, 'prev')}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-8 sm:h-8 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} className="text-gray-700 dark:text-gray-200" />
              </button>
              <button
                onClick={(e) => handleCarouselNav(e, 'next')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 sm:w-8 sm:h-8 bg-white/80 dark:bg-gray-900/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white z-10"
                aria-label="Next image"
              >
                <ChevronRight size={16} className="text-gray-700 dark:text-gray-200" />
              </button>
              {/* Carousel dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-1 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCarouselIdx(idx); setImgLoaded(false); }}
                    className={`h-2 sm:h-1.5 rounded-full transition-all duration-200 ${idx === carouselIdx ? 'bg-white w-4 sm:w-3' : 'bg-white/60 hover:bg-white/80 w-2 sm:w-1.5'}`}
                    aria-label={`Image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

        </div>

        <div className="pt-3 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                {property.property_index !== undefined && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] sm:text-[10px] font-bold rounded whitespace-nowrap">
                    #{property.property_index + 1}
                  </span>
                )}
                {property.match_score !== undefined && (
                  <span className="px-1.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[9px] sm:text-[10px] font-bold rounded whitespace-nowrap">
                    {property.match_score}% Match
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-tight truncate">
                {displayName}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                {property.sector?.name
                  ? `${property.sector.name}${property.sector.city ? `, ${property.sector.city}` : ''}`
                  : (property as any).address || 'Location not specified'}
              </p>
              {(property.bhk != null || property.bathrooms || property.balconies) && (
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                  {property.bhk != null ? `${property.bhk} BHK` : ''}
                  {property.bathrooms ? ` · ${property.bathrooms} Baths` : ''}
                  {property.balconies ? ` · ${property.balconies} Balconies` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`w-11 h-11 sm:w-9 sm:h-9 flex-shrink-0 rounded-full border flex items-center justify-center shadow-sm transition-all duration-200 ${isSaved
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-500'
                : 'bg-white dark:bg-gray-800 border-[#CFCFCF] dark:border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-200'
                }`}
              aria-label={isSaved ? 'Unsave property' : 'Save property'}
            >
              <Heart size={18} className="sm:w-4 sm:h-4" fill={isSaved ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="mt-3 sm:mt-4 flex sm:flex-row items-center justify-between gap-2">
            {property.size_sqft != null && (
              <div className="text-[11px] sm:text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Maximize2 size={12} className="text-gray-500 dark:text-gray-400 sm:w-[13px] sm:h-[13px]" />
                <span className="truncate">{property.size_sqft.toLocaleString('en-IN')} sq.ft</span>
              </div>
            )}
            <div className="text-xs sm:text-sm font-semibold text-[#0064E5] whitespace-nowrap">
              {property.validation?.market_range
                ? formatCrRange(property.validation.market_range.low, property.validation.market_range.high)
                : property.price != null
                  ? formatPriceCr(property.price)
                  : '—'}
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Intelligence Overlays — only rendered when backed by verified data.
               Google Places results have no verdict/confidence_level so this
               section is intentionally hidden for them. */}
          {(property.validation?.verdict || property.validation?.confidence_level) && (
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px]">
              {property.validation?.verdict && (
                <div className="bg-[#F7F7F7] dark:bg-gray-800 rounded-lg p-1.5 flex flex-col justify-center">
                  <span className="text-gray-500 mb-0.5 truncate">Fair Value</span>
                  <span className={`font-semibold truncate ${property.validation.verdict === 'Within market' ? 'text-green-600' : property.validation.verdict === 'Slightly high' ? 'text-amber-600' : property.validation.verdict === 'Aggressive' ? 'text-red-500' : 'text-gray-600'}`}>
                    {property.validation.verdict === 'Within market' ? 'Fair' : property.validation.verdict === 'Slightly high' ? 'Slightly High' : property.validation.verdict === 'Aggressive' ? 'Overpriced' : 'Market Range'}
                  </span>
                </div>
              )}
              {property.validation?.confidence_level && (
                <div className="bg-[#F7F7F7] dark:bg-gray-800 rounded-lg p-1.5 flex flex-col justify-center">
                  <span className="text-gray-500 mb-0.5 truncate">Confidence</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {property.validation.confidence_level}
                  </span>
                </div>
              )}
              <div className="bg-[#F7F7F7] dark:bg-gray-800 rounded-lg p-1.5 flex flex-col justify-center">
                <span className="text-gray-500 mb-0.5 truncate">Ideal For</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {property.bhk >= 4 ? 'End Use' : property.bhk <= 2 ? 'Investment' : 'Both'}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-1.5 sm:gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isLiveResult) {
                  const q = encodeURIComponent(`${displayName} ${(property as any).address || ''}`);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener');
                } else {
                  handleClick();
                }
              }}
              className="flex items-center justify-center gap-1 sm:gap-1.5 h-10 sm:h-8 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Info size={14} className="sm:w-3.5 sm:h-3.5" /> Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(isLiveResult ? '/value-estimator' : `/value-estimator?propertyId=${property.id}`);
              }}
              className="flex items-center justify-center gap-1 sm:gap-1.5 h-10 sm:h-8 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded text-[11px] sm:text-xs font-medium text-blue-700 dark:text-blue-400 transition-colors"
            >
              <LineChart size={14} className="sm:w-3.5 sm:h-3.5" /> Estimate
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const text = property.property_index != null
                  ? `Tell me more about Property ${property.property_index + 1}: ${displayName}`
                  : `Tell me more about ${displayName}`;
                window.dispatchEvent(new CustomEvent('realtypals:ask-ai', { detail: { text } }));
              }}
              className="flex items-center justify-center gap-1 sm:gap-1.5 h-10 sm:h-8 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded text-[11px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <MessageCircle size={14} className="sm:w-3.5 sm:h-3.5" /> Ask AI
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
