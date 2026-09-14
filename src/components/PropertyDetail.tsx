'use client';

import { useRouter } from 'next/navigation';
import type { Property } from '@/store/useAppStore';
import { ContactButton } from '@/components/ContactButton';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { useFavoritesStore } from '@/store/useFavoritesStore';

interface PropertyDetailProps {
  property: Property;
}

export function PropertyDetail({ property }: PropertyDetailProps) {
  const router = useRouter();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(property.id));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const handleGoogleStreetView = () => {
    if (!property.lat || !property.lng) return;
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-app text-content-primary">
      <div className="mx-auto max-w-4xl">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-sm text-content-secondary transition-colors hover:text-content-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        {/* Image Gallery */}
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-content-primary">
          {property.images?.[0] && (
            <img
              src={property.images[0].url}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          )}
          {property.images?.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
              {property.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Property Info */}
        <div className="mt-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-content-primary">{property.title}</h1>
            <p className="mt-1 text-content-secondary">
              {property.neighborhood}{property.city && `, ${property.city}`}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-brand-terracotta">
              ${property.price.toLocaleString()}
            </span>
            {property.listingType === 'rent' && (
              <span className="text-lg text-content-secondary">/mes</span>
            )}
            {property.totalMonthlyCost && (
              <span className="ml-4 text-sm text-content-secondary">
                Expensas: ${property.totalMonthlyCost.toLocaleString()}
              </span>
            )}
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap gap-6">
            {property.rooms && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-content-secondary">{property.rooms} dormitorios</span>
              </div>
            )}
            {property.areaM2 && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <span className="text-content-secondary">{property.areaM2} m²</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span className="text-content-secondary">{property.bathrooms} baños</span>
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <div>
              <h3 className="mb-2 text-lg font-semibold text-content-primary">Descripción</h3>
              <p className="text-content-secondary leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities?.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold text-content-primary">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full bg-border-chip px-3 py-1 text-sm text-content-primary"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={handleGoogleStreetView}
              className="flex items-center gap-2 rounded-full bg-brand-olive px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 hover:bg-brand-olive/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Explorar barrio y entorno en 360°
            </button>

            <button
              onClick={() => toggleFavorite(property)}
              className={`flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:scale-105 active:scale-95 ${
                isFavorite
                  ? 'bg-card border border-border-subtle text-content-primary'
                   : 'bg-brand-olive text-white hover:bg-brand-olive/90'
              }`}
            >
              <svg
                className="h-4 w-4"
                fill={isFavorite ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" />
              </svg>
              {isFavorite ? 'Guardado' : 'Me gusta'}
            </button>

            <ContactButton propertyId={property.id} propertyTitle={property.title} />
          </div>
        </div>
      </div>
    </div>
  );
}
