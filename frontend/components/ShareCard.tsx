'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Copy, Share2, Check, Download } from 'lucide-react';
import { Property } from '@/types/property';
import { formatPriceCr } from '@/lib/format';

interface ShareCardProps {
  property: Property;
  onClose: () => void;
  onToast: (message: string) => void;
}

export default function ShareCard({ property, onClose, onToast }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const sectorName = property.sector?.name ?? 'Sector 150';
  const sectorCity = property.sector?.city ?? 'Noida';
  const displayName = property.project_name || `${property.bhk} BHK ${property.property_type === 'flat' ? 'Apartment' : 'Plot'}`;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${property.id}` : '';

  const shareText = `Check out ${displayName} in ${sectorName}, ${sectorCity} — ${property.bhk} BHK, ${property.size_sqft.toLocaleString('en-IN')} sq.ft at ${formatPriceCr(property.price)}. Found via RealtyPal AI.`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Failed to copy');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview Card */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Property image */}
          {property.image_url && (
            <div className="w-full h-40 rounded-xl overflow-hidden mb-4 border-2 border-white/20">
              <Image
                src={property.image_url}
                alt={displayName}
                width={400}
                height={200}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Property details */}
          <h3 className="text-xl font-bold mb-1">{displayName}</h3>
          <p className="text-blue-100 text-sm mb-3">{sectorName}, {sectorCity}</p>

          <div className="flex items-center gap-4 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">{property.bhk} BHK</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">{property.size_sqft.toLocaleString('en-IN')} sq.ft</span>
            <span className="bg-white/20 px-3 py-1 rounded-full font-bold">{formatPriceCr(property.price)}</span>
          </div>

          {/* Branding */}
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
            <Image src="/images/logo/realtypals.png" alt="RP" width={24} height={24} className="drop-shadow-sm" />
            <span className="text-xs text-blue-200">Found via RealtyPal AI</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-medium text-sm transition-colors"
          >
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
            {copied ? 'Copied!' : 'Copy Link & Details'}
          </button>

          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <Share2 size={18} />
            Share Property
          </button>
        </div>
      </div>
    </div>
  );
}
