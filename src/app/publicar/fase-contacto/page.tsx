'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SellerAuthGate } from '@/components/seller/SellerAuthGate';

export default function FaseContactoPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" />
      </div>
    );
  }

  if (userId) {
    router.push('/publicar');
    return null;
  }

  return <SellerAuthGate onSuccess={() => router.push('/publicar')} />;
}
