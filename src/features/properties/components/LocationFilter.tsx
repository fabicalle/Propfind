'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getProvinceById, findDepartmentById, LOCATIONS, type LocationDepartment, type LocationZone, type LocationProvince } from '@/shared/data/locations';
import { useGeorefSearch } from '@/hooks/useGeorefSearch';

export interface LocationFilterValue {
  departmentId: string | null;
  zoneId: string | null;
  provinceId?: string | null;
}

interface LocationFilterProps {
  value: LocationFilterValue;
  onChange: (value: LocationFilterValue) => void;
  defaultProvinceId?: string | null;
}

function mapGeorefProvince(georefProvinceName: string): string | null {
  const lower = georefProvinceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cabaAliases = ['capital federal', 'ciudad autónoma de buenos aires', 'ciudad autonoma de buenos aires', 'caba'];
  for (const alias of cabaAliases) {
    if (lower === alias) return 'caba';
  }
  for (const province of LOCATIONS) {
    const provinceNameLower = province.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (provinceNameLower === lower) return province.id;
  }
  for (const province of LOCATIONS) {
    const provinceNameLower = province.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (provinceNameLower.includes(lower) || lower.includes(provinceNameLower)) return province.id;
  }
  return null;
}

export function LocationFilter({ value, onChange, defaultProvinceId }: LocationFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openProvince, setOpenProvince] = useState(false);
  const [openDepartment, setOpenDepartment] = useState(false);
  const [openZone, setOpenZone] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { results: georefResults, loading: georefLoading, search: georefSearch, clear: georefClear } = useGeorefSearch();

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!node.contains(event.target as Node)) {
        setOpenProvince(false);
        setOpenDepartment(false);
        setOpenZone(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedProvince = useMemo<LocationProvince | null>(() => {
    const pid = value.provinceId || defaultProvinceId || null;
    return pid ? getProvinceById(pid) ?? null : null;
  }, [value.provinceId, defaultProvinceId]);

  const selectedDepartment: LocationDepartment | null = useMemo(() => {
    if (!value.departmentId) return null;
    return findDepartmentById(value.departmentId) ?? selectedProvince?.departments.find((d) => d.id === value.departmentId) ?? null;
  }, [value.departmentId, selectedProvince]);

  const selectedZone: LocationZone | null = useMemo(() => {
    if (!selectedDepartment || !value.zoneId) return null;
    return selectedDepartment.zones.find((z) => z.id === value.zoneId) ?? null;
  }, [selectedDepartment, value.zoneId]);

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
          (p) => p.name.toLowerCase() === provinceParam.toLowerCase() || p.id === provinceParam
        );
        if (foundProvince) provinceId = foundProvince.id;
      }

      if (departmentParam) {
        const foundDept = findDepartmentById(departmentParam);
        if (foundDept) {
          departmentId = foundDept.id;
          let foundProvince = LOCATIONS.find((p) => p.id === provinceId);
          if (!foundProvince) {
            foundProvince = LOCATIONS.find((p) => p.departments.some((d) => d.id === departmentId));
            if (foundProvince) provinceId = foundProvince.id;
          }
        } else {
          const currentProvinceId = provinceId || defaultProvinceId || null;
          const currentProvince = currentProvinceId ? getProvinceById(currentProvinceId) : null;
          if (currentProvince) {
            const found = currentProvince.departments.find(
              (d) => d.name.toLowerCase() === departmentParam.toLowerCase()
            );
            if (found) departmentId = found.id;
          }
        }
      }

      if (departmentId && zoneParam) {
        const dept = findDepartmentById(departmentId);
        const foundZone = dept?.zones.find((z) => z.name.toLowerCase() === zoneParam.toLowerCase());
        if (foundZone) zoneId = foundZone.id;
      }

      onChange({ departmentId, zoneId, provinceId });
    }
  }, [searchParams, defaultProvinceId, onChange]);

  const handleSelectProvince = useCallback(
    (provinceId: string | null) => {
      setOpenProvince(false);
      onChange({
        departmentId: null,
        zoneId: null,
        provinceId,
      });
      const params = new URLSearchParams();
      if (provinceId) params.set('provincia', provinceId);
      router.push(`/properties?${params.toString()}`, { scroll: false });
      setOpenDepartment(false);
      setOpenZone(false);
    },
    [onChange, router]
  );

  const handleSelectDepartment = useCallback(
    (departmentId: string | null) => {
      if (departmentId === null) {
        onChange({ departmentId: null, zoneId: null, provinceId: value.provinceId ?? null });
        if (value.provinceId) {
          router.push(`/properties?provincia=${encodeURIComponent(value.provinceId)}`, { scroll: false });
        } else {
          router.push('/properties', { scroll: false });
        }
      } else {
        const dept = findDepartmentById(departmentId);
        let provinceId = value.provinceId;
        if (!provinceId && dept) {
          const foundProvince = LOCATIONS.find((p) => p.departments.some((d) => d.id === departmentId));
          provinceId = foundProvince?.id ?? null;
        }
        onChange({ departmentId, zoneId: null, provinceId: provinceId ?? null });
        const params = new URLSearchParams();
        if (provinceId) params.set('provincia', provinceId);
        params.set('departamento', departmentId);
        router.push(`/properties?${params.toString()}`, { scroll: false });
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

  const handleGeorefSelect = useCallback((result: { id: string; name: string; provinceId: string; provinceName: string; departmentId: string; departmentName: string; lat: number; lng: number }) => {
    const provinceId = mapGeorefProvince(result.provinceName);
    let departmentId: string | null = null;

    if (provinceId) {
      const province = getProvinceById(provinceId);
      if (province) {
        const dept = province.departments.find(
          (d) => d.name.toLowerCase() === result.departmentName.toLowerCase() ||
          (d.aliases && d.aliases.some((a) => a.toLowerCase() === result.departmentName.toLowerCase()))
        );
        if (dept) departmentId = dept.id;
      }
    }

    if (!departmentId) {
      departmentId = findDepartmentById(result.departmentId)?.id ?? null;
    }

    onChange({ departmentId, zoneId: null, provinceId: provinceId ?? null });
    georefClear();
    setSearchQuery('');

    const params = new URLSearchParams();
    if (provinceId) params.set('provincia', provinceId);
    if (departmentId) params.set('departamento', departmentId);
    router.push(`/properties?${params.toString()}`, { scroll: false });

    setOpenProvince(false);
    setOpenDepartment(false);
    setOpenZone(false);
  }, [onChange, router, georefClear]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.length >= 2) {
      georefSearch(value);
    } else {
      georefClear();
    }
  }, [georefSearch, georefClear]);

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpenProvince((v) => !v);
            setOpenDepartment(false);
            setOpenZone(false);
          }}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            selectedProvince
              ? 'bg-white text-content-primary'
              : 'bg-app text-content-secondary hover:bg-border-subtle'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.312 14.812A10 10 0 1018.5 12c0-.5-.062-1.025-.17-1.5a6.5 6.5 0 01-11.13 0c-.11.475-.17 1-.17 1.5 0 5.522 4.477 10 10 10 .995 0 1.97-.212 2.89-.606" />
          </svg>
          {selectedProvince ? selectedProvince.name : 'Provincia'}
          <svg className={`h-3 w-3 transition-transform ${openProvince ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {openProvince && (
          <motion.div
            className="absolute left-0 top-full z-50 mt-1 max-h-72 w-56 overflow-y-auto rounded-lg border border-border-subtle bg-app py-1 shadow-xl"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="border-b border-border-subtle px-2 py-1">
              <input
                type="text"
                placeholder="Buscar localidad..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-md bg-app-secondary px-2 py-1 text-sm text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {georefLoading && (
                <div className="px-2 py-1 text-xs text-content-secondary">Buscando...</div>
              )}
              {georefResults.length > 0 && (
                <div className="max-h-40 overflow-y-auto">
                  {georefResults.slice(0, 5).map((result) => (
                    <button
                      key={`geo-${result.id}`}
                      type="button"
                      onClick={() => handleGeorefSelect(result)}
                      className="w-full px-2 py-1 text-left text-sm text-content-secondary hover:bg-border-subtle"
                    >
                      <div className="font-medium text-content-primary">{result.name}</div>
                      <div className="text-xs">{result.departmentName}, {result.provinceName}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSelectProvince(null)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                !selectedProvince ? 'bg-border-subtle text-content-primary' : 'text-content-secondary hover:bg-app'
              }`}
            >
              <span>Todas las provincias</span>
            </button>
            {LOCATIONS.map((province) => (
              <button
                key={province.id}
                type="button"
                onClick={() => handleSelectProvince(province.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  selectedProvince?.id === province.id
                    ? 'bg-border-subtle text-content-primary'
                    : 'text-content-secondary hover:bg-app'
                }`}
              >
                <span>{province.name}</span>
                <span className="text-xs text-content-secondary">{province.departments.length}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {selectedProvince && (
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
              {selectedProvince.departments.map((dept) => (
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
      )}

      {selectedDepartment && (
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
      )}

      {(value.departmentId || value.zoneId || value.provinceId) && (
        <button
          type="button"
          onClick={() => {
            onChange({ departmentId: null, zoneId: null, provinceId: null });
            router.push('/properties', { scroll: false });
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
