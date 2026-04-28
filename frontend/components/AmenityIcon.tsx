'use client';

import {
  Dumbbell,
  Car,
  ShieldCheck,
  Trees,
  Flame,
  Waves,
  Trophy,
  Baby,
  Clapperboard,
  ShoppingCart,
  Zap,
  ArrowUpDown,
  Lightbulb,
  Heart,
  Home,
  Flower2,
  Wind,
  Mountain,
  PartyPopper,
  Volleyball,
  IceCreamCone,
  Binoculars,
  Coffee,
  CloudSun,
  Droplets,
  ThermometerSun,
  Sparkles,
  Sofa,
  TreePine,
  Sprout,
  type LucideIcon,
} from 'lucide-react';

export interface AmenityMeta {
  lucideIcon: LucideIcon;
  label: string;
  color: string;
}

// ── Complete amenity mapping (all Lucide icons) ──
const AMENITY_MAP: Record<string, AmenityMeta> = {
  // ─── Pool / Water ───
  swimming_pool: { lucideIcon: Waves, label: 'Swimming Pool', color: 'bg-blue-50' },
  hydrotherapy: { lucideIcon: Droplets, label: 'Hydrotherapy', color: 'bg-blue-50' },
  private_pool: { lucideIcon: Waves, label: 'Private Pool', color: 'bg-blue-50' },
  infinity_pool: { lucideIcon: Waves, label: 'Infinity Pool', color: 'bg-blue-50' },
  temperature_controlled_pool: { lucideIcon: ThermometerSun, label: 'Temperature Pool', color: 'bg-blue-50' },
  steam_sauna: { lucideIcon: Flame, label: 'Steam & Sauna', color: 'bg-orange-50' },

  // ─── Fitness / Sports ───
  gym: { lucideIcon: Dumbbell, label: 'Gym & Fitness', color: 'bg-violet-50' },
  badminton_court: { lucideIcon: Volleyball, label: 'Badminton Court', color: 'bg-green-50' },
  yoga_area: { lucideIcon: Sparkles, label: 'Yoga Area', color: 'bg-purple-50' },
  yoga_room: { lucideIcon: Sparkles, label: 'Yoga Room', color: 'bg-purple-50' },
  yoga_deck: { lucideIcon: Sparkles, label: 'Yoga Deck', color: 'bg-purple-50' },
  yoga_center: { lucideIcon: Sparkles, label: 'Yoga Center', color: 'bg-purple-50' },

  // ─── Sports ───
  cricket_stadium: { lucideIcon: Trophy, label: 'Cricket Stadium', color: 'bg-green-50' },
  cricket_pitch: { lucideIcon: Trophy, label: 'Cricket Pitch', color: 'bg-green-50' },
  skating_rink: { lucideIcon: IceCreamCone, label: 'Skating Rink', color: 'bg-purple-50' },
  tennis_court: { lucideIcon: Volleyball, label: 'Tennis Court', color: 'bg-green-50' },
  sports_courts: { lucideIcon: Volleyball, label: 'Sports Courts', color: 'bg-green-50' },

  // ─── Clubhouse / Lounge ───
  resort_style_clubhouse: { lucideIcon: Sofa, label: 'Resort Clubhouse', color: 'bg-amber-50' },
  clubhouse: { lucideIcon: Sofa, label: 'Clubhouse', color: 'bg-amber-50' },
  luxury_club: { lucideIcon: Sparkles, label: 'Luxury Club', color: 'bg-amber-50' },
  luxury_lobby: { lucideIcon: Sparkles, label: 'Luxury Lobby', color: 'bg-amber-50' },
  sky_lounge: { lucideIcon: CloudSun, label: 'Sky Lounge', color: 'bg-sky-50' },

  // ─── Entertainment ───
  floating_restaurant: { lucideIcon: Coffee, label: 'Restaurant', color: 'bg-rose-50' },
  amphitheatre: { lucideIcon: Clapperboard, label: 'Amphitheatre', color: 'bg-purple-50' },
  mini_theater: { lucideIcon: Clapperboard, label: 'Mini Theater', color: 'bg-purple-50' },
  cafe: { lucideIcon: Coffee, label: 'Café & Lounge', color: 'bg-rose-50' },

  // ─── Kids / Family ───
  kids_play_area: { lucideIcon: Baby, label: 'Kids Play Area', color: 'bg-pink-50' },
  child_development_center: { lucideIcon: Baby, label: 'Kids Center', color: 'bg-pink-50' },
  private_party_deck: { lucideIcon: PartyPopper, label: 'Party Deck', color: 'bg-pink-50' },

  // ─── Shopping ───
  shopping_center: { lucideIcon: ShoppingCart, label: 'Shopping Center', color: 'bg-teal-50' },
  convenience_store: { lucideIcon: ShoppingCart, label: 'Convenience Store', color: 'bg-teal-50' },

  // ─── Security / Tech ───
  security: { lucideIcon: ShieldCheck, label: '24/7 Security', color: 'bg-slate-50' },
  concierge: { lucideIcon: ShieldCheck, label: 'Concierge', color: 'bg-slate-50' },
  concierge_service: { lucideIcon: ShieldCheck, label: 'Concierge Service', color: 'bg-slate-50' },
  smart_home_automation: { lucideIcon: Lightbulb, label: 'Smart Home', color: 'bg-indigo-50' },

  // ─── Tech ───
  power_backup: { lucideIcon: Zap, label: 'Power Backup', color: 'bg-yellow-50' },
  private_elevator: { lucideIcon: ArrowUpDown, label: 'Private Elevator', color: 'bg-slate-50' },
  automated_lighting: { lucideIcon: Lightbulb, label: 'Smart Lighting', color: 'bg-yellow-50' },
  high_speed_lifts: { lucideIcon: ArrowUpDown, label: 'High-Speed Lifts', color: 'bg-slate-50' },
  health_wellness_clinic: { lucideIcon: Heart, label: 'Wellness Clinic', color: 'bg-red-50' },

  // ─── Parking ───
  parking: { lucideIcon: Car, label: 'Parking', color: 'bg-gray-50' },
  dedicated_parking: { lucideIcon: Car, label: 'Dedicated Parking', color: 'bg-gray-50' },

  // ─── Garden / Outdoor ───
  golf_course: { lucideIcon: TreePine, label: 'Golf Course', color: 'bg-emerald-50' },
  golf_facing: { lucideIcon: TreePine, label: 'Golf View', color: 'bg-emerald-50' },
  golf_course_access: { lucideIcon: TreePine, label: 'Golf Access', color: 'bg-emerald-50' },
  golf_view: { lucideIcon: TreePine, label: 'Golf View', color: 'bg-emerald-50' },
  organic_garden: { lucideIcon: Sprout, label: 'Organic Garden', color: 'bg-emerald-50' },
  private_garden: { lucideIcon: Sprout, label: 'Private Garden', color: 'bg-emerald-50' },
  pitch_and_putt_golf: { lucideIcon: TreePine, label: 'Golf', color: 'bg-emerald-50' },
  orchard_gardens: { lucideIcon: Trees, label: 'Orchard Gardens', color: 'bg-emerald-50' },

  // ─── Outdoor ───
  forest_groves: { lucideIcon: Trees, label: 'Forest Grove', color: 'bg-emerald-50' },
  sculpture_garden: { lucideIcon: Flower2, label: 'Sculpture Garden', color: 'bg-emerald-50' },
  panoramic_view: { lucideIcon: Binoculars, label: 'Panoramic View', color: 'bg-sky-50' },
  three_side_open: { lucideIcon: Wind, label: 'Three-Side Open', color: 'bg-sky-50' },
  private_terrace: { lucideIcon: CloudSun, label: 'Private Terrace', color: 'bg-sky-50' },
  low_density: { lucideIcon: Mountain, label: 'Low Density', color: 'bg-emerald-50' },

  // ─── Luxury / Interior ───
  marazzo_flooring: { lucideIcon: Home, label: 'Premium Flooring', color: 'bg-amber-50' },
  luxury_interiors: { lucideIcon: Home, label: 'Luxury Interiors', color: 'bg-amber-50' },
  ac_units: { lucideIcon: Wind, label: 'AC Units', color: 'bg-sky-50' },
  modular_kitchen: { lucideIcon: Home, label: 'Modular Kitchen', color: 'bg-amber-50' },
  electric_charging_station: { lucideIcon: Zap, label: 'EV Charging', color: 'bg-yellow-50' },
};

