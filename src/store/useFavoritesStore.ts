'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Property } from '@/store/useAppStore';

interface FavoriteEntry {
  property: Property;
}

interface DiscardedEntry {
  property: Property;
}

interface FavoritesState {
  favorites: FavoriteEntry[];
  discarded: DiscardedEntry[];
  addFavorite: (property: Property) => void;
  removeFavorite: (propertyId: string) => void;
  isFavorite: (propertyId: string) => boolean;
  toggleFavorite: (property: Property) => void;
  discard: (property: Property) => void;
  removeDiscarded: (propertyId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      discarded: [],

      addFavorite: (property) =>
        set((state) => {
          if (state.favorites.some((f) => f.property.id === property.id)) return state;
          return {
            favorites: [{ property }, ...state.favorites],
            discarded: state.discarded.filter((d) => d.property.id !== property.id),
          };
        }),

      removeFavorite: (propertyId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.property.id !== propertyId),
        })),

      isFavorite: (propertyId) => get().favorites.some((f) => f.property.id === propertyId),

      toggleFavorite: (property) =>
        set((state) => {
          if (state.favorites.some((f) => f.property.id === property.id)) {
            return {
              favorites: state.favorites.filter((f) => f.property.id !== property.id),
            };
          }
          return {
            favorites: [{ property }, ...state.favorites],
            discarded: state.discarded.filter((d) => d.property.id !== property.id),
          };
        }),

      discard: (property) =>
        set((state) => {
          if (state.discarded.some((d) => d.property.id === property.id)) return state;
          return {
            discarded: [{ property }, ...state.discarded],
            favorites: state.favorites.filter((f) => f.property.id !== property.id),
          };
        }),

      removeDiscarded: (propertyId) =>
        set((state) => ({
          discarded: state.discarded.filter((d) => d.property.id !== propertyId),
        })),
    }),
    {
      name: 'propfind-favorites',
      partialize: (state) => ({
        favorites: state.favorites,
        discarded: state.discarded,
      }),
    }
  )
);
