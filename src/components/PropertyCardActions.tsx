'use client';

import { useCallback } from 'react';
import { Heart, X, Mail } from 'lucide-react';
import type { Property } from '@/store/useAppStore';
import { useSessionStore } from '@/store/useSessionStore';

interface PropertyCardActionsProps {
  property: Property;
  isSwipeCard: boolean;
  isAuthenticated: boolean;
  onContactClick: () => void;
  onReject?: (property: Property) => void;
  onToggleFavorite?: (property: Property) => void;
  isFavorite?: boolean;
}

export function PropertyCardActions({ property, isSwipeCard, isAuthenticated, onContactClick, onReject, onToggleFavorite, isFavorite }: PropertyCardActionsProps) {
  const handleRejectClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onReject?.(property);
  }, [onReject, property]);

  const handleContactButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onContactClick();
  }, [onContactClick]);

  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite?.(property);
  }, [onToggleFavorite, property]);

  if (isSwipeCard) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {onReject && (
        <button
          onClick={handleRejectClick}
          className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-clay outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
          aria-label="No me interesa"
        >
          <X className="h-5 w-5" />
        </button>
      )}
      <button
        onClick={handleContactButtonClick}
        className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-terracotta outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
        aria-label={isAuthenticated ? 'Contactar al anunciante' : 'Iniciar sesión para contactar'}
      >
        <Mail className="h-5 w-5" />
      </button>
      {onToggleFavorite && (
        <button
          onClick={handleFavoriteClick}
          className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 text-brand-clay outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
          aria-label={isFavorite ? 'Quitar de mi lista' : 'Añadir a mi lista'}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}
