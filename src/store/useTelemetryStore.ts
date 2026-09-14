'use client';

import { create } from 'zustand';
import type { TelemetryEvent } from '@/store/useAppStore';

interface TelemetryState {
  pendingTelemetryEvents: TelemetryEvent[];
}

interface TelemetryActions {
  trackEvent: (event: TelemetryEvent) => void;
  flushTelemetry: () => TelemetryEvent[];
}

export const useTelemetryStore = create<TelemetryState & TelemetryActions>((set, get) => ({
  pendingTelemetryEvents: [],

  trackEvent: (event) =>
    set((state) => ({
      pendingTelemetryEvents: [...state.pendingTelemetryEvents, event],
    })),

  flushTelemetry: () => {
    const events = get().pendingTelemetryEvents;
    set({ pendingTelemetryEvents: [] });
    return events;
  },
}));
