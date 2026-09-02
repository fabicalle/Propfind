'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';

interface SellerContactFormProps {
  initialData?: {
    nombreCompleto: string;
    telefono: string;
    email: string;
  };
  onSave: (contact: { nombreCompleto: string; telefono: string; email: string }) => void;
}

  const fieldClasses = {
    base: 'w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200',
    focus: 'focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta',
    error: 'border border-brand-clay focus:ring-brand-clay focus:shadow-[0_0_0_4px_rgba(159,66,66,0.15)]',
    disabled: 'opacity-50 cursor-not-allowed',
  };

export function SellerContactForm({ initialData, onSave }: SellerContactFormProps) {
  const [nombreCompleto, setNombreCompleto] = useState(initialData?.nombreCompleto || '');
  const [telefono, setTelefono] = useState(initialData?.telefono || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = useCallback(() => {
    if (!nombreCompleto.trim()) return 'El nombre es obligatorio';
    if (!/^\+?\d{8,15}$/.test(telefono.replace(/\s/g, ''))) return 'Teléfono inválido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
    return null;
  }, [nombreCompleto, telefono, email]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setTouched({ nombre: true, phone: true, email: true });

      const validationError = validate();
      if (validationError) {
        setError(validationError);
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        await new Promise((resolve) => setTimeout(resolve, 600));
        onSave({ nombreCompleto, telefono, email });
      } catch {
        setError('Error al guardar los datos. Intentá de nuevo.');
      } finally {
        setSubmitting(false);
      }
    },
    [nombreCompleto, telefono, email, validate, onSave]
  );

  const fields = [
    { key: 'nombre', label: 'Nombre completo', value: nombreCompleto, setter: setNombreCompleto, placeholder: 'Ej: Juan Pérez' },
    { key: 'phone', label: 'Teléfono', value: telefono, setter: setTelefono, placeholder: 'Ej: +54 11 1234-5678' },
    { key: 'email', label: 'Email', value: email, setter: setEmail, placeholder: 'Ej: juan@email.com', type: 'email' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionTokens.spring.gentle}
      className="mx-auto max-w-md"
    >
      <div className="rounded-2xl border border-border-subtle bg-card p-8 shadow-xl">
        <h2 className="mb-1 text-center text-2xl font-bold text-content-primary">Datos de contacto</h2>
        <p className="mb-6 text-center text-sm text-content-secondary">
          Completá tus datos para que los interesados puedan contactarte.
        </p>

        {error && (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field, index) => (
            <motion.div
              key={field.key}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...motionTokens.spring.gentle, delay: 0.1 + index * 0.03 }}
            >
              <label className="mb-2 block text-sm font-medium text-content-primary">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, [field.key]: true }))}
                placeholder={field.placeholder}
                disabled={submitting}
                 className={`${fieldClasses.base} ${fieldClasses.focus} ${
                   touched[field.key] && !field.value ? fieldClasses.error : ''
                 } ${submitting ? fieldClasses.disabled : ''}`}
              />
              {touched[field.key] && !field.value && (
                <p className="mt-1 text-xs text-red-400">Este campo es obligatorio</p>
              )}
            </motion.div>
          ))}

          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.98 }}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-olive px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-olive/90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-content-primary border-t-transparent" />
                Guardando...
              </>
            ) : (
              'Continuar'
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
