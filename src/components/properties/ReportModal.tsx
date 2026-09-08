'use client';

import { useActionState, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { reportPropertyAction } from '@/app/actions/property-actions';
import { X, Send } from 'lucide-react';

interface ReportModalProps {
  propertyId: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const REPORT_REASONS = [
  { value: 'INAPPROPRIATE_CONTENT', label: 'Contenido inapropiado' },
  { value: 'NOT_A_REAL_ESTATE', label: 'No es un inmueble real' },
  { value: 'SPAM_OR_FRAUD', label: 'Spam o fraude' },
  { value: 'OTHER', label: 'Otros' },
] as const;

export function ReportModal({ propertyId, isOpen, onClose }: ReportModalProps) {
  const [state, formAction, isPending] = useActionState(reportPropertyAction, undefined);

  const closeModal = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-card/10 bg-card p-6 shadow-xl"
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={motionTokens.spring.gentle}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-content-primary">Reportar esta propiedad</h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-card/60 hover:bg-card/10 hover:text-card"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-sm text-content-secondary">
              Tu reporte ayuda a mantener la plaza segura. Será revisado por nuestro equipo.
            </p>

            <button
              type="button"
              onClick={closeModal}
              className="mt-4 w-full rounded-lg border border-border-subtle bg-app px-4 py-2 text-sm font-medium text-content-secondary hover:text-brand-terracotta transition-colors"
            >
              Cerrar
            </button>

            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="propertyId" value={propertyId} />

              {state?.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400"
                >
                  {state.error}
                </motion.div>
              )}

              {state?.success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400"
                >
                  Reporte enviado. Gracias por ayudar.
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                  Motivo del reporte
                </label>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason.value}
                      className="flex items-center gap-3 rounded-lg border border-card/10 p-2 hover:bg-card/5"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        required
                        disabled={isPending}
                        className="accent-brand-terracotta"
                      />
                      <span className="text-sm text-content-primary">{reason.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">
                  Detalles adicionales (opcional)
                </label>
                <textarea
                  name="details"
                  placeholder="Cuéntanos más sobre este reporte..."
                  rows={3}
                  disabled={isPending}
                  className="w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta disabled:opacity-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-content-secondary mb-1">
                  Tu email (opcional, para seguimiento)
                </label>
                <input
                  type="email"
                  name="reporterEmail"
                  placeholder="tu@email.com"
                  disabled={isPending}
                  className="w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta disabled:opacity-50"
                />
              </div>

              <motion.button
                type="submit"
                disabled={isPending}
                whileTap={{ scale: 0.98 }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-terracotta px-4 py-2 text-sm font-semibold text-white hover:bg-brand-terracotta/90 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar reporte
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
