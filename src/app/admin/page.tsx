'use client';

import { useState, useEffect } from 'react';
import { PropertyReportTable } from '@/components/admin/PropertyReportTable';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { seedMockDataAction, purgeMockDataAction, getMockPropertyCountAction } from '@/app/actions/admin-mock-actions';

type Tab = 'moderation' | 'users' | 'demo';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('moderation');

  return (
    <div className="space-y-6">
        <nav className="flex gap-2 border-b border-border-subtle mb-6">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 font-medium rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'moderation'
              ? 'border-accent text-accent'
              : 'border-transparent text-content-secondary hover:text-content-primary hover:border-border-subtle'
          }`}
        >
          Moderación de Propiedades
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-accent text-accent'
              : 'border-transparent text-content-secondary hover:text-content-primary hover:border-border-subtle'
          }`}
        >
          Gestión de Usuarios
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`px-4 py-2 font-medium rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'demo'
              ? 'border-accent text-accent'
              : 'border-transparent text-content-secondary hover:text-content-primary hover:border-border-subtle'
          }`}
        >
          Gestión de Datos Demo
        </button>
      </nav>

      {activeTab === 'moderation' && <PropertyReportTable />}
      {activeTab === 'users' && <UserManagementTable />}
      {activeTab === 'demo' && <DemoDataManager />}
    </div>
  );
}

function DemoDataManager() {
  const [mockCount, setMockCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<{ success?: boolean; error?: string; count?: number } | null>(null);

  const loadCount = async () => {
    setLoading(true);
    try {
      const result = await getMockPropertyCountAction();
      setMockCount(result.count);
    } catch {
      setMockCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void getMockPropertyCountAction().then(
      (result) => {
        if (cancelled) return;
        setMockCount(result.count);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setMockCount(0);
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, []);

  const handleSeed = async () => {
    setActionStatus(null);
    const formData = new FormData();
    const result = await seedMockDataAction(undefined, formData);
    setActionStatus(result);
    await loadCount();
  };

  const handlePurge = async () => {
    if (!confirm('¿Estás seguro de eliminar todas las propiedades demo? Esta acción no se puede deshacer.')) {
      return;
    }
    setActionStatus(null);
    const formData = new FormData();
    const result = await purgeMockDataAction(undefined, formData);
    setActionStatus(result);
    await loadCount();
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface-secondary border border-border-subtle rounded-lg p-4">
        <h3 className="font-display font-semibold text-content-primary mb-3">
          Datos de Prueba Demo
        </h3>
        {loading ? (
          <p className="text-content-secondary">Cargando...</p>
        ) : (
          <p className="text-content-secondary">
            Propiedades demo actuales: <strong className="text-content-primary">{mockCount}</strong>
          </p>
        )}
      </div>

      {actionStatus?.error && (
        <p className="text-danger text-sm">{actionStatus.error}</p>
      )}
      {actionStatus?.success && (
        <p className="text-success text-sm">
          {actionStatus.count !== undefined
            ? `${actionStatus.count} propiedades demo procesadas correctamente.`
            : 'Operación completada.'}
        </p>
      )}

      <div className="flex gap-4">
          <button
            onClick={handleSeed}
            className="px-4 py-2 rounded-lg bg-brand-olive text-white text-sm font-semibold shadow-sm transition-colors hover:bg-brand-olive/90 disabled:opacity-50"
          >
            Cargar Propiedades Demo (Nivel Nacional)
          </button>
          <button
            onClick={handlePurge}
            disabled={mockCount === 0}
            className="px-4 py-2 rounded-lg bg-brand-terracotta text-white text-sm font-semibold shadow-sm transition-colors hover:bg-brand-terracotta/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar Propiedades Demo
          </button>
      </div>
    </div>
  );
}
