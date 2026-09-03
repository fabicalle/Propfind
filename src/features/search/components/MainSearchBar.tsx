'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { searchLocations, type LocationIndex } from '@/shared/data/locations';
import { useGeoIP } from '@/features/properties/hooks/useGeoIP';

export interface MainSearchBarProps {
  placeholder?: string;
}

export function MainSearchBar({ placeholder = 'Buscar por ciudad, provincia, departamento o zona...' }: MainSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationIndex[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { departmentId, departmentName, city, region, loading: geoLoading } = useGeoIP();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (value.trim().length >= 2) {
      setSuggestions(searchLocations(value));
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  const navigateToResults = useCallback(
    (location: LocationIndex) => {
      const params = new URLSearchParams();
      if (location.departmentId && location.departmentId !== 'all') {
        params.set('departamento', location.departmentName);
      } else if (location.provinceId) {
        params.set('provincia', location.provinceName);
      }
      if (location.localityId) {
        params.set('zona', location.localityName || '');
      }
      const queryString = params.toString();
      router.push(`/properties${queryString ? `?${queryString}` : ''}`);
      setIsOpen(false);
      setQuery('');
    },
    [router]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (suggestions.length > 0 && activeIndex >= 0 && activeIndex < suggestions.length) {
        navigateToResults(suggestions[activeIndex]);
      } else if (query.trim()) {
        const params = new URLSearchParams();
        params.set('location', query.trim());
        router.push(`/properties?${params.toString()}`);
        setIsOpen(false);
        setQuery('');
      } else if (!query.trim() && departmentName) {
        const params = new URLSearchParams();
        if (departmentId && departmentId !== 'all') {
          params.set('departamento', departmentName);
        } else if (region) {
          params.set('provincia', region);
        }
        if (city) {
          params.set('zona', city);
        }
        const queryString = params.toString();
        router.push(`/properties${queryString ? `?${queryString}` : ''}`);
      }
    },
    [suggestions, activeIndex, navigateToResults, query, router, departmentName, departmentId, region, city]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [isOpen, suggestions.length]
  );

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return text;
    return (
      <>
        {text.slice(0, index)}
        <span className="text-brand-terracotta">{text.slice(index, index + query.length)}</span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const getSuggestionLabel = (location: LocationIndex) => {
    if (location.localityName) {
      return `${location.localityName}, ${location.departmentName}`;
    }
    if (location.departmentId !== 'all') {
      return `${location.departmentName}, ${location.provinceName}`;
    }
    return location.provinceName;
  };

  const getSuggestionDescription = (location: LocationIndex) => {
    if (location.localityName) {
      return `${location.departmentName} · ${location.provinceName}`;
    }
    if (location.departmentId !== 'all') {
      return location.provinceName;
    }
    return 'Buscar en toda la provincia';
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit}>
        <div className="relative rounded-2xl border border-border-subtle bg-app shadow-lg transition-all hover:shadow-xl">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 2 && suggestions.length > 0) setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full rounded-2xl bg-transparent px-6 py-4 pr-14 text-sm text-content-primary placeholder:text-content-secondary focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50"
            autoComplete="off"
            aria-label="Buscar ubicación"
            aria-expanded={isOpen}
            aria-controls="search-suggestions"
            role="combobox"
          />
          <button
            type="submit"
            aria-label="Buscar propiedades"
            className="focus:ring-brand-terracotta/50 absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-terracotta p-2.5 text-white shadow-sm outline-none transition-all hover:brightness-110 active:scale-95 focus:ring-2 focus:outline-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {isOpen && suggestions.length > 0 && (
        <motion.ul
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border-subtle bg-app shadow-xl"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {suggestions.map((location, index) => (
            <li
              key={`${location.provinceId}-${location.departmentId}-${location.localityId ?? 'dept'}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-4 py-3 transition-colors ${
                index === activeIndex ? 'bg-border-subtle' : 'hover:bg-border-subtle'
              }`}
              onClick={() => navigateToResults(location)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="text-sm font-medium text-content-primary">
                {highlightMatch(getSuggestionLabel(location), query)}
              </div>
              <div className="mt-0.5 text-xs text-content-secondary">{getSuggestionDescription(location)}</div>
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
}
