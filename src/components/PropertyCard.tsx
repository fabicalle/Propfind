'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Property } from '@/store/useAppStore';
import { motionTokens } from '@/lib/motion/tokens';
import { usePropertyImage } from '@/hooks/usePropertyImage';
import { useSessionStore } from '@/store/useSessionStore';
import { useRouter } from 'next/navigation';
import { ContactModal } from '@/features/properties/components/ContactModal';
import { PropertyCardContent } from '@/components/PropertyCardContent';
import { PropertyCardTopSection } from '@/components/PropertyCardTopSection';
import { PropertyCardBottomSection } from '@/components/PropertyCardBottomSection';

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
          <PropertyCardContent property={property} priority={isTop} onStreetView={handleGoogleStreetView} />
          <div className="relative z-20 flex h-full flex-col justify-between pt-16 pb-6 px-6 text-white">
            <PropertyCardTopSection property={property} />
            <PropertyCardBottomSection
              property={property}
              isSwipeCard={isSwipeCard}
              isAuthenticated={isAuthenticated}
              onContactClick={handleContactClick}
              onReject={onReject}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite}
            />
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full rounded-[calc(2rem-0.375rem)] bg-card overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
          <PropertyCardContent property={property} onStreetView={handleGoogleStreetView} />
          <div className="relative z-20 flex h-full flex-col justify-between pt-12 pb-20 px-6 text-white">
            <PropertyCardTopSection property={property} />
            <PropertyCardBottomSection
              property={property}
              isSwipeCard={isSwipeCard}
              isAuthenticated={isAuthenticated}
              onContactClick={handleContactClick}
              onReject={onReject}
              onToggleFavorite={onToggleFavorite}
              isFavorite={isFavorite}
            />
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
