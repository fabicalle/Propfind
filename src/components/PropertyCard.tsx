'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { Property } from '@/store/useAppStore';
import { motionTokens } from '@/lib/motion/tokens';
import { MapPin, Heart, X, Mail } from 'lucide-react';
import { usePropertyImage } from '@/hooks/usePropertyImage';
import { useSessionStore } from '@/store/useSessionStore';
import { useRouter } from 'next/navigation';
import { ContactModal } from '@/features/properties/components/ContactModal';

interface PropertyCardProps {
  property: Property;
  isTop: boolean;
  dragOffset: { x: number; y: number };
  isDragging: boolean;
  variant?: 'swipe' | 'grid';
  onToggleFavorite?: (property: Property) => void;
  isFavorite?: boolean;
  onReject?: (property: Property) => void;
  onSelectProperty?: (property: Property) => void;
}

export function PropertyCard({ property, isTop, dragOffset, isDragging, variant = isTop ? 'swipe' : 'grid', onToggleFavorite, isFavorite, onReject, onSelectProperty }: PropertyCardProps) {
  const { currentImage, imageError, handleNextImage, handlePrevImage, handleImageError } = usePropertyImage(property);
  const isAuthenticated = useSessionStore((state) => state.userSession.isAuthenticated);
  const router = useRouter();
  const [showContactModal, setShowContactModal] = useState(false);

  const handleCardClick = useCallback(() => {
    onSelectProperty?.(property);
  }, [onSelectProperty, property]);

  const handleContactClick = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/properties/${property.id}`);
      return;
    }
    setShowContactModal(true);
  }, [isAuthenticated, router, property.id]);

  const handleGoogleStreetView = useCallback(() => {
    if (!property.lat || !property.lng) return;
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [property.lat, property.lng]);

  const rotate = isTop && isDragging ? dragOffset.x * 0.05 : 0;
  const opacity = isTop ? 1 - Math.abs(dragOffset.x) / 1000 : 1;
  const isSwipeCard = isTop || isDragging;

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
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={motionTokens.spring.gentle}
      className={isSwipeCard ? 'w-full h-full' : 'relative h-[320px] sm:h-[400px] md:h-[480px] overflow-hidden rounded-3xl border border-border-subtle/60 bg-app p-1.5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]'}
      onClick={!isSwipeCard ? handleCardClick : undefined}
      style={{
        x: isTop && isDragging ? dragOffset.x : 0,
        rotate,
        opacity,
        zIndex: isTop ? 50 : 0,
      }}
    >
      {isSwipeCard ? (
        <div className="relative h-full w-full">
          {currentImage && !imageError ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt || property.title}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 420px"
              priority={isTop}
              loading={isTop ? 'eager' : 'lazy'}
              className="object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-app">
              <span className="text-content-secondary">No image available</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none z-10" />

          <button
            onClick={handleGoogleStreetView}
            className="focus:ring-brand-terracotta/50 absolute right-3 top-3 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/60 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
            aria-label="Explorar barrio y entorno en 360°"
          >
            <MapPin className="h-5 w-5" />
          </button>

          <div className="relative z-20 flex h-full flex-col justify-between pt-16 pb-6 px-6 text-white">
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
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full rounded-[calc(2rem-0.375rem)] bg-card overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          {currentImage && !imageError ? (
            <Image
              src={currentImage.url}
              alt={currentImage.alt || property.title}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 420px"
              priority={isTop}
              loading={isTop ? 'eager' : 'lazy'}
              className="object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-app">
              <span className="text-content-secondary">No image available</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none z-10" />

          <button
            onClick={handleGoogleStreetView}
            className="focus:ring-brand-terracotta/50 absolute right-3 top-3 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/60 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
            aria-label="Explorar barrio y entorno en 360°"
          >
            <MapPin className="h-5 w-5" />
          </button>

          {!isSwipeCard && (
            <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
              <span className="px-3 py-1 bg-brand-terracotta text-white text-xs font-bold rounded-full shadow">{operationLabel}</span>
              {sellerLabel && (
                <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/20">{sellerLabel}</span>
              )}
            </div>
          )}

          <div className="relative z-20 flex h-full flex-col justify-between pt-12 pb-20 px-6 text-white">
            <div className="flex flex-col gap-3">
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

              {!isSwipeCard && variant !== 'grid' && (
                <div className="flex items-center justify-center gap-3">
                  {onReject && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(property);
                      }}
                      className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-clay outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
                      aria-label="No me interesa"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  {isAuthenticated ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactClick();
                      }}
                      className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-terracotta outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
                      aria-label="Contactar al anunciante"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContactClick();
                      }}
                      className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-terracotta outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
                      aria-label="Iniciar sesión para contactar"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                  )}
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(property);
                      }}
                      className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-clay outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
                      aria-label={isFavorite ? 'Quitar de mi lista' : 'Añadir a mi lista'}
                    >
                      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ContactModal
        property={property}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        isAuthenticated={isAuthenticated}
        onLoginRedirect={() => router.push(`/login?redirect=/properties/${property.id}`)}
      />
    </motion.div>
  );
}
