'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function Footer() {
  const router = useRouter();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="border-t border-border-subtle bg-app"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-tight text-content-primary">PropFind</span>
          <span className="h-1 w-1 rounded-full bg-border-subtle" />
          <p className="text-sm text-content-secondary">Encontrá tu próxima propiedad.</p>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/properties')}
            className="text-sm font-medium text-content-secondary transition-colors hover:text-content-primary"
          >
            Explorar
          </button>
          <button
            onClick={() => router.push('/publicar')}
            className="text-sm font-medium text-content-secondary transition-colors hover:text-content-primary"
          >
            Publicar
          </button>
        </div>
      </div>
    </motion.footer>
  );
}
