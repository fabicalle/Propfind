'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/useSessionStore';
import { csrfFetch } from '@/lib/security/csrfClient';

type Tab = 'profile' | 'listings';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Property {
  id: string;
  title: string;
  price: number;
  neighborhood: string | null;
  city: string | null;
  images: { url: string }[];
  listingType: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { userSession } = useSessionStore();
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      if (!userSession.userId && session.user?.id) {
        useSessionStore.getState().setUserSession({
          sessionId: userSession.sessionId,
          userId: session.user.id,
          isAuthenticated: true,
        });
      }

      setAvatarUrl(
        (session.user?.user_metadata?.picture as string | undefined) ||
        (session.user?.user_metadata?.avatar_url as string | undefined) ||
        null
      );

      const res = await fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    } catch {
      // ignore
    }
  }, [userSession.sessionId, userSession.userId]);

  const loadProperties = useCallback(async () => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch('/api/user/properties', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        const items = result.data?.properties || result.properties || [];
        setProperties(items);
      } else {
        setError(result.error?.message || 'No se pudieron cargar tus publicaciones');
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let isRedirecting = false;

    const verify = async () => {
      const supabase = createSupabaseClient();

      if (!supabase) {
        if (mounted) {
          setAuthChecked(true);
          setLoading(false);
        }
        return;
      }

      const waitForSession = async (supabaseClient: NonNullable<ReturnType<typeof createSupabaseClient>>, attempts = 3, delayMs = 250) => {
        for (let i = 0; i < attempts; i++) {
          const { data: { session } } = await supabaseClient.auth.getSession();
          if (session?.user) return session;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
      };

      const session = await waitForSession(supabase);

      if (!session?.user && !userSession.userId) {
        if (mounted && !isRedirecting) {
          isRedirecting = true;
          setAuthChecked(true);
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
        setAuthChecked(true);
        setLoading(true);
        loadProfile();
        loadProperties();
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [router, loadProfile, loadProperties, userSession.sessionId, userSession.userId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Error de configuración: faltan variables de entorno');
        setSaving(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('No autorizado');
        setSaving(false);
        return;
      }

      const res = await csrfFetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.message || 'Error al guardar');
        setSaving(false);
        return;
      }

      setMessage('Cambios guardados correctamente');
      setSaving(false);
    } catch {
      setError('Error inesperado al guardar');
      setSaving(false);
    }
  };

  const handleDelete = async (propertyId: string) => {
    setDeletingId(propertyId);
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await csrfFetch(`/api/user/properties/${propertyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-app">
         <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" />
      </div>
    );
  }

  return (
     <div className="min-h-screen bg-app px-4 py-10 pt-24">
       <div className="mx-auto max-w-4xl">
         <motion.div
           initial={{ opacity: 0, y: 12 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ ...motionTokens.spring.gentle }}
           className="rounded-3xl border border-border-subtle bg-card shadow-md"
        >
          <div className="flex items-center gap-1 p-2">
            <button
              onClick={() => setTab('profile')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === 'profile'
                   ? 'bg-brand-olive text-white'
                   : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Información Personal
            </button>
            <button
              onClick={() => setTab('listings')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === 'listings'
                   ? 'bg-brand-olive text-white'
                   : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              Mis Publicaciones
            </button>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            )}

            <AnimatePresence mode="wait">
              {tab === 'profile' && (
                <motion.form
                  key="profile"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleSaveProfile}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                     <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border-subtle bg-app">
                      {avatarUrl || avatarFile ? (
                        <img
                          src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl!}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                         <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-content-primary">
                          {profile.firstName?.[0] || profile.email[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                       <p className="text-sm font-medium text-content-primary">Foto de perfil</p>
                       <p className="text-xs text-content-secondary">Podés cambiar tu foto cuando quieras.</p>
                       <label className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-card px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-app">
                        Cambiar foto
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setAvatarFile(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                     <label className="mb-2 block text-sm font-medium text-content-primary">Nombre</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile((prev) => ({ ...prev, firstName: e.target.value }))}
                       className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
                    />
                  </div>

                  <div>
                     <label className="mb-2 block text-sm font-medium text-content-primary">Apellido</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile((prev) => ({ ...prev, lastName: e.target.value }))}
                       className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
                    />
                  </div>

                  <div>
                     <label className="mb-2 block text-sm font-medium text-content-primary">Correo Electrónico</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                       className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-secondary"
                    />
                  </div>

                  <div>
                     <label className="mb-2 block text-sm font-medium text-content-primary">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+54 9 261 123 4567"
                      className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileTap={{ scale: 0.98 }}
                     className="flex items-center justify-center gap-2 rounded-xl bg-brand-olive px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-olive/90 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Guardar Cambios'
                    )}
                  </motion.button>
                </motion.form>
              )}

              {tab === 'listings' && (
                <motion.div
                  key="listings"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {properties.length === 0 ? (
                    <div className="py-12 text-center">
                       <p className="text-sm text-content-secondary">Aún no has publicado ninguna propiedad.</p>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/publicar')}
                         className="mt-4 rounded-xl bg-brand-terracotta px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-terracotta/80"
                      >
                        Publicar una propiedad
                      </motion.button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {properties.map((property) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                           className="rounded-2xl border border-border-subtle bg-card shadow-sm"
                        >
                           <div className="relative h-48 w-full overflow-hidden rounded-t-2xl bg-app">
                            {property.images?.[0] && (
                              <img
                                src={property.images[0].url}
                                alt={property.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-4">
                             <h3 className="text-sm font-semibold text-content-primary line-clamp-2">{property.title}</h3>
                             <p className="mt-1 text-lg font-bold text-brand-terracotta">
                              ${property.price.toLocaleString()}
                              {property.listingType === 'rent' && (
                                 <span className="text-xs text-content-secondary">/mo</span>
                              )}
                            </p>
                             <p className="text-xs text-content-secondary">
                              {property.neighborhood}
                              {property.city && `, ${property.city}`}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push(`/publicar?edit=${property.id}`)}
                                 className="flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-app"
                              >
                                ✏️ Editar
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDeleteConfirmId(property.id)}
                                 className="flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-brand-clay transition-colors hover:bg-brand-clay/10"
                              >
                                🗑️ Eliminar
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {deleteConfirmId && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                     onClick={() => {
                       setDeleteConfirmId(null);
                       setDeleteConfirmText('');
                     }}
                     className="rounded-lg border border-border-subtle bg-card px-4 py-2 text-xs font-medium text-content-primary transition-colors hover:bg-app"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (deleteConfirmText !== 'ELIMINAR') return;
                      await handleDelete(deleteConfirmId);
                      setDeleteConfirmId(null);
                      setDeleteConfirmText('');
                    }}
                     disabled={deleteConfirmText !== 'ELIMINAR'}
                     className="rounded-lg bg-brand-clay px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-clay/90 disabled:opacity-50"
                  >
                    Confirmar eliminación
                  </button>
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Escribí ELIMINAR para confirmar"
                     className="w-full rounded-lg border border-border-subtle bg-card px-3 py-2 text-xs text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
