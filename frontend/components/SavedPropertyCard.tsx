'use client';

import { Property } from '@/types/property';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPriceCr } from '@/lib/format';
import { MapPin, Heart, Share2, Trash2, Home, Building2, CheckCircle2, HardHat, Maximize2, BedDouble, Calendar } from 'lucide-react';

interface SavedPropertyCardProps {
  property: Property;
  savedAt: string;
  onRemove: () => void;
  sectorNameOverride?: string | null;
  sectorCityOverride?: string | null;
}

export default function SavedPropertyCard({
  property,
  savedAt,
  onRemove,
  sectorNameOverride,
  sectorCityOverride,
}: SavedPropertyCardProps) {
  const router = useRouter();
  const sectorName = sectorNameOverride ?? property.sector?.name ?? 'Unknown sector';
  const sectorCity = sectorCityOverride ?? property.sector?.city ?? 'Unknown city';
  const propertyTypeLabel = property.property_type === 'flat' ? 'Apartment' : 'Plot';

  const handleClick = () => {
    router.push(`/property/${property.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative">
      {/* Image Section */}
      <div
        onClick={handleClick}
        className="relative w-full aspect-[4/3] cursor-pointer flex-shrink-0 overflow-hidden"
      >
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.project_name || property.builder}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
            <Building2 size={40} strokeWidth={1.2} />
          </div>
        )}

        {/* Soft dark gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none"></div>

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <span className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
            {property.status === 'ready' ? 'Ready' : 'Under Const.'}
          </span>
        </div>

        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-4 right-4 w-11 h-11 md:w-8 md:h-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/20 flex items-center justify-center text-gray-400 hover:text-red-500 hover:scale-110 transition-all z-10"
          aria-label="Remove from saved"
        >
          <Trash2 size={16} className="md:w-4 md:h-4" />
        </button>

        {/* Image Bottom Content */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-md leading-tight line-clamp-1">
            {property.project_name || `${property.bhk} BHK ${property.property_type === 'flat' ? 'Flat' : 'Plot'}`}
          </h3>
          <p className="text-xs md:text-sm font-medium text-white/90 drop-shadow-md mt-0.5 flex items-center gap-1">
            <MapPin size={12} className="opacity-80" /> {sectorName}, {sectorCity}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xl md:text-2xl font-black text-[#0064E5] dark:text-blue-400 leading-none">
              {formatPriceCr(property.price)}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold tracking-wider uppercase mt-1">
              ₹{property.price_per_sqft?.toLocaleString('en-IN') ?? 'N/A'} / sq.ft
            </div>
          </div>
        </div>

        {/* Feature Tags */}
        <div className="flex flex-wrap gap-2 mb-4 mt-auto">
          <span className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-gray-100 dark:border-gray-700">
            <BedDouble size={12} className="text-blue-500" />
            {property.bhk} BHK
          </span>
          {property.size_sqft && (
            <span className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-gray-100 dark:border-gray-700">
              <Maximize2 size={12} className="text-indigo-500" />
              {property.size_sqft.toLocaleString('en-IN')} sq.ft
            </span>
          )}
          <span className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border border-gray-100 dark:border-gray-700">
            {property.property_type === 'flat' ? <Building2 size={12} className="text-emerald-500" /> : <Home size={12} className="text-amber-500" />}
            {propertyTypeLabel}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
            <Calendar size={12} />
            Saved on {formatDate(savedAt)}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.share) {
                navigator.share({
                  title: property.project_name || 'Property',
                  url: window.location.origin + `/property/${property.id}`
                })
              }
            }}
            className="w-11 h-11 md:w-8 md:h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            aria-label="Share"
          >
            <Share2 size={16} className="md:w-3 md:h-3 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
