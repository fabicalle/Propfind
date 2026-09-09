'use client';

import { useState } from 'react';
import { PropertyReportTable } from '@/components/admin/PropertyReportTable';
import { UserManagementTable } from '@/components/admin/UserManagementTable';

type Tab = 'moderation' | 'users';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('moderation');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'moderation'
              ? 'border-b-2 border-accent text-accent'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Moderación de Propiedades
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'users'
              ? 'border-b-2 border-accent text-accent'
              : 'text-content-secondary hover:text-content-primary'
          }`}
        >
          Gestión de Usuarios
        </button>
      </div>

      {activeTab === 'moderation' && <PropertyReportTable />}
      {activeTab === 'users' && <UserManagementTable />}
    </div>
  );
}
