'use client';

import { create } from 'zustand';
import type { Property, SwipeDirection, UndoEntry } from '@/store/useAppStore';

interface SwipeState {
  currentProperty: Property | null;
  swipeQueue: Property[];
  discardedHistory: string[];
  undoStack: UndoEntry[];
}

interface SwipeActions {
  setCurrentProperty: (property: Property | null) => void;
  setSwipeQueue: (queue: Property[]) => void;
  enqueueProperties: (properties: Property[]) => void;
  swipe: (direction: SwipeDirection) => void;
  undo: () => void;
}

export const useSwipeStore = create<SwipeState & SwipeActions>((set, get) => ({
  currentProperty: null,
  swipeQueue: [],
  discardedHistory: [],
  undoStack: [],

  setCurrentProperty: (property) => set({ currentProperty: property }),

  setSwipeQueue: (queue) => set({ swipeQueue: queue }),

  enqueueProperties: (properties) =>
    set((state) => ({
      swipeQueue: [...state.swipeQueue, ...properties],
    })),

  swipe: (direction) => {
    const state = get();
    const current = state.currentProperty;
    if (!current) return;

    const entry: UndoEntry = {
      propertyId: current.id,
      property: current,
      interactionType:
        direction === 'right'
          ? 'SWIPE_RIGHT'
          : direction === 'up'
            ? 'SUPERLIKE'
            : 'SWIPE_LEFT',
      direction,
      timestamp: Date.now(),
    };

    const newQueue = [...state.swipeQueue];
    const next = newQueue.shift() || null;

    set({
      currentProperty: next,
      swipeQueue: newQueue,
      discardedHistory: [...state.discardedHistory, current.id],
      undoStack: [...state.undoStack.slice(-9), entry],
    });
  },

  undo: () => {
    const state = get();
    const lastEntry = state.undoStack[state.undoStack.length - 1];
    if (!lastEntry) return;

    const restored = lastEntry.property ? [lastEntry.property] : [];

    set({
      undoStack: state.undoStack.slice(0, -1),
      discardedHistory: state.discardedHistory.filter(
        (id) => id !== lastEntry.propertyId
      ),
      currentProperty: lastEntry.property,
      swipeQueue: [...restored, ...state.swipeQueue],
    });
  },
}));
