'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PropertyDetail } from '@/components/PropertyDetail';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import type { Property } from '@/store/useAppStore';

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/properties/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error('Property not found');
          return res.json();
        })
        .then((result) => {
          setProperty(result.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    });
  }, [params]);

  if (loading) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-content-primary" />
          <span className="text-sm text-content-secondary">Cargando propiedad...</span>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="text-center">
          <p className="text-brand-clay">{error || 'Propiedad no encontrada'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-card border border-border-subtle px-4 py-2 text-sm text-content-primary hover:bg-app"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={motionTokens.spring.gentle}
    >
      <PropertyDetail property={property} />
    </motion.div>
  );
}
