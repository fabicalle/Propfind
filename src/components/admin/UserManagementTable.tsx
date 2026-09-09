'use client';

import { useState, useEffect } from 'react';
import { updateUserRoleAction } from '@/app/actions/property-actions';

const ROLES: { value: string; label: string; description: string }[] = [
  { value: 'FINDER', label: 'Finder', description: 'Usuario público/comprador' },
  { value: 'OWNER', label: 'Dueño', description: 'Dueño directo' },
  { value: 'REALTOR', label: 'Inmobiliaria', description: 'Agente inmobiliario' },
  { value: 'DEVELOPER_B2B', label: 'Desarrollador B2B', description: 'Desarrollador inmobiliario' },
  { value: 'ADMIN', label: 'Admin', description: 'Administrador del sistema' },
];

interface UserRecord {
  id: string;
  email: string | null;
  role: string;
  createdAt: string;
}

interface UpdateUserRoleResult {
  success?: boolean;
  error?: string;
}

async function fetchUsers(): Promise<UserRecord[]> {
  const response = await fetch('/api/admin/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const json = await response.json();
  return json.data;
}

export function UserManagementTable() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchUsers().then(
      (data) => {
        if (cancelled) return;
        setUsers(data);
        setLoading(false);
      },
      (err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
        setLoading(false);
      }
    );
    return () => { cancelled = true; };
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading(userId);
    try {
      const formData = new FormData();
      formData.set('userId', userId);
      formData.set('role', role);

      const result: UpdateUserRoleResult = await updateUserRoleAction(undefined, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role } : u))
        );
      }
    } catch {
      setError('Error al actualizar el rol');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <p className="text-content-secondary">Cargando usuarios...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  if (users.length === 0) {
    return <p className="text-content-secondary">No hay usuarios para mostrar.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-medium">Usuario</th>
            <th className="text-left py-3 px-4 font-medium">Email</th>
            <th className="text-left py-3 px-4 font-medium">Rol Actual</th>
            <th className="text-left py-3 px-4 font-medium">Cambiar Rol</th>
            <th className="text-left py-3 px-4 font-medium">Registrado</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border">
              <td className="py-3 px-4 font-mono text-sm">{user.id.slice(0, 8)}...</td>
              <td className="py-3 px-4">{user.email ?? 'Sin email'}</td>
              <td className="py-3 px-4">
                <span className="px-2 py-1 text-xs rounded bg-surface-tertiary text-content-secondary">
                  {user.role}
                </span>
              </td>
              <td className="py-3 px-4">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={actionLoading === user.id}
                  className="px-2 py-1 text-sm border border-border rounded bg-surface-secondary text-content-primary disabled:opacity-50"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 text-sm text-content-secondary">
                {new Date(user.createdAt).toLocaleDateString('es-AR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
