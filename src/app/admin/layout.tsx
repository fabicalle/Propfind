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
      <body className="min-h-full flex flex-col bg-app text-content-primary">
        <nav className="border-b border-border-subtle bg-surface-secondary px-6 py-3 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-content-primary">
            Panel de Administración
          </span>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
