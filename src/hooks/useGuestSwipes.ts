'use client';

import { useState, useEffect, useCallback } from 'react';

export interface GuestSwipe {
  propertyId: string;
  action: 'LIKE' | 'DISLIKE';
  timestamp: number;
}

const STORAGE_KEY = 'propfind_guest_swipes';

function readGuestSwipes(): GuestSwipe[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GuestSwipe[];
  } catch {
    return [];
  }
}

function writeGuestSwipes(swipes: GuestSwipe[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(swipes));
}

export function useGuestSwipes() {
  const [swipes, setSwipes] = useState<GuestSwipe[]>(readGuestSwipes);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSwipes(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const addSwipe = useCallback((swipe: GuestSwipe) => {
    setSwipes((prev) => {
      const next = [swipe, ...prev.filter((s) => s.propertyId !== swipe.propertyId)];
      writeGuestSwipes(next);
      return next;
    });
  }, []);

  const removeSwipe = useCallback((propertyId: string) => {
    setSwipes((prev) => {
      const next = prev.filter((s) => s.propertyId !== propertyId);
      writeGuestSwipes(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    writeGuestSwipes([]);
    setSwipes([]);
  }, []);

  const likes = swipes.filter((s) => s.action === 'LIKE');
  const dislikes = swipes.filter((s) => s.action === 'DISLIKE');

  return {
    swipes,
    likes,
    dislikes,
    addSwipe,
    removeSwipe,
    clear,
  };
}
