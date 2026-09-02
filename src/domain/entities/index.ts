export interface PropertyImage {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string | null;
  price: number;
  priceCurrency: string;
  totalMonthlyCost: number | null;
  areaM2: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  listingType: 'sale' | 'rent';
  listingSubType?: string | null;
  sellerType?: 'OWNER' | 'AGENCY' | null;
  creditApproved?: boolean | null;
  parking?: string | null;
  lat: number;
  lng: number;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  images: PropertyImage[];
  amenities: string[];
  sourceUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  publisherId: string | null;
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
  } | null;
}

export interface FilterCriteria {
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
  bbox?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
}

export interface SavedFilter {
  id: string;
  filterName: string;
  criteria: FilterCriteria;
  isDefault: boolean;
  createdAt: string;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
}

export interface UserInteraction {
  id: string;
  userId: string | null;
  propertyId: string;
  interactionType: 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SUPERLIKE' | 'VIEW_DETAIL' | 'CONTACT_REALTOR' | 'SAVE' | 'SHARE';
  swipeDirection: 'left' | 'right' | 'up' | null;
  sessionId: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

export interface PublisherProfile {
  id: string;
  userId: string;
  companyName: string | null;
  licenseNumber: string | null;
  phone: string;
  verified: boolean;
  createdAt: Date;
}

export type SwipeDirection = 'left' | 'right' | 'up';

export interface TelemetryEvent {
  type: string;
  payload: Record<string, unknown>;
}
