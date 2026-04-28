'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { PropertyDetail } from '@/types/property';
import { AmenityGrid, getMappedAmenities } from '@/components/AmenityIcon';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { Maximize2, Download, Eye, BedDouble, Ruler, CheckCircle2, HardHat, X, Image as LucideImage } from 'lucide-react';

interface PropertyDetailViewProps {
  propertyDetail: PropertyDetail;
  onToast?: (message: string) => void;
}

export default function PropertyDetailView({ propertyDetail, onToast }: PropertyDetailViewProps) {
  const [showFullFloorPlan, setShowFullFloorPlan] = useState(false);
  const router = useRouter();

  const images = propertyDetail.images ?? [];
  const amenities = propertyDetail.amenities ?? [];
  const floorPlanImage = images.find((img) => img.type === 'floor_plan');

  return (
    <div className="mt-3 ml-12 w-full relative">
      {/* 
        Responsive layout logic: 
        - Mobile: Horizontal scroll (flex gap-4 overflow-x-auto snap-x)
        - MD (Tablet): 2 columns grid
        - LG/XL (Laptop): 3 columns grid 
      */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible max-w-full animate-fade-in-up snap-x snap-mandatory px-1">
        {/* ─── Card 1: Premium Lifestyle Amenities ─── */}
        <div className="snap-center min-w-[280px] w-[85vw] sm:w-[320px] md:w-auto flex-shrink-0 md:flex-shrink bg-white dark:bg-gray-800 rounded-2xl p-5 border border-[#E8E8E8] dark:border-gray-700 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200 min-h-[340px]">
          <div className="flex flex-row items-center justify-center mb-6 w-full py-2 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl h-48">
            <AnimatedTooltip
              items={getMappedAmenities(amenities, 6).map((am, idx) => ({
                id: idx,
                name: am.label,
                designation: 'Premium Amenity',
                icon: <am.lucideIcon size={24} className="text-blue-600 dark:text-blue-400" strokeWidth={1.5} />,
              }))}
            />
          </div>

          <div className="flex flex-col flex-1">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white mt-1">Lifestyle Amenities</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed flex-1">
              Elevate your daily living with wellness and convenience facilities at your doorstep.
            </p>
            <button
              onClick={() => router.push(`/property/${propertyDetail.id}`)}
              className="mt-4 w-full h-11 sm:h-[40px] text-xs font-bold border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 text-blue-700 dark:text-blue-400"
            >
              <Eye size={14} />
              View Full List
            </button>
          </div>
        </div>

        {/* ─── Card 2: Floor Plan ─── */}
        <div className="snap-center min-w-[280px] w-[85vw] sm:w-[320px] md:w-auto flex-shrink-0 md:flex-shrink bg-white dark:bg-gray-800 rounded-2xl border border-[#E8E8E8] dark:border-gray-700 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200 min-h-[340px] overflow-hidden">
          {floorPlanImage ? (
            <div
              className="relative w-full h-48 bg-gray-50 dark:bg-gray-900 cursor-pointer group"
              onClick={() => setShowFullFloorPlan(true)}
            >
              <Image
                src={floorPlanImage.url}
                alt="Floor Plan"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize2 size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center gap-2">
              <Ruler size={28} className="text-gray-300" />
              <p className="text-gray-400 text-xs">Floor plan coming soon</p>
            </div>
          )}
          <div className="p-4 flex flex-col flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                {propertyDetail.bhk != null ? `${propertyDetail.bhk}BHK ` : ''}Configuration
              </h4>
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-wider">
                {propertyDetail.size_sqft != null ? `${propertyDetail.size_sqft.toLocaleString('en-IN')} SQ.FT` : '—'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed flex-1">
              Thoughtfully planned layout optimizing ventilation and natural light.
            </p>
            <button
              onClick={() => {
                if (floorPlanImage) {
                  setShowFullFloorPlan(true);
                } else {
                  onToast?.('Floor plan not available yet');
                }
              }}
              className="mt-4 w-full h-11 sm:h-[40px] text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <Maximize2 size={14} />
              Analyze Layout
            </button>
          </div>
        </div>

        {/* ─── Card 3: Property Image Gallery ─── */}
        <div className="snap-center min-w-[280px] w-[85vw] sm:w-[320px] md:w-auto flex-shrink-0 md:flex-shrink bg-white dark:bg-gray-800 rounded-2xl border border-[#E8E8E8] dark:border-gray-700 shadow-sm flex flex-col hover:shadow-md transition-shadow duration-200 min-h-[340px] overflow-hidden">
          <div className="relative w-full h-48 bg-gray-50 dark:bg-gray-900 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {images.map((img, idx) => (
              <div key={idx} className="w-full shrink-0 h-full relative snap-center">
                <Image src={img.url} alt={img.caption || `Property Image ${idx + 1}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {idx + 1} / {images.length}
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Eye size={28} className="text-gray-300" />
                <p className="text-gray-400 text-xs text-center px-4">Stunning visualizations are in progress</p>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Immersive Gallery</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed flex-1">
              Explore {images.length} ultra-HD views of the project architecture.
            </p>
            <button
              onClick={() => router.push(`/property/${propertyDetail.id}`)}
              className="mt-4 w-full h-11 sm:h-[40px] text-xs font-bold border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300"
            >
              <LucideImage size={14} />
              Open Gallery
            </button>
          </div>
        </div>
      </div>

      {/* ─── Full Floor Plan Modal ─── */}
      {showFullFloorPlan && floorPlanImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowFullFloorPlan(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowFullFloorPlan(false)}
              className="absolute -top-3 -right-3 w-12 h-12 sm:w-10 sm:h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg z-10 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X size={20} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <Image
              src={floorPlanImage.url}
              alt="Floor Plan"
              width={1200}
              height={800}
              className="w-full h-auto rounded-2xl object-contain bg-white"
              unoptimized
            />
            <p className="text-white text-center mt-3 text-sm">
              {floorPlanImage.caption || `${propertyDetail.project_name} — Floor Plan`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
