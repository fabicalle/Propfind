'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAnonymousSession } from '@/lib/persistence/anonSession';

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  isAuthenticated: boolean;
}

interface SessionState {
  userSession: UserSession;
  analyticsConsent: boolean;
}

interface SessionActions {
  setUserSession: (session: UserSession) => void;
  clearUserSession: () => void;
  setAnalyticsConsent: (consent: boolean) => void;
}

export const useSessionStore = create<SessionState & SessionActions>()(
  persist(
    (set) => ({
      userSession: {
        sessionId: typeof window !== 'undefined' ? getAnonymousSession() : generateSessionId(),
        isAuthenticated: false,
      },
      analyticsConsent: false,

      setUserSession: (session) => set({ userSession: session }),
      clearUserSession: () => set({ userSession: { sessionId: getAnonymousSession(), isAuthenticated: false } }),
      setAnalyticsConsent: (consent) => set({ analyticsConsent: consent }),
    }),
    {
      name: 'propfind-session',
      partialize: (state) => ({
        userSession: state.userSession,
        analyticsConsent: state.analyticsConsent,
      }),
    }
  )
);
