export interface Sector {
  id: string;
  city: string;
  name: string;
  avg_price_low: number;
  avg_price_high: number;
  demand_level: 'low' | 'medium' | 'high';
  supply_level: 'low' | 'medium' | 'high';
  volatility_flag: boolean;
}

export interface PropertyValidation {
  market_range: { low: number; high: number };
  verdict: 'Within market' | 'Slightly high' | 'Aggressive' | 'Market range only';
  risk_flag: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence_level?: string;
  reason_codes: string[];
}

export interface PropertyImage {
  id: string;
  image_url: string;
  image_type: 'exterior' | 'interior' | 'floor_plan' | 'amenity' | 'view';
  caption?: string | null;
  sort_order: number;
}

export interface Property {
  id: string;
  sector_id: string;
  property_type: 'flat' | 'plot';
  bhk: number;
  size_sqft: number;
  price: number;
  price_per_sqft: number;
  builder: string;
  project_name?: string | null;
  image_url?: string | null;
  floor: number | null;
  status: 'ready' | 'under_construction';
  amenities: string[];
  bathrooms?: number | null;
  balconies?: number | null;
  highlights?: string[];
  images?: PropertyImage[];
  sector: Sector;
  score?: number;
  match_score?: number;
  property_index?: number;
  property_reference?: string;
  validation?: PropertyValidation | null;
}

export interface PropertyDetail {
  id: string;
  project_name: string;
  bhk: number;
  size_sqft: number;
  price: number;
  bathrooms?: number;
  balconies?: number;
  status: string;
  builder: string;
  amenities: string[];
  highlights: string[];
  images: { url: string; caption?: string; type: string }[];
}

export interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  properties?: Property[];
  images?: { url: string; caption?: string; type: string }[];
  highlights?: string[];
  amenities?: string[];
  propertyDetail?: PropertyDetail;
  showSectorIntelligence?: boolean;
  timestamp: string;
  intent?: {
    completenessScore?: number;
    bhk?: number;
    budget?: {
      min?: number;
      max?: number;
      flexibility?: string;
    };
    purpose?: string;
  };
}
