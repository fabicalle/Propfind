'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { Heart, Undo2, Home, Search } from 'lucide-react';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useGuestSwipes } from '@/hooks/useGuestSwipes';
import { FavoriteCard } from '@/components/FavoriteCard';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/useSessionStore';

type Tab = 'saved' | 'discarded';

export default function FavoritesPage() {
  const router = useRouter();
  const { userSession } = useSessionStore();
  const [activeTab, setActiveTab] = useState<Tab>('saved');
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const { favorites, discarded, removeFavorite, removeDiscarded } = useFavoritesStore();
  const { likes, dislikes, removeSwipe } = useGuestSwipes();

  const savedProperties = favorites.map((f) => f.property);
  const discardedProperties = discarded.map((d) => d.property);

  const guestSaved = likes.map((s) => ({ id: s.propertyId, action: s.action as 'LIKE' | 'DISLIKE', timestamp: s.timestamp }));
  const guestDiscarded = dislikes.map((s) => ({ id: s.propertyId, action: s.action as 'LIKE' | 'DISLIKE', timestamp: s.timestamp }));

  useEffect(() => {
    let mounted = true;
    let isRedirecting = false;

    const waitForSession = async (supabase: ReturnType<typeof createSupabaseClient>, attempts = 3, delayMs = 250) => {
      for (let i = 0; i < attempts; i++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return session;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    };

    const verify = async () => {
      const supabase = createSupabaseClient();

      if (!supabase) {
        if (mounted) setIsGuest(true);
        return;
      }

      const session = await waitForSession(supabase);

      if (!session?.user && !userSession.userId) {
        if (mounted && !isRedirecting) {
          isRedirecting = true;
          router.push('/login');
        }
        return;
      }

      if (session?.user && !userSession.userId) {
        useSessionStore.getState().setUserSession({
          sessionId: userSession.sessionId,
          userId: session.user.id,
          isAuthenticated: true,
        });
      }

      if (mounted) {
        setIsGuest(!session?.user);
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [router, userSession.sessionId, userSession.userId]);

  const showGuest = isGuest === true;
  const showUser = isGuest === false;

  return (
    <div className="min-h-screen bg-app text-content-primary pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={motionTokens.spring.gentle}
        >
          <div className="flex items-center gap-3">
             <Heart className="h-8 w-8 text-content-primary" />
            <div>
              <h1 className="text-3xl font-bold">Mis Favoritos</h1>
               <p className="text-sm text-content-secondary">
                {showGuest
                  ? 'Estás navegando como invitado'
                  : showUser
                    ? `${savedProperties.length + discardedProperties.length} propiedades en tu lista`
                    : 'Cargando...'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
         <div className="mb-6 flex items-center gap-1 rounded-full border border-border-subtle bg-card p-1">
             <button
               onClick={() => setActiveTab('saved')}
               className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                 activeTab === 'saved'
                   ? 'bg-brand-olive text-white shadow-sm'
                   : 'text-content-secondary hover:text-content-primary'
               }`}
          >
            <Heart className="h-4 w-4" />
            Guardadas
            {(showGuest ? guestSaved.length : savedProperties.length) > 0 && (
               <span className={`rounded-full px-2 py-0.5 text-xs ${
                 activeTab === 'saved' ? 'bg-white/20 text-white' : 'bg-border-chip text-content-secondary'
               }`}>
                {showGuest ? guestSaved.length : savedProperties.length}
              </span>
            )}
          </button>
            <button
              onClick={() => setActiveTab('discarded')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === 'discarded'
                  ? 'bg-brand-olive text-white shadow-sm'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
          >
            <Undo2 className="h-4 w-4" />
            Descartadas
            {(showGuest ? guestDiscarded.length : discardedProperties.length) > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'discarded' ? 'bg-white/20 text-white' : 'bg-border-chip text-content-secondary'
              }`}>
                {showGuest ? guestDiscarded.length : discardedProperties.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'saved' && (
          <div>
            {(showGuest ? guestSaved.length : savedProperties.length) === 0 ? (
              <motion.div
                className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                 <Heart className="mx-auto mb-4 h-12 w-12 text-content-secondary" />
                <h3 className="mb-2 text-lg font-semibold text-content-primary">
                  Aún no has guardado ninguna propiedad
                </h3>
                <p className="mb-6 text-sm text-content-secondary">
                  Explorá el feed y dale Me Gusta a las que te interesen
                </p>
                 <button
                   onClick={() => router.push('/properties')}
                   className="inline-flex items-center gap-2 rounded-full bg-brand-olive px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-olive/80"
                 >
                   <Search className="h-4 w-4" />
                   Explorar propiedades
                 </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeTab === 'saved' &&
                  (showGuest
                    ? guestSaved.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ ...motionTokens.spring.gentle, delay: index * 0.05 }}
                        >
                        <FavoriteCard
                          property={{
                            id: entry.id,
                            title: `Propiedad ${entry.id.slice(0, 8)}`,
                            price: 0,
                            priceCurrency: 'USD',
                            neighborhood: '',
                            city: '',
                            lat: 0,
                            lng: 0,
                            images: [],
                            amenities: [],
                            rooms: null,
                            bedrooms: null,
                            bathrooms: null,
                            areaM2: null,
                            listingType: 'sale',
                            description: null,
                            address: null,
                            propertyType: null,
                            totalMonthlyCost: null,
                            sourceUrl: null,
                          }}
                           mode="favorite"
                           onDelete={() => removeSwipe(entry.id)}
                        />
                        </motion.div>
                      ))
                      : savedProperties.map((property, index) => (
                          <motion.div
                            key={property.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ ...motionTokens.spring.gentle, delay: index * 0.05 }}
                          >
                        <FavoriteCard
                          property={property}
                          mode="favorite"
                          onDelete={() => removeFavorite(property.id)}
                        />
                          </motion.div>
                        )))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discarded' && (
          <div>
            {(showGuest ? guestDiscarded.length : discardedProperties.length) === 0 ? (
              <motion.div
                className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Undo2 className="mx-auto mb-4 h-12 w-12 text-content-secondary" />
                <h3 className="mb-2 text-lg font-semibold text-content-primary">
                  No hay propiedades descartadas
                </h3>
                <p className="mb-6 text-sm text-content-secondary">
                  Las propiedades que descartes aparecerán aquí para que puedas recuperarlas
                </p>
                 <button
                   onClick={() => router.push('/properties')}
                   className="inline-flex items-center gap-2 rounded-full bg-brand-olive px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-olive/80"
                 >
                   <Home className="h-4 w-4" />
                   Ir al feed
                 </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeTab === 'discarded' &&
                  (showGuest
                    ? guestDiscarded.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ ...motionTokens.spring.gentle, delay: index * 0.05 }}
                        >
                        <FavoriteCard
                          property={{
                            id: entry.id,
                            title: `Propiedad ${entry.id.slice(0, 8)}`,
                            price: 0,
                            priceCurrency: 'USD',
                            neighborhood: '',
                            city: '',
                            lat: 0,
                            lng: 0,
                            images: [],
                            amenities: [],
                            rooms: null,
                            bedrooms: null,
                            bathrooms: null,
                            areaM2: null,
                            listingType: 'sale',
                            description: null,
                            address: null,
                            propertyType: null,
                            totalMonthlyCost: null,
                            sourceUrl: null,
                          }}
                           mode="discarded"
                           onDelete={() => removeSwipe(entry.id)}
                        />
                        </motion.div>
                      ))
                     : discardedProperties.map((property, index) => (
                         <motion.div
                           key={property.id}
                           initial={{ y: 20, opacity: 0 }}
                           animate={{ y: 0, opacity: 1 }}
                           transition={{ ...motionTokens.spring.gentle, delay: index * 0.05 }}
                         >
                       <FavoriteCard
                         property={property}
                         mode="discarded"
                         onDelete={() => removeDiscarded(property.id)}
                       />
                         </motion.div>
                       )))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
