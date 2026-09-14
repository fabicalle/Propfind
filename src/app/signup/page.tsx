'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    const urlMessage = params.get('message');
    if (urlError) setError(urlError);
    if (urlMessage) setMessage(urlMessage);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ingresá tu nombre y apellido');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Error de configuración: faltan variables de entorno');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim() || undefined,
          },
          emailRedirectTo: `${window.location.origin}/login?message=email_confirmed`,
        },
      });

      if (error) {
        setError(error.message || 'Error al crear la cuenta');
        setIsLoading(false);
        return;
      }

      setMessage('Te enviamos un correo para confirmar tu cuenta. Revisá tu bandeja de entrada.');
      setIsLoading(false);
    } catch {
      setError('Error inesperado al crear la cuenta');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...motionTokens.spring.gentle }}
        className="w-full max-w-md"
      >
         <div className="rounded-3xl border border-border-subtle bg-card p-8 shadow-xl">
          <div className="mb-8 text-center">
             <h1 className="text-3xl font-bold text-content-primary">Crear cuenta</h1>
             <p className="mt-2 text-sm text-content-secondary">
              Completá tus datos para publicar y guardar propiedades.
            </p>
          </div>

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

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="mb-2 block text-sm font-medium text-content-primary">Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  required
                   className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
                />
              </div>
              <div>
                 <label className="mb-2 block text-sm font-medium text-content-primary">Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Pérez"
                  required
                   className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
                />
              </div>
            </div>

            <div>
               <label className="mb-2 block text-sm font-medium text-content-primary">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
              />
            </div>

            <div>
               <label className="mb-2 block text-sm font-medium text-content-primary">Teléfono / WhatsApp <span className="text-content-secondary">(opcional)</span></label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+54 9 261 123 4567"
                className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
              />
            </div>

            <div>
               <label className="mb-2 block text-sm font-medium text-content-primary">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
              />
            </div>

            <div>
               <label className="mb-2 block text-sm font-medium text-content-primary">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetí tu contraseña"
                required
                minLength={6}
                className="w-full rounded-xl border border-border-subtle bg-app px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary focus:border-brand-terracotta focus:outline-none focus:ring-1 focus:ring-brand-terracotta"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
               className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-olive px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-olive/90 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Crear cuenta'
              )}
            </motion.button>
          </form>

           <p className="mt-4 text-center text-xs text-content-secondary">
             ¿Ya tenés cuenta?{' '}
             <button
               type="button"
               onClick={() => router.push('/login')}
               className="font-semibold text-brand-terracotta underline underline-offset-2 hover:text-brand-terracotta/80"
            >
              Iniciar sesión
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
