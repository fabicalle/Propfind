import { useState, useEffect, useRef, useCallback } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useGuestSwipes } from '@/hooks/useGuestSwipes';
import { useSessionStore } from '@/store/useSessionStore';
import { csrfFetch } from '@/lib/security/csrfClient';

interface User {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

interface UseUserMenuResult {
  user: User | null;
  isLoading: boolean;
  favoritesCount: number;
  handleLogin: () => void;
  handleLogout: () => void;
}

export function useUserMenu(onOpenProfile?: () => void): UseUserMenuResult {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { swipes, clear } = useGuestSwipes();

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let previousUser: User | null = null;

    supabase.auth.getSession().then(({ data: { session } }) => {
      previousUser = session?.user ?? null;
      setUser(previousUser);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);

      if (event === 'SIGNED_IN' && newUser && !previousUser && swipes.length > 0) {
        migrateGuestSwipes(newUser, swipes);
      }

      if (event === 'SIGNED_OUT') {
        useSessionStore.getState().clearUserSession();
      }

      previousUser = newUser;
    });

    return () => subscription.unsubscribe();
  }, [swipes]);

  const migrateGuestSwipes = async (newUser: User, guestSwipes: { propertyId: string; action: 'LIKE' | 'DISLIKE'; timestamp: number }[]) => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const likes = guestSwipes.filter((s) => s.action === 'LIKE');
      const dislikes = guestSwipes.filter((s) => s.action === 'DISLIKE');

      for (const swipe of [...likes, ...dislikes]) {
        await csrfFetch('/api/user/migrate-guest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            swipes: [swipe],
          }),
        });
      }

      clear();
    } catch {
    }
  };

  const handleLogin = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) return;

    const returnTo = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(returnTo)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) return;

    await supabase.auth.signOut();
    useSessionStore.getState().clearUserSession();
    router.push('/');
  }, [router]);

  return {
    user,
    isLoading,
    favoritesCount: 0,
    handleLogin,
    handleLogout,
  };
}
