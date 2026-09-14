'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import type { Property } from '@/store/useAppStore';

export interface FavoriteCardProps {
  property: Property;
  onRemove?: () => void;
  onContact?: () => void;
  onDelete?: () => void;
  mode: 'favorite' | 'discarded';
}

export function FavoriteCard({ property, onRemove, onContact, onDelete, mode }: FavoriteCardProps) {
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = property.images || [];
  const currentImage = images[currentImageIndex];
  const isFavorite = mode === 'favorite';

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex > 0) setCurrentImageIndex((prev) => prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentImageIndex < images.length - 1) setCurrentImageIndex((prev) => prev + 1);
  };

  const handleGoogleStreetView = () => {
    if (!property.lat || !property.lng) return;
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...motionTokens.spring.gentle }}
      className="group relative h-[480px] overflow-hidden rounded-2xl border border-border-subtle bg-card shadow-sm transition-all hover:shadow-md"
    >
      {currentImage && !imageError ? (
        <Image
          src={currentImage.url}
          alt={currentImage.alt || property.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          loading="eager"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-app">
          <span className="text-sm text-content-secondary">No image available</span>
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Floating badge */}
      <div className="absolute left-4 top-4">
        <span className="rounded-full border border-white/20 bg-white/90 px-3 py-1 text-xs font-semibold text-content-primary shadow-sm backdrop-blur">
          {property.listingType === 'sale'
            ? 'Venta'
            : property.listingType === 'rent'
              ? property.listingSubType === 'temporal'
                ? 'Alquiler temporal'
                : 'Alquiler'
              : property.listingType}
        </span>
      </div>

      <button
        onClick={handleGoogleStreetView}
        className="absolute right-3 top-3 z-20 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:scale-110"
        title="Explorar barrio y entorno en 360°"
      >
        <MapPin className="h-5 w-5" />
      </button>

      {/* Image navigation */}
      {images.length > 1 && (
        <>
          <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handlePrevImage}
              disabled={currentImageIndex === 0}
              className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              disabled={currentImageIndex === images.length - 1}
              className="rounded-full bg-black/60 p-2 text-white backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-30"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Image dots */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full bg-white transition-all ${
                  idx === currentImageIndex ? 'w-4 opacity-100' : 'w-1.5 opacity-50'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-6 pb-8">
        {/* Price */}
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">${property.price.toLocaleString()}</span>
          {property.listingType === 'rent' && (
            <span className="text-sm text-white/80">/mo</span>
          )}
        </div>

        {/* Title */}
        <h3 className="mb-1 text-xl font-semibold text-white line-clamp-2">{property.title}</h3>

        {/* Address */}
        <div className="mb-4 flex items-center gap-1 text-sm text-white/80">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">
            {property.neighborhood}
            {property.city && `, ${property.city}`}
          </span>
        </div>

        {/* Metrics */}
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-white/80">
          {property.rooms && <span>{property.rooms} amb</span>}
          {property.bedrooms && <span>{property.bedrooms} dorm</span>}
          {property.areaM2 && <span>{property.areaM2} m²</span>}
          {property.bathrooms && <span>{property.bathrooms} baños</span>}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {isFavorite ? (
            <>
              {onContact && (
                <button
                  onClick={onContact}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-content-primary backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  Contactar
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 rounded-full bg-brand-clay/80 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 hover:bg-brand-clay"
                >
                  <Heart className="h-4 w-4" />
                  Quitar de mi lista
                </button>
              )}
            </>
          ) : (
            <>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 rounded-full bg-brand-clay/80 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:scale-105 active:scale-95 hover:bg-brand-clay"
                >
                  <Heart className="h-4 w-4" />
                  Quitar de mi lista
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
