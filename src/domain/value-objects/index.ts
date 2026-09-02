export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface PropertySearchFilters {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  rooms?: number[];
  bedrooms?: number[];
  bathrooms?: number;
  propertyTypes?: string[];
  amenities?: string[];
  listingType?: 'sale' | 'rent';
  listingSubType?: 'temporal';
  currency?: 'ARS' | 'USD';
  creditApproved?: boolean;
  parking?: 'any' | '1+' | '2+';
  sellerType?: 'OWNER' | 'AGENCY';
  bbox?: BoundingBox;
}

export interface SearchParams {
  bbox: BoundingBox;
  filters: PropertySearchFilters;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  price: number;
  priceCurrency?: string;
  totalMonthlyCost?: number;
  areaM2?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  listingType: 'sale' | 'rent';
  listingSubType?: string;
  sellerType?: 'OWNER' | 'AGENCY';
  creditApproved?: boolean;
  parking?: string;
  lat: number;
  lng: number;
  address?: string;
  neighborhood?: string;
  city?: string;
  images?: Array<{ url: string; width: number; height: number; alt?: string }>;
  amenities?: string[];
  sourceUrl?: string;
  publisherId?: string;
}

export interface RecordSwipeInput {
  propertyId: string;
  direction: 'left' | 'right' | 'up';
  metadata?: {
    swipeVelocity?: number;
    timeOnCardMs?: number;
    source?: string;
  };
}
