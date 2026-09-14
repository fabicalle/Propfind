'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PropertyFormSeller } from '@/components/seller/PropertyFormSeller';

export default function FaseFormularioPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createSupabaseClient } = await import('@/lib/supabase/client');
        const supabase = createSupabaseClient();
        if (!supabase) {
          setUserId(null);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        setUserId(session?.user?.id || null);
      } catch {
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-content-primary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-brand-terracotta" />
      </div>
    );
  }

  if (!userId) {
    router.push('/publicar/fase-contacto');
    return null;
  }

  return (
    <PropertyFormSeller
      userId={userId}
      draft={{}}
      onSaveDraft={() => {}}
      onSuccess={() => {}}
    />
  );
}
