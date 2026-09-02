'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useFilterStore } from '@/store/useFilterStore';
import { motionTokens } from '@/lib/motion/tokens';
import { MainSearchBar } from '@/features/search/components/MainSearchBar';

const QUICK_FILTERS = [
  { label: 'Alquiler', value: 'rent' },
  { label: 'Venta', value: 'sale' },
];

export default function HomePage() {
  const router = useRouter();
  const setActiveFilter = useFilterStore((state) => state.setActiveFilter);

  const handleQuickFilter = useCallback((filter: typeof QUICK_FILTERS[0]) => {
    setActiveFilter({
      listingType: filter.value as 'rent' | 'sale',
    });
    router.push('/propiedades');
  }, [setActiveFilter, router]);

  return (
    <div className="relative min-h-screen bg-app text-content-primary">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,--theme(--color-brand-terracotta/0.08),transparent_40%),radial-gradient(circle_at_bottom_left,--theme(--color-brand-olive/0.06),transparent_40%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Hero Section */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={motionTokens.spring.gentle}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-app px-4 py-1.5 text-xs font-semibold text-content-primary shadow-sm">
            <span className="h-2 w-2 rounded-full bg-brand-olive animate-pulse-subtle" />
            Búsqueda inteligente de propiedades
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-content-primary font-display md:text-6xl">
            Encontrá tu próxima propiedad
          </h1>
          <p className="mt-4 text-lg text-content-secondary">
            Buscá entre miles de propiedades en Argentina con filtros simples y resultados actualizados.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className="mt-10 flex justify-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.2 }}
        >
          <MainSearchBar />
        </motion.div>

        {/* Quick Filter Chips */}
        <motion.div
          className="mt-6 flex flex-wrap justify-center gap-2"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.3 }}
        >
          {QUICK_FILTERS.map((filter) => (
            <motion.button
              key={filter.label}
              onClick={() => handleQuickFilter(filter)}
              aria-label={`Filtrar por ${filter.label}`}
              className="focus:ring-brand-terracotta/50 rounded-full border border-border-subtle bg-app px-4 py-2 text-sm font-semibold text-content-primary shadow-sm outline-none transition-all hover:border-brand-terracotta/40 hover:text-brand-terracotta active:scale-95 focus:ring-2 focus:outline-none"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filter.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...motionTokens.spring.gentle, delay: 0.4 }}
        >
          <div className="rounded-2xl border border-border-subtle bg-app p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <div className="text-5xl font-semibold text-content-primary">1.2k+</div>
            <div className="mt-1 text-sm text-content-secondary">Propiedades</div>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-app p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <div className="text-5xl font-semibold text-content-primary">850+</div>
            <div className="mt-1 text-sm text-content-secondary">Inmobiliarias</div>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-app p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
            <div className="text-5xl font-semibold text-content-primary">15k+</div>
            <div className="mt-1 text-sm text-content-secondary">Usuarios</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
