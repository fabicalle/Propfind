'use client';

import { useState, useEffect } from 'react';
import { moderatePropertyAction } from '@/app/actions/property-actions';

interface ReportedProperty {
  id: string;
  isActive: boolean;
  title: string;
  reportCount: number;
  latestReport: {
    reason: string;
    details: string | null;
    createdAt: Date;
  } | null;
}

async function fetchReportedProperties(): Promise<ReportedProperty[]> {
  const response = await fetch('/api/admin/reports');
  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }
  const json = await response.json();
  return json.data;
}

export function PropertyReportTable() {
  const [properties, setProperties] = useState<ReportedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReportedProperties();
      setProperties(data);
      setError(null);
    } catch {
      setError('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void fetchReportedProperties().then(
      (data) => {
        if (cancelled) return;
        setProperties(data);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setError('Error al cargar reportes');
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, []);

  const handleModeration = async (propertyId: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE') => {
    setActionLoading(propertyId);
    try {
      const formData = new FormData();
      formData.set('propertyId', propertyId);
      formData.set('action', action);

      const result = await moderatePropertyAction(undefined, formData);
      if (!result.success) {
        setError(result.error);
      } else {
        loadReports();
      }
    } catch {
      setError('Error en la acción de moderación');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <p className="text-content-secondary">Cargando reportes...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (properties.length === 0) {
    return <p className="text-content-secondary">No hay propiedades reportadas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium">Propiedad</th>
            <th className="text-left py-3 px-4 font-medium">Reportes</th>
            <th className="text-left py-3 px-4 font-medium">Último Reporte</th>
            <th className="text-left py-3 px-4 font-medium">Estado</th>
            <th className="text-left py-3 px-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((property) => (
            <tr key={property.id} className="border-b border-border">
              <td className="py-3 px-4">
                <div className="font-medium">{property.title}</div>
              </td>
              <td className="py-3 px-4">{property.reportCount}</td>
              <td className="py-3 px-4">
                {property.latestReport ? (
                  <div>
                    <span className="font-medium">{property.latestReport.reason}</span>
                    {property.latestReport.details && (
                      <p className="text-sm text-content-secondary mt-1">
                        {property.latestReport.details}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-content-secondary">N/A</span>
                )}
              </td>
              <td className="py-3 px-4">
                {property.isActive ? (
                  <span className="text-accent">Activa</span>
                ) : (
                  <span className="text-danger">Desactivada</span>
                )}
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleModeration(property.id, 'ACTIVATE')}
                    disabled={actionLoading === property.id}
                    className="px-3 py-1 text-sm bg-success/10 text-success rounded hover:bg-success/20 disabled:opacity-50"
                  >
                    Activar
                  </button>
                  <button
                    onClick={() => handleModeration(property.id, 'DEACTIVATE')}
                    disabled={actionLoading === property.id}
                    className="px-3 py-1 text-sm bg-warning/10 text-warning rounded hover:bg-warning/20 disabled:opacity-50"
                  >
                    Desactivar
                  </button>
                  <button
                    onClick={() => handleModeration(property.id, 'DELETE')}
                    disabled={actionLoading === property.id}
                    className="px-3 py-1 text-sm bg-danger/10 text-danger rounded hover:bg-danger/20 disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
