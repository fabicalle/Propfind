'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { useProfileForm } from '@/hooks/useProfileForm';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialFirstName?: string;
  initialLastName?: string;
  initialPhone?: string;
  onSave?: (profile: ProfileData) => void;
  title?: string;
  subtitle?: string;
}

export function ProfileModal({
  isOpen,
  onClose,
  userId,
  initialFirstName,
  initialLastName,
  initialPhone,
  onSave,
  title = 'Mi Perfil',
  subtitle = 'Completá tus datos para que puedan contactarte',
}: ProfileModalProps) {
  const { firstName, lastName, phone, isSaving, error, setFirstName, setLastName, setPhone, handleSubmit } = useProfileForm({
    userId,
    initialFirstName,
    initialLastName,
    initialPhone,
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const saved = await handleSubmit();
    if (saved) {
      onSave?.(saved);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.normal }}
             className="absolute inset-0 bg-content-primary/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={motionTokens.spring.gentle}
            className="relative w-full max-w-md rounded-2xl border border-border-subtle/80 bg-card shadow-xl"
          >
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-content-primary">{title}</h3>
                <p className="text-xs text-content-secondary">{subtitle}</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-content-secondary">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-xl border border-border-subtle bg-card px-3 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-content-primary focus:ring-2 focus:ring-content-primary/10"
                      placeholder="Juan"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-content-secondary">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-xl border border-border-subtle bg-card px-3 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-content-primary focus:ring-2 focus:ring-content-primary/10"
                      placeholder="Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-content-secondary">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userId}
                    disabled
                    className="w-full rounded-xl border border-border-subtle bg-app px-3 py-2.5 text-sm text-content-secondary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-content-secondary">
                    Teléfono / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 261 123 4567"
                    className="w-full rounded-xl border border-border-subtle bg-card px-3 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-content-primary focus:ring-2 focus:ring-content-primary/10"
                  />
                  <p className="mt-1 text-xs text-content-secondary">Incluí el código de área y país</p>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-secondary transition-colors hover:bg-app"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSaving}
                     className="flex items-center justify-center gap-2 rounded-xl bg-brand-olive px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-olive/80 disabled:opacity-50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSaving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar cambios'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
