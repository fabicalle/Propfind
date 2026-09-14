'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { SellerStepper } from '@/components/seller/SellerStepper';
import { SellerAuthGate } from '@/components/seller/SellerAuthGate';
import { SellerContactForm } from '@/components/seller/SellerContactForm';
import { PropertyFormSeller } from '@/components/seller/PropertyFormSeller';
import { createSupabaseClient } from '@/lib/supabase/client';

type Phase = 'contact' | 'form';

interface SellerDraft {
  contact?: {
    nombreCompleto: string;
    telefono: string;
    email: string;
  };
  property?: Record<string, unknown>;
}

const DRAFT_KEY = 'propfind_seller_draft';

export default function PublicarPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('contact');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<SellerDraft>({});
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const memoizedDraft = useMemo(() => draft, [draft.contact?.nombreCompleto, draft.contact?.telefono, draft.contact?.email, JSON.stringify(draft.property)]);

  useEffect(() => {
    const init = async () => {
      try {
        const urlError = new URLSearchParams(window.location.search).get('error');
        if (urlError) {
          setError(urlError);
        }

        const editId = new URLSearchParams(window.location.search).get('edit');
        if (editId) {
          setEditingPropertyId(editId);
          const res = await fetch(`/api/properties/${editId}`);
          if (res.ok) {
            const result = await res.json();
            setDraft((prev) => ({
              ...prev,
              property: result.data || result,
            }));
          }
        }

        const supabase = createSupabaseClient();
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        const id = session?.user?.id || null;
        setUserId(id);

        const stored = localStorage.getItem(DRAFT_KEY);
        if (stored) {
          try {
            setDraft(JSON.parse(stored));
          } catch {
            // ignore parse errors
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event: string, session: { user: { id: string } | null } | null) => {
            const userId = session?.user?.id || null;
            setUserId(userId);
            if (userId) {
              setError(null);
              advanceToForm();
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const saveDraft = (partial: SellerDraft) => {
    setDraft((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  };

  const advanceToForm = () => {
    setPhase('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-content-primary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app px-4 py-8 pt-24">
      <div className="mx-auto max-w-3xl">
        <SellerStepper currentPhase={phase} />

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            Hubo un problema con la autenticación. Podés intentar de nuevo.
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.15 }}
          className="mt-8"
        >
          {phase === 'contact' && (
            <>
              {!userId ? (
                <SellerAuthGate onSuccess={advanceToForm} />
              ) : (
                <SellerContactForm
                  initialData={draft.contact}
                  onSave={(contact) => {
                    saveDraft({ contact });
                    advanceToForm();
                  }}
                />
              )}
            </>
          )}

          {phase === 'form' && userId && (
            <PropertyFormSeller
              userId={userId}
              draft={memoizedDraft}
              onSaveDraft={saveDraft}
              propertyId={editingPropertyId}
              onSuccess={() => {
                localStorage.removeItem(DRAFT_KEY);
                router.push(editingPropertyId ? '/perfil' : '/properties');
              }}
              onCancel={() => {
                localStorage.removeItem(DRAFT_KEY);
                router.push(editingPropertyId ? '/perfil' : '/properties');
              }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
