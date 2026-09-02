import { useState, useCallback, useEffect } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useProfileModal } from '@/store/useProfileModal';

interface SellerContact {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface UseContactButtonOptions {
  propertyTitle: string;
  propertyId: string;
}

export function useContactButton({ propertyTitle, propertyId }: UseContactButtonOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [seller, setSeller] = useState<SellerContact>({});
  const [isLoadingSeller, setIsLoadingSeller] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const openProfileModal = useProfileModal((state) => state.open);

  const loadSession = useCallback(async () => {
    const supabase = createSupabaseClient();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session?.user) {
      setUserId(session.user.id);
    }
    return session;
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const fetchSellerContact = useCallback(async () => {
    setIsLoadingSeller(true);
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      let phone = (user.user_metadata as Record<string, unknown> | null)?.phone as string | null;
      const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || null;

      if (!phone && session?.access_token) {
        try {
          const res = await fetch('/api/user/me', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            phone = data.data?.phone || null;
          }
        } catch {
          // ignore profile fetch error
        }
      }

      setSeller({
        name: name || 'Vendedor',
        email: user.email || null,
        phone: phone || null,
      });
    } catch {
      setSeller({ name: 'Vendedor', email: null, phone: null });
    } finally {
      setIsLoadingSeller(false);
    }
  }, []);

  const handleContactClick = useCallback(async () => {
    setIsLoading(true);

    try {
      const session = await loadSession();

      if (!session) {
        const supabase = createSupabaseClient();
        if (!supabase) {
          setIsLoading(false);
          return;
        }
        const returnTo = window.location.pathname + window.location.search;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(returnTo)}`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          setIsLoading(false);
        }
        return;
      }

      const supabase = createSupabaseClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { session: freshSession } } = await supabase.auth.getSession();
      const user = freshSession?.user;
      if (!user) {
        setIsLoading(false);
        return;
      }

      let phone = (user.user_metadata as Record<string, unknown> | null)?.phone as string | null;

      if (!phone && freshSession?.access_token) {
        try {
          const res = await fetch('/api/user/me', {
            headers: { Authorization: `Bearer ${freshSession.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            phone = data.data?.phone || null;
          }
        } catch {
          // ignore
        }
      }

      if (!phone) {
        const currentUserId = user.id || userId;
        if (currentUserId) {
          openProfileModal(
            currentUserId,
            'Completá tu número de WhatsApp para que la inmobiliaria/vendedor pueda ponerse en contacto contigo'
          );
        }
        setIsLoading(false);
        return;
      }

      await fetchSellerContact();
      setShowContactModal(true);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  }, [loadSession, fetchSellerContact, openProfileModal, userId, propertyTitle, propertyId]);

  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
  }, []);

  const defaultMessage = encodeURIComponent(`Hola, me interesa "${propertyTitle}". ¿Está disponible?`);
  const whatsappHref = seller.phone
    ? `https://wa.me/${seller.phone}?text=${defaultMessage}`
    : null;

  return {
    isLoading,
    isAuthenticated,
    showContactModal,
    seller,
    isLoadingSeller,
    whatsappHref,
    defaultMessage,
    handleContactClick,
    closeContactModal,
  };
}
