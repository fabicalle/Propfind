'use client';

import { useEffect } from 'react';
import { useSwipeStore } from '@/store/useSwipeStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import type { Property } from '@/store/useAppStore';

export function useSwipeDeckSync(
  displayedProperties: readonly Property[],
  viewMode: 'grid' | 'swipe'
) {
  const setSwipeState = useSwipeStore((state) => state.setCurrentProperty);
  const setSwipeQueue = useSwipeStore((state) => state.setSwipeQueue);
  const favoritesStore = useFavoritesStore();

  useEffect(() => {
    if (viewMode === 'swipe' && displayedProperties.length > 0) {
      const nonDiscarded = displayedProperties.filter(
        (p) => !favoritesStore.discarded.some((d) => d.property.id === p.id)
      );
      if (nonDiscarded.length > 0) {
        setSwipeState(nonDiscarded[0]);
        setSwipeQueue(nonDiscarded.slice(1));
      }
    }
  }, [viewMode, displayedProperties, setSwipeState, setSwipeQueue, favoritesStore.discarded]);
}