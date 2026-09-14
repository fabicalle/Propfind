'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/useSessionStore';
import { csrfFetch } from '@/lib/security/csrfClient';

type Tab = 'profile' | 'listings' | 'messages';

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

interface Message {
  id: string;
  propertyId: string;
  propertyTitle: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  message: string;
  status: string;
  read: boolean;
  createdAt: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagePage, setMessagePage] = useState(1);
  const [messagePagination, setMessagePagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [messageDeleteIds, setMessageDeleteIds] = useState<string[] | null>(null);
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

  const loadMessages = useCallback(async (page = 1) => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const res = await fetch(`/api/user/messages?page=${page}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const result = await res.json().catch(() => ({}));

      if (res.ok) {
        const items = result.data?.messages || result.messages || [];
        setMessages(items);
        setMessagePagination(result.data?.pagination || null);
        setMessagePage(page);
      }
    } catch {
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
        loadMessages(1);
      }
    };

    verify();

    return () => {
      mounted = false;
    };
  }, [router, loadProfile, loadProperties, loadMessages, userSession.sessionId, userSession.userId]);

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

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch(`/api/user/messages/${messageId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, read: true } : m));
    } catch {
      // ignore
    }
  };

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const toggleSelectAllMessages = () => {
    setSelectedMessageIds((prev) => {
      if (prev.size === messages.length) {
        return new Set();
      }
      return new Set(messages.map((m) => m.id));
    });
  };

  const handleDeleteSelectedMessages = async () => {
    if (!messageDeleteIds || messageDeleteIds.length === 0) return;
    try {
      const supabase = createSupabaseClient();
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await Promise.all(
        messageDeleteIds.map((id) =>
          fetch(`/api/user/messages/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session.access_token}` },
          })
        )
      );

      setMessages((prev) => prev.filter((m) => !messageDeleteIds.includes(m.id)));
      setSelectedMessageIds(new Set());
      setMessageDeleteIds(null);
    } catch {
      // ignore
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
             <button
               onClick={() => setTab('messages')}
               className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                 tab === 'messages'
                    ? 'bg-brand-olive text-white'
                    : 'text-content-secondary hover:text-content-primary'
               }`}
             >
               Mensajes
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
                                onClick={() => setDeletePropertyId(property.id)}
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

{tab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  {messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-content-secondary">
                      Todavía no recibiste mensajes por tus publicaciones.
                    </p>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center justify-between rounded-2xl border border-border-subtle bg-card p-3 shadow-sm">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-content-primary">
                          <input
                            type="checkbox"
                            checked={selectedMessageIds.size === messages.length && messages.length > 0}
                            onChange={toggleSelectAllMessages}
                            className="h-4 w-4 cursor-pointer rounded border-border-subtle text-brand-terracotta focus:ring-brand-terracotta"
                          />
                          <span className="font-medium">Seleccionar todos</span>
                        </label>
                        {selectedMessageIds.size > 0 && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setMessageDeleteIds(Array.from(selectedMessageIds))}
                            className="rounded-lg border border-red-200 bg-card px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Eliminar seleccionados ({selectedMessageIds.size})
                          </motion.button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`rounded-2xl border p-4 shadow-sm ${
                              msg.read
                                ? 'border-border-subtle bg-card'
                                : 'border-brand-terracotta/30 bg-brand-terracotta/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedMessageIds.has(msg.id)}
                                onChange={() => toggleMessageSelection(msg.id)}
                                className="mt-1 h-4 w-4 cursor-pointer rounded border-border-subtle text-brand-terracotta focus:ring-brand-terracotta"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-content-primary">
                                    {msg.senderName}
                                  </p>
                                  {!msg.read && (
                                    <span className="rounded-full bg-brand-terracotta px-2 py-0.5 text-xs font-semibold text-white">
                                      Nuevo
                                    </span>
                                  )}
                                  <span className="text-xs text-content-secondary">consultó por</span>
                                  <span className="text-sm font-medium text-content-primary">{msg.propertyTitle}</span>
                                </div>
                                <p className="mt-1 text-sm text-content-secondary">{msg.message}</p>
                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-content-secondary">
                                  <span>📧 {msg.senderEmail}</span>
                                  {msg.senderPhone && <span>📞 {msg.senderPhone}</span>}
                                </div>
                              </div>
                              <div className="ml-4 flex flex-col items-end gap-2">
                                <span className="text-xs text-content-secondary">{new Date(msg.createdAt).toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                  {!msg.read && (
                                    <motion.button
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleMarkAsRead(msg.id)}
                                      className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-medium text-content-primary transition-colors hover:bg-app"
                                    >
                                      Marcar leído
                                    </motion.button>
                                  )}
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setMessageDeleteIds([msg.id])}
                                    className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                  >
                                    Eliminar
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {messagePagination && messagePagination.totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-between">
                          <button
                            disabled={messagePage <= 1}
                            onClick={() => loadMessages(messagePage - 1)}
                            className="rounded-xl border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-app disabled:opacity-50"
                          >
                            Anterior
                          </button>
                          <span className="text-sm text-content-secondary">
                            Página {messagePage} de {messagePagination.totalPages}
                          </span>
                          <button
                            disabled={messagePage >= messagePagination.totalPages}
                            onClick={() => loadMessages(messagePage + 1)}
                            className="rounded-xl border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-app disabled:opacity-50"
                          >
                            Siguiente
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {messageDeleteIds && messageDeleteIds.length > 0 && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-sm rounded-2xl border border-border-subtle bg-card p-6 shadow-md"
                >
                  <h3 className="text-base font-semibold text-content-primary">Confirmar eliminación</h3>
                  <p className="mt-2 text-sm text-content-secondary">
                    {messageDeleteIds.length === 1
                      ? '¿Estás seguro que querés eliminar este mensaje? Esta acción no se puede deshacer.'
                      : `¿Estás seguro que querés eliminar ${messageDeleteIds.length} mensajes? Esta acción no se puede deshacer.`}
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={() => setMessageDeleteIds(null)}
                      className="rounded-xl border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-app"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDeleteSelectedMessages}
                      className="rounded-xl bg-brand-clay px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-clay/90"
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
            {deletePropertyId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-sm rounded-2xl border border-border-subtle bg-card p-6 shadow-md"
                >
                  <h3 className="text-base font-semibold text-content-primary">Confirmar eliminación</h3>
                  <p className="mt-2 text-sm text-content-secondary">
                    ¿Estás seguro de que querés eliminar esta publicación? Esta acción no se puede deshacer.
                  </p>
                  <div className="mt-5 flex justify-end gap-2">
                    <button
                      onClick={() => setDeletePropertyId(null)}
                      className="rounded-xl border border-border-subtle bg-card px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-app"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        const id = deletePropertyId;
                        setDeletePropertyId(null);
                        await handleDelete(id);
                      }}
                      className="rounded-xl bg-brand-clay px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-clay/90"
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
           </div>
        </motion.div>
      </div>
    </div>
  );
}
