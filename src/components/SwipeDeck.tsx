'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useSwipeStore } from '@/store/useSwipeStore';
import { useSwipeDeck } from '@/hooks/useSwipeDeck';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useSwipeKeyboard } from '@/hooks/useSwipeKeyboard';
import { PropertyCard } from './PropertyCard';
import PropertyDetailModal from './PropertyDetailModal';
import type { Property, SwipeDirection } from '@/store/useAppStore';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useGuestSwipes } from '@/hooks/useGuestSwipes';
import { csrfFetch } from '@/lib/security/csrfClient';

interface SwipeDeckProps {
  initialProperties?: Property[];
}

interface SwipeCardProps {
  property: Property | null;
  index: number;
  total: number;
  onRemove: (direction: 'left' | 'right') => void;
  onSelectProperty: (property: Property) => void;
}

const SWIPE_THRESHOLD = 120;

const SwipeCard: React.FC<SwipeCardProps> = ({
  property,
  index,
  onRemove,
  onSelectProperty,
}) => {
  if (!property) return null;

  const isFront = index === 0;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      void x.set(400);
      onRemove('right');
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      void x.set(-400);
      onRemove('left');
    } else {
      void x.set(0);
    }
  };

  const scale = 1 - index * 0.05;
  const yOffset = index * 14;

  return (
    <motion.div
      key={property.id}
      style={{
        x: isFront ? x : 0,
        rotate: isFront ? rotate : 0,
        zIndex: 10 - index,
      }}
      animate={{
        scale,
        y: yOffset,
        opacity: index === 2 ? 0.6 : 1,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      drag={isFront ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={isFront ? handleDragEnd : undefined}
      className="absolute inset-0"
    >
      <div
        className={`relative overflow-hidden rounded-3xl bg-card shadow-2xl ${
          isFront ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'
        }`}
      >
        {isFront && (
          <>
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-8 left-8 z-20 -rotate-12 rounded-2xl border-4 border-emerald-400 bg-emerald-500/20 px-4 py-2 text-xl font-black uppercase text-emerald-400 backdrop-blur-md"
            >
              ME INTERESA
            </motion.div>
            <motion.div
              style={{ opacity: passOpacity }}
              className="absolute top-8 right-8 z-20 rotate-12 rounded-2xl border-4 border-rose-500 bg-rose-500/20 px-4 py-2 text-xl font-black uppercase text-rose-500 backdrop-blur-md"
            >
              PASAR
            </motion.div>
          </>
        )}

        <PropertyCard
          property={property}
          isTop={isFront}
          dragOffset={{ x: isFront ? (x.get() ?? 0) : 0, y: 0 }}
          isDragging={isFront}
          variant="swipe"
          onSelectProperty={onSelectProperty}
        />
      </div>
    </motion.div>
  );
};

export function SwipeDeck({ initialProperties = [] }: SwipeDeckProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const favoritesStore = useFavoritesStore();
  const { addSwipe } = useGuestSwipes();

  const handleSwipeComplete = useCallback(async (direction: SwipeDirection, property: Property) => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      const action = direction === 'right' || direction === 'up' ? 'LIKE' : 'DISLIKE';
      addSwipe({ propertyId: property.id, action, timestamp: Date.now() });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (direction === 'right' || direction === 'up') {
        favoritesStore.addFavorite(property);
      } else if (direction === 'left') {
        favoritesStore.discard(property);
      }
    } else {
      const action = direction === 'right' || direction === 'up' ? 'LIKE' : 'DISLIKE';
      addSwipe({ propertyId: property.id, action, timestamp: Date.now() });
    }
  }, [favoritesStore, addSwipe]);

  const { currentProperty, swipeQueue } = useSwipeStore();
  const { state, handlers, triggerSwipe, undo, canUndo } = useSwipeDeck(handleSwipeComplete, initialProperties);
  const { track } = useTelemetry();
  useSwipeKeyboard({ triggerSwipe, undo, canUndo });

  const handleSelectProperty = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  const loadInitialCards = useCallback(async () => {
    try {
      const response = await csrfFetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });

      if (response.ok) {
        const result = await response.json();
        const properties = result.data?.properties || [];
        if (properties.length) {
          useSwipeStore.setState({
            currentProperty: properties[0],
            swipeQueue: properties.slice(1),
          });
          track('CARD_VIEW', { propertyId: properties[0].id, source: 'deck' });
        }
      }
    } catch {
      // Handle error
    }
  }, [track]);

  useEffect(() => {
    if (!currentProperty && swipeQueue.length === 0 && initialProperties.length === 0) {
      loadInitialCards();
    }
  }, [currentProperty, swipeQueue.length, initialProperties.length, loadInitialCards]);

  const allCards = [currentProperty, ...swipeQueue].slice(0, 3);

  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4">
      <div className="relative flex w-full max-w-[300px] sm:max-w-[400px] flex-col items-center gap-4">
        <div className="relative mx-auto aspect-[9/14] w-full max-h-[65vh] rounded-3xl overflow-hidden shadow-2xl bg-content-primary border border-border-subtle">
          <AnimatePresence>
            {allCards.map((property, index) => {
              if (!property) return null;
              return (
                <SwipeCard
                  key={property.id}
                  property={property}
                  index={index}
                  total={allCards.length}
                  onRemove={(direction) => {
                    if (direction === 'right') {
                      triggerSwipe('right');
                    } else {
                      triggerSwipe('left');
                    }
                  }}
                  onSelectProperty={handleSelectProperty}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {!currentProperty && swipeQueue.length === 0 && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="rounded-2xl bg-surface-secondary border border-border-subtle p-6 text-center">
              <div className="mb-3 rounded-full bg-brand-olive/10 p-4 text-brand-olive">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-lg font-bold text-content-primary">
                ¡Llegaste al final!
              </h3>
              <p className="mt-1 text-sm text-content-secondary">
                No hay más propiedades en este lote. Vuelve a filtrar o actualiza.
              </p>
              <button
                onClick={loadInitialCards}
                className="mt-4 rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-terracotta/90"
              >
                Cargar más
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={() => triggerSwipe('left')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-clay text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Rechazar"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mustard text-content-primary shadow-lg active:scale-95 transition-transform disabled:opacity-30"
            aria-label="Deshacer"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            onClick={() => triggerSwipe('right')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-olive text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Me interesa"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          </button>
        </div>

        {canUndo && (
          <div className="mt-1 text-xs text-content-secondary">
            Presioná Ctrl+Z o tocá deshacer para revertir
          </div>
        )}
      </div>

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
