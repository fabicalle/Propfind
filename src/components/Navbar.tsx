'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus } from 'lucide-react';
import { motionTokens } from '@/lib/motion/tokens';
import { useSessionStore } from '@/store/useSessionStore';
import { UserMenu } from '@/components/UserMenu';

const navItems = [
  { href: '/', label: 'Inicio', Icon: Home },
  { href: '/properties', label: 'Propiedades', Icon: Search },
  { href: '/publicar', label: 'Publicar', Icon: Plus },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthenticated = useSessionStore((state) => state.userSession.isAuthenticated);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={motionTokens.spring.gentle}
      className="fixed left-0 right-0 top-6 z-50 flex justify-center px-4 sm:px-6"
    >
      <div className="flex items-center gap-1 rounded-full border border-border-subtle/60 bg-white/80 px-1.5 py-1.5 shadow-lg backdrop-blur-xl">
        <button onClick={() => router.push('/')} aria-label="Ir al inicio" className="focus:ring-brand-terracotta/50 relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold tracking-tight text-content-primary outline-none transition-colors hover:bg-app focus:ring-2 focus:outline-none">
          <span className="relative z-10">PropFind</span>
        </button>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                aria-label={item.label}
                className={`focus:ring-brand-terracotta/50 relative flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium outline-none transition-all active:scale-95 focus:ring-2 focus:outline-none ${
                  isActive ? 'text-content-primary' : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <item.Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 rounded-full bg-white shadow-sm pointer-events-none"
                    transition={motionTokens.spring.snappy}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
    </motion.header>
  );
}
