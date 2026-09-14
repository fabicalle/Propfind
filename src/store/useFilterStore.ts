'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAnonymousSession } from '@/lib/persistence/anonSession';
import { saveFiltersLocally } from '@/lib/persistence/filterPersistence';
import type { FilterCriteria, SavedFilter } from '@/store/useAppStore';

interface FilterState {
  activeFilter: FilterCriteria;
  savedFilters: SavedFilter[];
}

interface FilterActions {
  setActiveFilter: (filter: FilterCriteria) => void;
  saveFilter: (filter: SavedFilter) => void;
  removeFilter: (id: string) => void;
}

export const useFilterStore = create<FilterState & FilterActions>()(
  persist(
    (set) => ({
      activeFilter: {},
      savedFilters: [],

      setActiveFilter: (filter) => {
        set({ activeFilter: filter });
        saveFiltersLocally(filter);
      },

      saveFilter: (filter) =>
        set((state) => ({
          savedFilters: [...state.savedFilters, filter],
        })),

      removeFilter: (id) =>
        set((state) => ({
          savedFilters: state.savedFilters.filter((f) => f.id !== id),
        })),
    }),
    {
      name: 'propfind-filters',
      partialize: (state) => ({
        activeFilter: state.activeFilter,
        savedFilters: state.savedFilters,
      }),
    }
  )
);
