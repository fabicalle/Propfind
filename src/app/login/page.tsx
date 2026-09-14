'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    const urlMessage = params.get('message');
    const redirectTo = params.get('redirect') || '/';

    if (urlError) setError(urlError);
    if (urlMessage) setMessage(urlMessage);

    const supabase = createSupabaseClient();
    if (!supabase) {
      setChecking(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: { user: unknown } | null } }) => {
      if (session?.user) {
        router.replace(redirectTo);
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Error de configuración: faltan variables de entorno');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || 'Credenciales inválidas');
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/';
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Error inesperado al iniciar sesión');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseClient();
      if (!supabase) {
        setError('Error de configuración: faltan variables de entorno');
        setIsLoading(false);
        return;
      }

      const returnTo = new URLSearchParams(window.location.search).get('redirect') || '/';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(returnTo)}`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) {
        setError(error.message || 'Error con Google OAuth');
        setIsLoading(false);
      }
    } catch {
      setError('Error inesperado con Google OAuth');
      setIsLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" />
      </div>
    );
  }

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
             <h1 className="text-3xl font-bold text-content-primary">Iniciar sesión</h1>
             <p className="mt-2 text-sm text-content-secondary">
              Ingresá con tu cuenta de Google o con tu email y contraseña.
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

          <div className="space-y-3">
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
               className="flex w-full items-center justify-center gap-3 rounded-xl border border-border-subtle bg-card px-6 py-3 text-sm font-semibold text-content-primary transition-colors hover:bg-app disabled:opacity-50"
            >
              {isLoading ? (
                 <div className="h-5 w-5 animate-spin rounded-full border-2 border-border-subtle border-t-content-primary" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Google
            </motion.button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                 <span className="bg-card px-2 text-content-secondary">o</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                 <label className="mb-2 block text-sm font-medium text-content-primary">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
                  'Ingresar'
                )}
              </motion.button>
            </form>

             <p className="text-center text-xs text-content-secondary">
              ¿No tenés cuenta?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="font-semibold text-brand-terracotta underline underline-offset-2 hover:text-brand-terracotta/80"
              >
                Crear cuenta
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
