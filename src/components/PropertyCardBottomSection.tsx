'use client';

import type { Property } from '@/store/useAppStore';
import { PropertyCardActions } from '@/components/PropertyCardActions';

interface PropertyCardBottomSectionProps {
  property: Property;
  isSwipeCard: boolean;
  isAuthenticated: boolean;
  onContactClick: () => void;
  onReject?: (property: Property) => void;
  onToggleFavorite?: (property: Property) => void;
  isFavorite?: boolean;
}

export function PropertyCardBottomSection({ property, isSwipeCard, isAuthenticated, onContactClick, onReject, onToggleFavorite, isFavorite }: PropertyCardBottomSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium drop-shadow">
        {property.rooms && (
          <div className="flex flex-col items-center gap-1">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-white drop-shadow-sm">{property.rooms} bed</span>
          </div>
        )}
        {property.areaM2 && (
          <div className="flex flex-col items-center gap-1">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-white drop-shadow-sm">{property.areaM2} m²</span>
          </div>
        )}
        {property.bathrooms && (
          <div className="flex flex-col items-center gap-1">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <span className="text-white drop-shadow-sm">{property.bathrooms} bath</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {property.amenities.length > 0 && property.amenities.slice(0, 4).map((amenity) => (
          <span key={amenity} className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">
            {amenity}
          </span>
        ))}
      </div>

      <PropertyCardActions
        property={property}
        isSwipeCard={isSwipeCard}
        isAuthenticated={isAuthenticated}
        onContactClick={onContactClick}
        onReject={onReject}
        onToggleFavorite={onToggleFavorite}
        isFavorite={isFavorite}
      />
    </div>
  );
}