/**
 * Get amenity metadata. Returns the mapping or generates a fallback.
 */
export function getAmenityMeta(amenityKey: string): AmenityMeta {
  if (AMENITY_MAP[amenityKey]) return AMENITY_MAP[amenityKey];

  // Fallback: generate a readable label
  const label = amenityKey
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { lucideIcon: Home, label, color: 'bg-gray-50' };
}

/**
 * Get deduplicated amenity list (max count, no duplicate icons)
 */
export function getMappedAmenities(amenities: string[], max = 6): AmenityMeta[] {
  const seen = new Set<string>();
  return amenities
    .map((a) => ({ key: a, meta: getAmenityMeta(a) }))
    .filter(({ meta }) => {
      const iconKey = meta.lucideIcon?.displayName || meta.label;
      if (seen.has(iconKey)) return false;
      seen.add(iconKey);
      return true;
    })
    .map(({ meta }) => meta)
    .slice(0, max);
}

// ── Rendering sizes ──
type AmenitySize = 'sm' | 'md' | 'lg' | 'xl';

const sizeMap = {
  sm: { tile: 'w-9 h-9', lucide: 14, label: 'text-[9px]' },
  md: { tile: 'w-12 h-12', lucide: 18, label: 'text-[10px]' },
  lg: { tile: 'w-16 h-16', lucide: 24, label: 'text-xs' },
  xl: { tile: 'w-20 h-20', lucide: 32, label: 'text-sm' },
};

