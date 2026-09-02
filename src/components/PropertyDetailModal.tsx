'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/store/useSessionStore';
import type { Property } from '@/store/useAppStore';
import { MapPin } from 'lucide-react';
import { usePropertyDetailSlider } from '@/hooks/usePropertyDetailSlider';
import { ContactModal } from '@/features/properties/components/ContactModal';

interface PropertyDetailModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const isAuthenticated = useSessionStore((state) => state.userSession.isAuthenticated);

  const { images, currentImageIndex, handlePrev, handleNext } = usePropertyDetailSlider(property);

  const handleContactClick = useCallback(() => {
    setIsContactModalOpen(true);
  }, []);

  const handleGoogleStreetView = useCallback(() => {
    if (!property.lat || !property.lng) return;
    const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.lat},${property.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [property.lat, property.lng]);

  const contact = property.contactInfo;
  const whatsappHref = contact?.whatsapp
    ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hola, me interesa "${property.title}". ¿Está disponible?`)}`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
           <div            className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
              className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-card border border-border-subtle text-content-primary shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="focus:ring-brand-terracotta/50 absolute right-4 top-4 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <button
              onClick={handleGoogleStreetView}
              aria-label="Explorar barrio y entorno en 360°"
              className="focus:ring-brand-terracotta/50 absolute right-16 top-4 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
            >
              <MapPin className="h-5 w-5" />
            </button>

            {/* Slider */}
            <div className="relative h-[320px] w-full sm:h-[400px]">
              {images.length > 0 ? (
                <>
                   <Image
                     src={images[currentImageIndex]}
                     alt={property.title}
                     fill
                     sizes="(max-width: 640px) 100vw, 800px"
                     className="object-cover"
                     priority
                   />

                   <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />

                   {images.length > 1 && (
                     <>
                        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-2">
                            <button
                              onClick={handlePrev}
                              aria-label="Imagen anterior"
                              className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
                            >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                            <button
                              onClick={handleNext}
                              aria-label="Imagen siguiente"
                              className="focus:ring-brand-terracotta/50 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40 p-2 text-white outline-none backdrop-blur-sm transition-all hover:scale-110 focus:ring-2 focus:outline-none"
                            >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={(e) => { e.stopPropagation(); handlePrev(e); }}
                              className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-3 bg-white/50'}`}
                            />
                          ))}
                        </div>
                     </>
                   )}

                   <div className="absolute bottom-4 right-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                     {currentImageIndex + 1} / {images.length}
                   </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-app">
                  <span className="text-content-secondary">No image available</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col overflow-y-auto p-6 text-content-primary">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-terracotta px-3 py-1 text-xs font-semibold text-white shadow">
                  {property.listingType === 'sale'
                    ? 'Venta'
                    : property.listingType === 'rent'
                      ? property.listingSubType === 'temporal'
                        ? 'Alquiler temporal'
                        : 'Alquiler'
                      : property.listingType}
                </span>
                {property.sellerType === 'OWNER' && (
                 <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/20">
                     Dueño directo
                   </span>
                )}
                {property.sellerType === 'AGENCY' && (
                 <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/20">
                     Inmobiliaria
                   </span>
                )}
               </div>

               <div className="mt-3">
                  <h2 className="text-3xl font-black tracking-tight text-brand-terracotta font-display">
                    ${property.price.toLocaleString()} {property.priceCurrency === 'ARS' ? 'ARS' : 'USD'}
                  </h2>
                 {property.listingType === 'rent' && (
                   <span className="text-sm text-content-secondary">/mo</span>
                 )}
               </div>

               <div className="mt-2 space-y-1">
                 <h3 className="text-lg font-semibold leading-snug line-clamp-2 text-content-primary font-display">{property.title}</h3>
                 <p className="text-sm text-content-secondary font-medium">
                   {property.neighborhood}
                   {property.city && `, ${property.city}`}
                 </p>
               </div>

               <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm font-medium">
                 {property.rooms && (
                    <div className="flex flex-col items-center gap-1 rounded-2xl bg-app px-2 py-2 shadow-sm border border-border-subtle text-content-primary">
                     <svg className="h-5 w-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                     </svg>
                      <span className="text-content-primary">{property.rooms} amb</span>
                   </div>
                 )}
                 {property.areaM2 && (
                    <div className="flex flex-col items-center gap-1 rounded-2xl bg-app px-2 py-2 shadow-sm border border-border-subtle text-content-primary">
                     <svg className="h-5 w-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                     </svg>
                      <span className="text-content-primary">{property.areaM2} m²</span>
                   </div>
                 )}
                 {property.bathrooms && (
                    <div className="flex flex-col items-center gap-1 rounded-2xl bg-app px-2 py-2 shadow-sm border border-border-subtle text-content-primary">
                     <svg className="h-5 w-5 text-content-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                     </svg>
                      <span className="text-content-primary">{property.bathrooms} baños</span>
                   </div>
                 )}
               </div>

               {(property.extendedFeatures?.length || property.amenities.length > 0) && (
                 <div className="mt-4">
                   <h4 className="text-sm font-semibold text-content-secondary">Características</h4>
                   <div className="mt-2 flex flex-wrap gap-2">
                     {(property.extendedFeatures?.length ? property.extendedFeatures : property.amenities).map((feature) => (
                        <span key={feature} className="rounded-full bg-border-chip text-content-primary text-xs font-medium px-3 py-1">
                         {feature}
                       </span>
                     ))}
                   </div>
                 </div>
               )}

               {property.description && (
                 <div className="space-y-2 pt-3 border-t border-border-subtle">
                   <h4 className="text-base font-semibold text-content-primary">Descripción</h4>
                    <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-line">
                     {property.description}
                   </p>
                 </div>
               )}

               <div className="mt-6">
                  <button
                    onClick={handleContactClick}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-olive px-3.5 font-bold hover:bg-brand-olive/90 py-3.5 shadow-sm text-white transition-all hover:scale-[1.01] active:scale-[0.99] focus:ring-brand-terracotta/50 focus:outline-none focus:ring-2 focus:scale-[1.01]"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Contactar al anunciante
                  </button>

                  <ContactModal
                    property={property}
                    isOpen={isContactModalOpen}
                    onClose={() => setIsContactModalOpen(false)}
                    isAuthenticated={isAuthenticated}
                    onLoginRedirect={() => {
                      window.location.href = '/login?redirect=/properties/' + property.id;
                    }}
                  />
               </div>
             </div>
           </motion.div>
         </motion.div>
       )}
     </AnimatePresence>
   );
}
