'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { useRouter } from 'next/navigation';
import { User, Heart, LogOut, ChevronRight } from 'lucide-react';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useUserMenu } from '@/hooks/useUserMenu';

interface UserMenuProps {
  onOpenProfile?: () => void;
}

export function UserMenu({ onOpenProfile }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const favoritesCount = useFavoritesStore((state) => state.favorites.length);
  const { user, isLoading, handleLogin, handleLogout } = useUserMenu(onOpenProfile);

  const getInitials = () => {
    const fullName = (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || user?.email || 'U';
    const parts = fullName.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : fullName.slice(0, 2).toUpperCase();
  };

  const avatarUrl = (user?.user_metadata?.avatar_url as string) || null;

  if (isLoading) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-full bg-border-subtle" />
    );
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        aria-label="Iniciar sesión"
         className="focus:ring-brand-terracotta/50 flex items-center gap-2 rounded-xl bg-brand-olive px-4 py-2 text-sm font-semibold text-white shadow-sm outline-none transition-all hover:bg-brand-olive/90 active:scale-95 focus:ring-2 focus:outline-none"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        <span className="hidden sm:inline">Ingresar</span>
      </button>
    );
  }

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Abrir menú de usuario"
        aria-expanded={isOpen}
        className="focus:ring-brand-terracotta/50 flex items-center gap-2 rounded-xl p-1 outline-none transition-all hover:bg-app active:scale-95 focus:ring-2 focus:outline-none"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.email || 'Avatar'}
            className="h-9 w-9 rounded-full object-cover border border-border-subtle shadow-sm"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-olive text-xs font-semibold text-white border border-border-subtle shadow-sm">
            {getInitials()}
          </div>
        )}
        {favoritesCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
            {favoritesCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-card shadow-xl ring-1 ring-border-subtle"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={motionTokens.spring.snappy}
          >
            <div className="py-1.5">
              <button
                onClick={() => handleNavigate('/perfil')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-content-primary transition-colors hover:bg-content-primary/5"
              >
                <User className="h-4 w-4 text-content-secondary" />
                <span>Mi Perfil</span>
                <ChevronRight className="ml-auto h-4 w-4 text-content-secondary" />
              </button>
              <button
                onClick={() => handleNavigate('/favoritos')}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-content-primary transition-colors hover:bg-content-primary/5"
              >
                <Heart className="h-4 w-4 text-content-secondary" />
                <span>Mis Favoritos</span>
                <ChevronRight className="ml-auto h-4 w-4 text-content-secondary" />
              </button>
              <div className="my-1.5 border-t border-border-subtle" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
