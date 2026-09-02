'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import type { FilterCriteria } from '@/store/useAppStore';
import { useFilterPanel } from '@/hooks/useFilterPanel';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filter: FilterCriteria;
  onFilterChange: (filter: FilterCriteria) => void;
  onApply: () => void;
  locationQuery?: string;
}

const OPERATION_OPTIONS = [
  { label: 'Alquiler', value: 'rent' },
  { label: 'Venta', value: 'sale' },
  { label: 'Temporal', value: 'temporal' },
] as const;

const SELLER_TYPE_OPTIONS = [
  { label: 'Dueño directo', value: 'OWNER' },
  { label: 'Inmobiliaria', value: 'AGENCY' },
] as const;

const PROPERTY_TYPES = [
  'Departamento',
  'Casa',
  'PH',
  'Lote',
];

const CURRENCY_OPTIONS = [
  { label: 'Indistinto', value: 'any' },
  { label: 'Pesos', value: 'ARS' },
  { label: 'Dólares', value: 'USD' },
] as const;

const ROOMS_OPTIONS = [1, 2, 3, 4];
const BEDROOMS_OPTIONS = [1, 2, 3];
const PARKING_OPTIONS = [
  { label: 'Cualquiera', value: 'any' },
  { label: '1+', value: '1+' },
  { label: '2+', value: '2+' },
] as const;

const AMENITY_OPTIONS = [
  'Acepta Mascotas',
  'Balcón / Patio',
  'Parrilla',
  'Piscina',
  'Seguridad 24hs',
];

