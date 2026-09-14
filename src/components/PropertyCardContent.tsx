'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { Property } from '@/store/useAppStore';
import { usePropertyImage } from '@/hooks/usePropertyImage';

interface PropertyCardContentProps {
  property: Property;
  priority?: boolean;
  onStreetView?: () => void;
}

export function PropertyCardContent({ property, priority = false, onStreetView }: PropertyCardContentProps) {
  const { currentImage, imageError, handleImageError } = usePropertyImage(property);

  return (
    <>
      {currentImage && !imageError ? (
        <Image
          src={currentImage.url}
          alt={currentImage.alt || property.title}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 420px"
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          className="object-cover"
          onError={handleImageError}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-app">
          <span className="text-content-secondary">No image available</span>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85 pointer-events-none z-10" />

      {onStreetView && (
        <button
          onClick={onStreetView}
          className="focus:ring-brand-terracotta/50 absolute right-3 top-3 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/60 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
          aria-label="Explorar barrio y entorno en 360°"
        >
          <MapPin className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
