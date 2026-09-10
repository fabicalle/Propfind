import type { ReactNode } from 'react';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import './../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-app text-content-primary antialiased">
        <nav className="border-b border-border-subtle bg-surface-secondary px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-display text-sm font-semibold">
              A
            </div>
            <span className="font-display text-xl font-semibold text-content-primary">
              Panel de Administración
            </span>
          </div>
        </nav>
        <main className="p-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-lg border border-border-subtle bg-card p-6 shadow-sm">
              {children}
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