export function FilterPanel({ isOpen, onClose, filter, onFilterChange, onApply, locationQuery }: FilterPanelProps) {
  const { toggleArray, toggleBoolean, handleClear, activeCount } = useFilterPanel(filter, onFilterChange, onClose);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-content-primary/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-border-subtle bg-app shadow-xl md:inset-x-auto md:left-1/2 md:top-1/2 md:h-[620px] md:w-[420px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex flex-col">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-app px-5 py-4">
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-content-primary">Refinar Búsqueda</h2>
                  {locationQuery ? (
                    <span className="text-xs text-content-secondary">📍 {locationQuery}</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                   <button
                     onClick={handleClear}
                     className="rounded-lg bg-content-secondary/10 px-3 py-1.5 text-xs font-semibold text-content-secondary transition-colors hover:bg-content-secondary/20 hover:text-content-primary"
                   >
                     Limpiar filtros
                   </button>
                  <motion.button
                    onClick={onClose}
                    className="rounded-full p-1 text-content-secondary transition-colors hover:bg-app hover:text-content-primary"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              <div className="space-y-6 px-5 py-5">
                {/* Bloque 1 - Operación y Tipo */}
                <section className="space-y-3">
                  <div>
                     <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">Operación</p>
                     <div className="flex flex-wrap gap-2">
                       {OPERATION_OPTIONS.map((option) => {
                         const isActive =
                           option.value === 'temporal'
                             ? filter.listingSubType === 'temporal'
                             : filter.listingType === option.value;
                         return (
                           <motion.button
                             key={option.label}
                             onClick={() => {
                               if (option.value === 'temporal') {
                                 onFilterChange({
                                   ...filter,
                                   listingSubType: filter.listingSubType === 'temporal' ? undefined : 'temporal',
                                   listingType: filter.listingType === 'rent' ? undefined : filter.listingType,
                                 });
                                 return;
                               }
                               onFilterChange({
                                 ...filter,
                                 listingType: filter.listingType === option.value ? undefined : option.value,
                                 listingSubType: filter.listingSubType === 'temporal' ? undefined : filter.listingSubType,
                               });
                             }}
                             className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                               isActive
                                  ? 'border-content-primary bg-brand-olive text-white'
                                 : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                             }`}
                             whileTap={{ scale: 0.97 }}
                           >
                            {option.label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                     <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">Tipo de inmueble</p>
                     <div className="flex flex-wrap gap-2">
                       {PROPERTY_TYPES.map((type) => {
                         const isActive = filter.propertyTypes?.includes(type);
                         return (
                           <motion.button
                             key={type}
                             onClick={() => toggleArray('propertyTypes', type)}
                             className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                               isActive
                                  ? 'border-content-primary bg-brand-olive text-white'
                                 : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                             }`}
                             whileTap={{ scale: 0.97 }}
                           >
                            {type}
                          </motion.button>
                        );
                      })}
                    </div>
                   </div>
                 </section>

                 {/* Bloque 1.5 - Tipo de vendedor */}
                 <section className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">Tipo de vendedor</p>
                    <div className="flex flex-wrap gap-2">
                      {SELLER_TYPE_OPTIONS.map((option) => {
                        const isActive = filter.sellerType === option.value;
                        return (
                          <motion.button
                            key={option.value}
                            onClick={() => onFilterChange({ ...filter, sellerType: filter.sellerType === option.value ? undefined : option.value })}
                            className={`rounded-full border px-4 py-1.5 text-sm transition-all ${
                              isActive
                                 ? 'border-content-primary bg-brand-olive text-white'
                                : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                            }`}
                            whileTap={{ scale: 0.97 }}
                          >
                           {option.label}
                         </motion.button>
                       );
                     })}
                   </div>
                 </section>

                 {/* Bloque 2 - Rango Financiero */}
                <section className="space-y-3">
                   <div className="flex items-center justify-between">
                     <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">Moneda</p>
                      <div className="flex rounded-full border border-border-subtle bg-card p-1">
                        {CURRENCY_OPTIONS.map((option) => {
                          const isActive = filter.currency === option.value || (option.value === 'any' && !filter.currency);
                          return (
                            <button
                              key={option.value}
                              onClick={() => onFilterChange({ ...filter, currency: option.value === 'any' ? undefined : option.value })}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                                isActive ? 'bg-brand-olive text-white' : 'text-content-secondary hover:text-content-primary'
                              }`}
                            >
                             {option.label}
                           </button>
                          );
                        })}
                      </div>
                   </div>

                   <div>
                     <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                       {filter.currency === 'USD' ? 'USD' : filter.currency === 'ARS' ? 'ARS' : 'Precio'}
                     </p>
                     <div className="flex gap-2">
                       <input
                         type="number"
                         placeholder={filter.currency === 'USD' ? 'USD Desde' : filter.currency === 'ARS' ? 'ARS Desde' : 'Mínimo'}
                         value={filter.priceMin ?? ''}
                         onChange={(e) =>
                           onFilterChange({
                             ...filter,
                             priceMin: e.target.value ? Number(e.target.value) : undefined,
                           })
                         }
                         className="w-full rounded-xl border border-border-subtle bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary focus:border-content-primary focus:ring-2 focus:ring-content-primary/10"
                       />
                       <input
                         type="number"
                         placeholder={filter.currency === 'USD' ? 'USD Hasta' : filter.currency === 'ARS' ? 'ARS Hasta' : 'Máximo'}
                         value={filter.priceMax ?? ''}
                         onChange={(e) =>
                           onFilterChange({
                             ...filter,
                             priceMax: e.target.value ? Number(e.target.value) : undefined,
                           })
                         }
                         className="w-full rounded-xl border border-border-subtle bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary focus:border-content-primary focus:ring-2 focus:ring-content-primary/10"
                       />
                     </div>
                   </div>

                  <label className="flex items-center justify-between rounded-2xl border border-border-subtle bg-app px-4 py-3">
                    <span className="text-sm text-content-primary">Solo Apto Crédito</span>
                    <button
                      type="button"
                      onClick={() => toggleBoolean('creditApproved', true)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        filter.creditApproved ? 'bg-content-primary' : 'bg-border-subtle'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          filter.creditApproved ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>
                </section>

                {/* Bloque 3 - Distribución */}
                <section className="space-y-3">
                  <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">Ambientes</p>
                     <div className="flex flex-wrap gap-2">
                       {ROOMS_OPTIONS.map((num) => {
                         const isActive = filter.rooms?.includes(num);
                         return (
                           <motion.button
                             key={num}
                             onClick={() => toggleArray('rooms', num)}
                             className={`h-10 min-w-[3rem] rounded-full border px-3 text-sm transition-all ${
                               isActive
                                  ? 'border-content-primary bg-brand-olive text-white'
                                 : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                             }`}
                             whileTap={{ scale: 0.97 }}
                           >
                            {num}
                          </motion.button>
                        );
                      })}
                      <motion.button
                        onClick={() => toggleArray('rooms', 4)}
                         className={`h-10 rounded-full border px-3 text-sm transition-all ${
                           filter.rooms?.includes(4)
                              ? 'border-content-primary bg-brand-olive text-white'
                              : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                         }`}
                        whileTap={{ scale: 0.97 }}
                      >
                        4+
                      </motion.button>
                    </div>
                  </div>

                  <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">Dormitorios</p>
                     <div className="flex flex-wrap gap-2">
                       {BEDROOMS_OPTIONS.map((num) => {
                         const isActive = filter.bedrooms?.includes(num);
                         return (
                           <motion.button
                             key={num}
                             onClick={() => toggleArray('bedrooms', num)}
                             className={`h-10 min-w-[3rem] rounded-full border px-3 text-sm transition-all ${
                               isActive
                                  ? 'border-content-primary bg-brand-olive text-white'
                                 : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                             }`}
                             whileTap={{ scale: 0.97 }}
                           >
                            {num}
                          </motion.button>
                        );
                      })}
                      <motion.button
                        onClick={() => toggleArray('bedrooms', 4)}
                         className={`h-10 rounded-full border px-3 text-sm transition-all ${
                           filter.bedrooms?.includes(4)
                              ? 'border-content-primary bg-brand-olive text-white'
                              : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                         }`}
                        whileTap={{ scale: 0.97 }}
                      >
                        3+
                      </motion.button>
                    </div>
                  </div>

                  <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">Cocheras</p>
                     <div className="flex flex-wrap gap-2">
                       {PARKING_OPTIONS.map((option) => (
                         <motion.button
                           key={option.value}
                           onClick={() => onFilterChange({ ...filter, parking: filter.parking === option.value ? undefined : option.value })}
                           className={`h-10 rounded-full border px-4 text-sm transition-all ${
                             filter.parking === option.value
                                ? 'border-content-primary bg-brand-olive text-white'
                                : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                           }`}
                           whileTap={{ scale: 0.97 }}
                         >
                          {option.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Bloque 4 - Amenities */}
                 <section className="space-y-3">
                   <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">Amenities</p>
                   <div className="flex flex-wrap gap-2">
                     {AMENITY_OPTIONS.map((amenity) => {
                       const normalized = amenity.toLowerCase();
                       const isActive = filter.amenities?.some((a) => a.toLowerCase() === normalized);
                       return (
                         <motion.button
                           key={amenity}
                           onClick={() => toggleArray('amenities', amenity)}
                           className={`rounded-2xl border px-4 py-2 text-sm transition-all ${
                             isActive
                                ? 'border-content-primary bg-brand-olive text-white shadow-sm'
                                : 'border-border-subtle bg-card text-content-secondary hover:border-content-primary/40'
                           }`}
                           whileTap={{ scale: 0.97 }}
                         >
                          {amenity}
                        </motion.button>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Footer Sticky */}
              <div className="sticky bottom-0 border-t border-border-subtle bg-app px-5 py-4">
                <motion.button
                  onClick={onApply}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-terracotta py-3 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-[0.98]"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Aplicar Filtros
                  {activeCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                      {activeCount}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
