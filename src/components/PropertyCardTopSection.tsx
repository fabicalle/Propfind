'use client';

import type { Property } from '@/store/useAppStore';

interface PropertyCardTopSectionProps {
  property: Property;
}

export function PropertyCardTopSection({ property }: PropertyCardTopSectionProps) {
  const operationLabel = (() => {
    if (property.listingType === 'sale') return 'Venta';
    if (property.listingType === 'rent') {
      if (property.listingSubType === 'temporal') return 'Alquiler temporal';
      return 'Alquiler';
    }
    return 'Sin tipo';
  })();

  const sellerLabel = property.sellerType === 'OWNER' ? 'Dueño directo' : property.sellerType === 'AGENCY' ? 'Inmobiliaria' : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-3 py-1 bg-brand-terracotta text-white text-xs font-bold rounded-full shadow">{operationLabel}</span>
        {sellerLabel && (
          <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20">{sellerLabel}</span>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-lg">
          ${property.price.toLocaleString()} {property.priceCurrency === 'ARS' ? 'ARS' : 'USD'}
        </h2>
        {property.listingType === 'rent' && (
          <span className="text-sm text-white drop-shadow">/mo</span>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-semibold leading-snug line-clamp-2 drop-shadow-lg font-display">{property.title}</h3>
        <p className="text-sm text-white/80 font-medium drop-shadow">
          {property.neighborhood}
          {property.city && `, ${property.city}`}
        </p>
      </div>
    </div>
  );
}
