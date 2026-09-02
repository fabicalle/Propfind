'use client';

import { create } from 'zustand';
import type { PropertySearchFilters } from '@/domain/value-objects';

export type SwipeDirection = 'left' | 'right' | 'up';

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
  listingType: string;
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
  imagesGallery?: string[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
  } | null;
  extendedFeatures?: string[];
}

export interface FilterCriteria extends PropertySearchFilters {}

export interface SavedFilter {
  id: string;
  filterName: string;
  criteria: FilterCriteria;
  isDefault: boolean;
  createdAt: string;
}

export interface UndoEntry {
  propertyId: string;
  property: Property;
  interactionType: string;
  direction: SwipeDirection;
  timestamp: number;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
}

export interface TelemetryEvent {
  type: string;
  payload: Record<string, unknown>;
}

interface AppState {
  activeTab: 'swipe' | 'map';

  setActiveTab: (tab: 'swipe' | 'map') => void;
}

export const useAppStore = create<AppState>()((set) => ({
  activeTab: 'swipe',

  setActiveTab: (tab) => set({ activeTab: tab }),
}));
