'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getProvinceById, LOCATIONS, type LocationDepartment, type LocationZone } from '@/shared/data/locations';

export interface LocationFilterValue {
  departmentId: string | null;
  zoneId: string | null;
  provinceId?: string | null;
}

interface LocationFilterProps {
  value: LocationFilterValue;
  onChange: (value: LocationFilterValue) => void;
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openDepartment, setOpenDepartment] = useState(false);
  const [openZone, setOpenZone] = useState(false);
  const departmentRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) {
        setOpenDepartment(false);
        setOpenZone(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const province = getProvinceById('mendoza');

  const selectedDepartment: LocationDepartment | null = value.departmentId
    ? province?.departments.find((d) => d.id === value.departmentId) ?? null
    : null;

  const selectedZone: LocationZone | null =
    selectedDepartment && value.zoneId
      ? selectedDepartment.zones.find((z) => z.id === value.zoneId) ?? null
      : null;

  useEffect(() => {
    const departmentParam = searchParams.get('departamento');
    const zoneParam = searchParams.get('zona');
    const provinceParam = searchParams.get('provincia');

    if (departmentParam || zoneParam || provinceParam) {
      let departmentId: string | null = null;
      let zoneId: string | null = null;
      let provinceId: string | null = null;

      if (provinceParam) {
        const foundProvince = LOCATIONS.find(
          (p) => p.name.toLowerCase() === provinceParam.toLowerCase()
        );
        if (foundProvince) provinceId = foundProvince.id;
      }

      if (departmentParam) {
        const found = province?.departments.find(
          (d) => d.name.toLowerCase() === departmentParam.toLowerCase()
        );
        if (found) departmentId = found.id;
      }

      if (departmentId && zoneParam) {
        const dept = province?.departments.find((d) => d.id === departmentId);
        const foundZone = dept?.zones.find((z) => z.name.toLowerCase() === zoneParam.toLowerCase());
        if (foundZone) zoneId = foundZone.id;
      }

      onChange({ departmentId, zoneId, provinceId });
    }
  }, [searchParams, province, onChange]);

  const handleSelectDepartment = useCallback(
    (departmentId: string | null) => {
      if (departmentId === null) {
        onChange({ departmentId: null, zoneId: null, provinceId: value.provinceId ?? null });
        if (value.provinceId) {
          router.push(`/propiedades?provincia=${encodeURIComponent(value.provinceId)}`, { scroll: false });
        } else {
          router.push('/propiedades', { scroll: false });
        }
      } else {
        onChange({ departmentId, zoneId: null, provinceId: value.provinceId ?? null });
        setOpenZone(true);
      }
      setOpenDepartment(false);
    },
    [onChange, router, value.provinceId]
  );

  const handleSelectZone = useCallback(
    (zoneId: string | null) => {
      onChange({
        departmentId: value.departmentId,
        zoneId,
        provinceId: value.provinceId ?? null,
      });
      setOpenZone(false);
    },
    [onChange, value.departmentId, value.provinceId]
  );

  return (
    <div ref={departmentRef} className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpenDepartment((v) => !v);
            setOpenZone(false);
          }}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            selectedDepartment
              ? 'bg-white text-content-primary'
              : 'bg-app text-content-secondary hover:bg-border-subtle'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {selectedDepartment ? selectedDepartment.name : 'Departamento'}
          <svg className={`h-3 w-3 transition-transform ${openDepartment ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {openDepartment && (
          <motion.div
            className="absolute left-0 top-full z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-border-subtle bg-app py-1 shadow-xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              onClick={() => handleSelectDepartment(null)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                !value.departmentId ? 'bg-border-subtle text-content-primary' : 'text-content-secondary hover:bg-app'
              }`}
            >
              <span>Todos los departamentos</span>
            </button>
            {province?.departments.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => handleSelectDepartment(dept.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  value.departmentId === dept.id
                    ? 'bg-border-subtle text-content-primary'
                    : 'text-content-secondary hover:bg-app'
                }`}
              >
                <span>{dept.name}</span>
                <span className="text-xs text-content-secondary">{dept.zones.length}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (!selectedDepartment) return;
            setOpenZone((v) => !v);
            setOpenDepartment(false);
          }}
          disabled={!selectedDepartment}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            !selectedDepartment
              ? 'bg-border-subtle text-content-secondary cursor-not-allowed'
              : selectedZone
                ? 'bg-white text-content-primary'
                : 'bg-app text-content-secondary hover:bg-border-subtle'
          }`}
        >
          {selectedZone ? selectedZone.name : 'Barrio / Zona'}
          <svg className={`h-3 w-3 transition-transform ${openZone ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {openZone && selectedDepartment && (
          <motion.div
            className="absolute left-0 top-full z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-border-subtle bg-app py-1 shadow-xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <button
              type="button"
              onClick={() => handleSelectZone(null)}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                !value.zoneId ? 'bg-border-subtle text-content-primary' : 'text-content-secondary hover:bg-app'
              }`}
            >
              <span>Todas las zonas</span>
            </button>
            {selectedDepartment.zones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => handleSelectZone(zone.id)}
                className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                  value.zoneId === zone.id
                    ? 'bg-border-subtle text-content-primary'
                    : 'text-content-secondary hover:bg-app'
                }`}
              >
                <span>{zone.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {(value.departmentId || value.zoneId || value.provinceId) && (
        <button
          type="button"
          onClick={() => {
            onChange({ departmentId: null, zoneId: null, provinceId: null });
            router.push('/propiedades', { scroll: false });
          }}
          className="rounded-full p-1.5 text-content-secondary transition-colors hover:bg-border-subtle hover:text-content-primary"
          aria-label="Limpiar ubicación"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
