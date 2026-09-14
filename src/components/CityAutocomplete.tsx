'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { LOCATIONS, findDepartmentById, type LocationDepartment, type LocationZone } from '@/shared/data/locations';

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string, departmentId?: string | null, localityId?: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface LocationOption {
  departmentId: string;
  departmentName: string;
  localityId?: string;
  localityName?: string;
  provinceName: string;
}

export function CityAutocomplete({ value, onChange, placeholder = 'Ej: Mendoza', disabled }: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = useMemo<LocationOption[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const matches: LocationOption[] = [];

    for (const province of LOCATIONS) {
      for (const department of province.departments) {
        const departmentMatch =
          department.name.toLowerCase().includes(q) ||
          (department.aliases || []).some((alias) => alias.includes(q));

        if (departmentMatch) {
          matches.push({
            departmentId: department.id,
            departmentName: department.name,
            provinceName: province.name,
          });
        }

        for (const zone of department.zones) {
          const zoneMatch =
            zone.name.toLowerCase().includes(q) ||
            department.name.toLowerCase().includes(q) ||
            (department.aliases || []).some((alias) => alias.includes(q));

          if (zoneMatch) {
            matches.push({
              departmentId: department.id,
              departmentName: department.name,
              localityId: zone.id,
              localityName: zone.name,
              provinceName: province.name,
            });
          }
        }
      }
    }

    return matches.slice(0, 8);
  }, [query]);

  const handleSelect = useCallback(
    (option: LocationOption) => {
      const city = option.localityName || option.departmentName;
      setQuery(city);
      onChange(city, option.departmentId, option.localityId || null);
      setOpen(false);
      setActiveIndex(0);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setQuery(next);
      setOpen(true);
      setActiveIndex(0);

      if (!next.trim()) {
        onChange('', null, null);
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    const matched = options[activeIndex];
    if (matched && query.trim().length >= 2) {
      handleSelect(matched);
    }
  }, [activeIndex, handleSelect, options, query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open || options.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [open, options.length]
  );

  const label = useMemo(() => {
    if (!options.length) return '';
    const option = options[activeIndex];
    if (option.localityName) {
      return `${option.localityName}, ${option.departmentName}`;
    }
    return `${option.departmentName}, ${option.provinceName}`;
  }, [activeIndex, options]);

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (options.length > 0) setOpen(true);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className={`${fieldClasses.base} ${fieldClasses.focus}`}
      />
      {open && options.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border-subtle bg-app py-1 shadow-lg">
          {options.map((option, index) => (
            <li
              key={`${option.departmentId}-${option.localityId ?? 'dept'}`}
              onMouseDown={() => handleSelect(option)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                index === activeIndex ? 'bg-border-subtle text-content-primary' : 'text-content-secondary hover:bg-border-subtle'
              }`}
            >
              <div className="font-medium">{option.localityName || option.departmentName}</div>
              <div className="text-xs text-content-secondary">
                {option.departmentName} · {option.provinceName}
              </div>
            </li>
          ))}
        </ul>
      )}
      {open && options.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-1 rounded-lg border border-border-subtle bg-app px-3 py-2 text-xs text-content-secondary shadow-lg">
          No se encontraron ubicaciones
        </div>
      )}
    </div>
  );
}

const fieldClasses = {
  base: 'w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200',
  focus: 'focus:border-brand-terracotta focus:ring-1 focus:ring-brand-terracotta',
};