interface AmenityIconProps {
  amenity: string;
  size?: AmenitySize;
  showLabel?: boolean;
}

/**
 * Renders a single amenity icon tile (custom SVG or Lucide)
 */
export default function AmenityIcon({ amenity, size = 'md', showLabel = true }: AmenityIconProps) {
  const meta = getAmenityMeta(amenity);
  const s = sizeMap[size];
  const LucideComp = meta.lucideIcon;

  return (
    <div className="flex flex-col items-center gap-1" title={meta.label}>
      <div className={`${s.tile} ${meta.color} rounded-xl flex items-center justify-center transition-colors hover:brightness-95 grayscale`}>
        {LucideComp ? (
          <LucideComp size={s.lucide} className="text-gray-600" strokeWidth={1.8} />
        ) : (
          <span className="text-gray-400 text-xs">•</span>
        )}
      </div>
      {showLabel && (
        <span className={`${s.label} text-gray-500 text-center leading-tight max-w-[4.5rem] truncate`}>
          {meta.label}
        </span>
      )}
    </div>
  );
}

/**
 * Renders a grid of amenity icon tiles
 */
export function AmenityGrid({
  amenities,
  max = 6,
  size = 'md',
  showLabel = true,
  cols = 'grid-cols-3 sm:grid-cols-6',
}: {
  amenities: string[];
  max?: number;
  size?: AmenitySize;
  showLabel?: boolean;
  cols?: string;
}) {
  const mapped = getMappedAmenities(amenities, max);
  if (mapped.length === 0) return null;

  return (
    <div className={`grid ${cols} gap-3`}>
      {amenities.slice(0, max).map((a, idx) => (
        <AmenityIcon key={idx} amenity={a} size={size} showLabel={showLabel} />
      ))}
    </div>
  );
}
