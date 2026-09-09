import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface text-content-primary antialiased">
        <nav className="border-b border-border bg-surface-secondary px-6 py-3 flex items-center justify-between">
          <span className="font-display text-xl font-semibold text-content-primary">
            Panel de Administración
          </span>
        </nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}
