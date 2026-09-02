'use client';

import { useCallback, useEffect, useState } from 'react';
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

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
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

  const {
    currentProperty,
    swipeQueue,
  } = useSwipeStore();

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

  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-[300px] sm:max-w-[400px] flex-col items-center gap-4">
        <div className="relative w-full aspect-[9/14] max-h-[65vh] rounded-3xl overflow-hidden shadow-2xl bg-content-primary border border-border-subtle">
          {swipeQueue.slice(0, 2).map((property, index) => (
            <div
              key={property.id}
              className="absolute inset-0"
              style={{
                transform: `scale(${1 - (index + 1) * 0.05}) translateY(${(index + 1) * 8}px)`,
                zIndex: -index - 1,
              }}
            >
              <PropertyCard
                property={property}
                isTop={false}
                dragOffset={{ x: 0, y: 0 }}
                isDragging={false}
                variant="swipe"
                onSelectProperty={handleSelectProperty}
              />
            </div>
          ))}

          {currentProperty && (
            <div
              className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
              {...handlers}
            >
              <PropertyCard
                property={currentProperty}
                isTop={true}
                dragOffset={state.dragOffset}
                isDragging={state.isDragging}
                variant="swipe"
                onSelectProperty={handleSelectProperty}
              />
            </div>
          )}

          {!currentProperty && swipeQueue.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-content-secondary">No more properties</p>
                <button
                  onClick={loadInitialCards}
                   className="mt-4 rounded-full bg-brand-terracotta px-6 py-2 text-sm font-medium text-white shadow-sm"
                >
                  Load more
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 pt-2">
          <button
            onClick={(e) => { e.stopPropagation(); triggerSwipe('left'); }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-clay text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Swipe left"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); undo(); }}
            disabled={!canUndo}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mustard text-content-primary shadow-lg active:scale-95 transition-transform disabled:opacity-30"
            aria-label="Undo"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); triggerSwipe('right'); }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-olive text-white shadow-lg active:scale-95 transition-transform"
            aria-label="Like"
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          </button>
        </div>

        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            isOpen={!!selectedProperty}
            onClose={handleCloseModal}
          />
        )}

        {canUndo && (
          <div className="mt-1 text-xs text-content-secondary">
            Press Ctrl+Z or tap undo to revert
          </div>
        )}
      </div>
    </div>
  );
}
