'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FilterCriteria, Property } from '@/store/useAppStore';
import { useFilterStore } from '@/store/useFilterStore';
import { PropertyCard } from '@/components/PropertyCard';
import { loadFiltersLocally } from '@/lib/persistence/filterPersistence';

const DEFAULT_FILTER: FilterCriteria = {
  listingType: 'rent',
  propertyTypes: [],
  rooms: [],
  bathrooms: undefined,
  amenities: [],
  priceMin: undefined,
  priceMax: undefined,
  areaMin: undefined,
  areaMax: undefined,
};

const AMENITIES_OPTIONS = [
  'Patio',
  'Lavandería',
  'Cocina',
  'Balcón',
  'Terraza',
  'Cochera',
  'Piscina',
  'Seguridad',
  'Aire acondicionado',
  'Calefacción',
];

const ARGENTINA_PROVINCES = [
  'Buenos Aires',
  'Ciudad Autónoma de Buenos Aires',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Tucumán',
  'Entre Ríos',
  'Salta',
  'Misiones',
  'Chaco',
];

export default function SearchPage() {
  const { activeFilter, setActiveFilter, savedFilters, saveFilter, removeFilter } = useFilterStore();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const [localFilter, setLocalFilter] = useState<FilterCriteria>(() => {
    const saved = loadFiltersLocally<FilterCriteria>();
    if (saved && Object.keys(saved).length > 0) {
      setActiveFilter(saved);
      return saved;
    }
    return DEFAULT_FILTER;
  });

  useEffect(() => {
    if (activeFilter && Object.keys(activeFilter).length > 0) {
      setLocalFilter(activeFilter);
    }
  }, [activeFilter]);

  const toggleArrayItem = useCallback(
    (field: 'rooms' | 'propertyTypes' | 'amenities', value: number | string) => {
      setLocalFilter((prev) => {
        const current = (prev[field] || []) as (number | string)[];
        const updated = current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value];
        return { ...prev, [field]: updated };
      });
    },
    []
  );

  const searchProperties = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      const filters: Record<string, unknown> = {};
      if (localFilter.listingType) filters.listingType = localFilter.listingType;
      if (localFilter.propertyTypes?.length) filters.propertyTypes = localFilter.propertyTypes;
      if (localFilter.rooms?.length) filters.rooms = localFilter.rooms;
      if (localFilter.bathrooms) filters.bathrooms = localFilter.bathrooms;
      if (localFilter.amenities?.length) filters.amenities = localFilter.amenities;
      if (localFilter.priceMin || localFilter.priceMax) {
        filters.priceMin = localFilter.priceMin;
        filters.priceMax = localFilter.priceMax;
      }
      if (localFilter.areaMin || localFilter.areaMax) {
        filters.areaMin = localFilter.areaMin;
        filters.areaMax = localFilter.areaMax;
      }

      const response = await fetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters,
          limit: 50,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setProperties(result.data?.properties || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [localFilter]);

  useEffect(() => {
    searchProperties();
  }, [searchProperties]);

  const handleSaveFilter = useCallback(() => {
    if (!newFilterName.trim()) return;
    saveFilter({
      id: crypto.randomUUID(),
      filterName: newFilterName,
      criteria: localFilter,
      isDefault: false,
      createdAt: new Date().toISOString(),
    });
    setNewFilterName('');
    setShowSaveDialog(false);
  }, [newFilterName, localFilter, saveFilter]);

  const handleLoadFilter = useCallback(
    (filter: FilterCriteria) => {
      setLocalFilter(filter);
      setActiveFilter(filter);
    },
    [setActiveFilter]
  );

  return (
    <div className="min-h-screen bg-app text-content-primary pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold">Buscar Propiedades</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
             <div className="rounded-2xl border border-border-subtle bg-card p-6 shadow-xl">
              <h2 className="mb-6 text-lg font-semibold">Filtros</h2>

              {/* Listing Type */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Tipo de operación
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'rent', label: 'Alquiler' },
                    { value: 'sale', label: 'Compra' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setLocalFilter((prev) => ({
                          ...prev,
                          listingType: option.value as 'rent' | 'sale',
                        }))
                      }
                       className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                         localFilter.listingType === option.value
                           ? 'bg-card text-content-primary'
                           : 'bg-app text-content-secondary hover:bg-border-chip'
                       }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Property Type */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Tipo de propiedad
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'APARTMENT', label: 'Departamento' },
                    { value: 'HOUSE', label: 'Casa' },
                    { value: 'STUDIO', label: 'Monoambiente' },
                    { value: 'PENTHOUSE', label: 'Penthouse' },
                    { value: 'TOWNHOUSE', label: 'Townhouse' },
                    { value: 'LAND', label: 'Terreno' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleArrayItem('propertyTypes', option.value)}
                       className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                         localFilter.propertyTypes?.includes(option.value)
                           ? 'bg-card text-content-primary'
                           : 'bg-app text-content-secondary hover:bg-border-chip'
                       }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rooms */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Habitaciones
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => toggleArrayItem('rooms', num)}
                       className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                         localFilter.rooms?.includes(num)
                           ? 'bg-card text-content-primary'
                           : 'bg-app text-content-secondary hover:bg-border-chip'
                       }`}
                    >
                      {num === 5 ? '5+' : num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bathrooms */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Baños
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() =>
                        setLocalFilter((prev) => ({
                          ...prev,
                          bathrooms: prev.bathrooms === num ? undefined : num,
                        }))
                      }
                       className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                         localFilter.bathrooms === num
                           ? 'bg-card text-content-primary'
                           : 'bg-app text-content-secondary hover:bg-border-chip'
                       }`}
                    >
                      {num}+
                    </button>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Ambientes / Servicios
                </label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      onClick={() => toggleArrayItem('amenities', amenity)}
                       className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                         localFilter.amenities?.includes(amenity)
                           ? 'bg-card text-content-primary'
                           : 'bg-app text-content-secondary hover:bg-border-chip'
                       }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pets Allowed */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilter.amenities?.includes('Mascotas permitidas') || false}
                    onChange={(e) =>
                      toggleArrayItem('amenities', 'Mascotas permitidas')
                    }
                     className="h-5 w-5 rounded bg-border-subtle text-content-primary focus:ring-2 focus:ring-content-primary"
                  />
                   <span className="text-sm font-medium text-content-secondary">
                    Permite mascotas
                  </span>
                </label>
              </div>

              {/* Location */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Provincia
                </label>
                <select
                  value={localFilter.areaMin || ''}
                  onChange={(e) =>
                    setLocalFilter((prev) => ({
                      ...prev,
                      areaMin: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                   className="w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary"
                >
                  <option value="">Todas</option>
                  {ARGENTINA_PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Ciudad / Localidad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Palermo, Córdoba..."
                  value={localFilter.areaMax || ''}
                  onChange={(e) =>
                    setLocalFilter((prev) => ({
                      ...prev,
                      areaMax: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                   className="w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary"
                />
              </div>

              {/* Price Range */}
              <div className="mb-6">
                 <label className="mb-2 block text-sm font-medium text-content-secondary">
                  Precio
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localFilter.priceMin || ''}
                    onChange={(e) =>
                      setLocalFilter((prev) => ({
                        ...prev,
                        priceMin: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={localFilter.priceMax || ''}
                    onChange={(e) =>
                      setLocalFilter((prev) => ({
                        ...prev,
                        priceMax: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    className="w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={searchProperties}
                  disabled={loading}
                  className="w-full rounded-lg bg-brand-olive py-3 text-sm font-medium text-white hover:bg-brand-olive/90 disabled:opacity-50"
                >
                 {loading ? 'Buscando...' : 'Buscar'}
               </button>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="w-full rounded-lg bg-card border border-border-subtle py-3 text-sm font-medium text-content-primary hover:bg-app disabled:opacity-50"
                >
                  Guardar búsqueda
                </button>
              </div>

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-content-secondary">
                    Búsquedas guardadas
                  </label>
                  <div className="space-y-2">
                    {savedFilters.map((filter) => (
                       <div
                         key={filter.id}
                         className="flex items-center justify-between rounded-lg bg-app border border-border-subtle px-3 py-2"
                       >
                        <button
                          onClick={() => handleLoadFilter(filter.criteria)}
                           className="text-sm text-content-primary hover:text-brand-terracotta"
                        >
                          {filter.filterName}
                        </button>
                        <button
                          onClick={() => removeFilter(filter.id)}
                           className="text-content-secondary hover:text-brand-clay"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {hasSearched && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {properties.length} propiedades encontradas
                </h2>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" />
              </div>
            )}

            {!loading && hasSearched && properties.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border-subtle p-12 text-center">
                <p className="text-content-secondary">No se encontraron propiedades con estos filtros.</p>
                <p className="mt-2 text-sm text-content-secondary">
                  Intentá ampliar los criterios de búsqueda.
                </p>
              </div>
            )}

            {!loading && properties.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isTop={false}
                    dragOffset={{ x: 0, y: 0 }}
                    isDragging={false}
                  />
                ))}
              </div>
            )}

            {!hasSearched && (
              <div className="rounded-2xl border border-dashed border-border-subtle p-12 text-center">
                <p className="text-content-secondary">
                  Usá los filtros para buscar propiedades.
                </p>
                <p className="mt-2 text-sm text-content-secondary">
                  Podés filtrar por tipo, precio, ubicación y más.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
           <div className="w-80 rounded-2xl bg-card p-6">
             <h3 className="mb-4 text-lg font-semibold text-content-primary">Guardar búsqueda</h3>
             <input
               type="text"
               placeholder="Nombre de la búsqueda"
               value={newFilterName}
               onChange={(e) => setNewFilterName(e.target.value)}
               className="mb-4 w-full rounded-lg bg-app px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary"
            />
            <div className="flex gap-2">
               <button
                 onClick={() => setShowSaveDialog(false)}
                 className="flex-1 rounded-lg bg-app border border-border-subtle py-2 text-sm text-content-primary hover:bg-border-chip"
               >
                 Cancelar
               </button>
               <button
                 onClick={handleSaveFilter}
                 className="flex-1 rounded-lg bg-card border border-border-subtle py-2 text-sm font-medium text-content-primary hover:bg-app"
               >
                 Guardar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
