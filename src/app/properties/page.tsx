'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { FilterCriteria, Property } from '@/store/useAppStore';
import { csrfFetch } from '@/lib/security/csrfClient';
import { useFilterStore } from '@/store/useFilterStore';
import { PropertyCard } from '@/components/PropertyCard';
import { SwipeDeck } from '@/components/SwipeDeck';
import PropertyDetailModal from '@/components/PropertyDetailModal';
import { FilterPanel } from '@/components/FilterPanel';
import { MainSearchBar } from '@/features/search/components/MainSearchBar';
import { loadFiltersLocally } from '@/lib/persistence/filterPersistence';
import { findDepartmentById, LOCATIONS } from '@/shared/data/locations';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { Suspense } from 'react';
import { useSwipeStore } from '@/store/useSwipeStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useSearchParams } from 'next/navigation';
import { useGeoIP } from '@/features/properties/hooks/useGeoIP';
import { OperationType } from '@/types/search';
import { useSwipeDeckSync } from '@/hooks/useSwipeDeckSync';

const DEFAULT_FILTER: FilterCriteria = {
  propertyTypes: [],
  rooms: [],
  bedrooms: [],
  bathrooms: undefined,
  amenities: [],
  priceMin: undefined,
  priceMax: undefined,
  areaMin: undefined,
  areaMax: undefined,
  sellerType: undefined,
};

interface PagedResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function PropertiesPageInner() {
  const searchParams = useSearchParams();
  const { setActiveFilter } = useFilterStore();
  const { departmentId: geoDepartmentId, city: geoCity, region: geoRegion, lat: geoLat, lng: geoLng } = useGeoIP();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [locationValue, setLocationValue] = useState<{ departmentId: string | null; zoneId: string | null; provinceId?: string | null }>({
    departmentId: null,
    zoneId: null,
    provinceId: null,
  });
  const hasInitializedFromUrlRef = useRef(false);
  const favorites = useFavoritesStore((state) => state.favorites);
  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.property.id)),
    [favorites]
  );

  const [locationQueryParam, setLocationQueryParam] = useState<string | null>(null);

  const [isUrlParamsReady, setIsUrlParamsReady] = useState(false);

  const urlLocation = searchParams?.get('location') ?? null;

  useEffect(() => {
    setLocationQueryParam(urlLocation);
  }, [urlLocation]);

  useEffect(() => {
    const departmentParam = searchParams?.get('departamento');
    const zoneParam = searchParams?.get('zona');
    const provinceParam = searchParams?.get('provincia');

    if (!departmentParam && !zoneParam && !provinceParam && !urlLocation) {
      hasInitializedFromUrlRef.current = true;
      setIsUrlParamsReady(true);
      return;
    }

    hasInitializedFromUrlRef.current = true;
    setIsUrlParamsReady(true);
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
      const province = provinceId
        ? LOCATIONS.find((p) => p.departments.some((d) => d.id === departmentParam))
        : LOCATIONS.find((p) =>
            p.departments.some(
              (d) =>
                d.name.toLowerCase() === departmentParam.toLowerCase() ||
                (d.aliases || []).some((a) => a.toLowerCase() === departmentParam.toLowerCase())
            )
          );
      const found = province?.departments.find(
        (d) =>
          d.name.toLowerCase() === departmentParam.toLowerCase() ||
          (d.aliases || []).some((a) => a.toLowerCase() === departmentParam.toLowerCase())
      );
      if (found) {
        departmentId = found.id;
        if (!provinceId && province) provinceId = province.id;
      }
    }

    if (departmentId && zoneParam) {
      const province = provinceId
        ? LOCATIONS.find((p) => p.id === provinceId)
        : (departmentId ? LOCATIONS.find((p) => p.departments.some((d) => d.id === departmentId)) : null);
      const dept = province?.departments.find((d) => d.id === departmentId);
      const foundZone = dept?.zones.find((z) => z.name.toLowerCase() === zoneParam.toLowerCase());
      if (foundZone) zoneId = foundZone.id;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocationValue({ departmentId, zoneId, provinceId });
  }, [searchParams, urlLocation]);

  const [operationType, setOperationType] = useState<OperationType | undefined>(undefined);

  useEffect(() => {
    if (locationValue.departmentId || locationValue.zoneId || locationValue.provinceId) return;
    if (!geoDepartmentId && !geoRegion) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocationValue((current) => {
      if (current.departmentId || current.zoneId || current.provinceId) return current;
      const provinceId = geoRegion
        ? LOCATIONS.find((p) => p.name.toLowerCase() === geoRegion.toLowerCase())?.id ?? null
        : null;
      const departmentId =
        geoDepartmentId && geoDepartmentId !== 'all' ? geoDepartmentId : null;
      return { departmentId, zoneId: null, provinceId };
    });
   }, [geoDepartmentId, geoRegion, locationValue.departmentId, locationValue.zoneId, locationValue.provinceId]);

  const selectedDepartment = locationValue.departmentId;
  const deptName = selectedDepartment ? findDepartmentById(selectedDepartment)?.name ?? null : null;
  const locationDisplay = deptName ?? geoCity ?? geoRegion ?? '';

  const getLocationQuery = useCallback((): string | undefined => {
    if (locationValue.departmentId) {
      const dept = findDepartmentById(locationValue.departmentId);
      return dept?.name;
    }
    if (locationValue.provinceId) {
      const province = LOCATIONS.find((p) => p.id === locationValue.provinceId);
      return province?.name;
    }
    return undefined;
  }, [locationValue]);

  const getLocalityIds = useCallback((): string[] | undefined => {
    if (locationValue.departmentId) {
      const dept = findDepartmentById(locationValue.departmentId);
      if (!dept) return undefined;
      const ids: string[] = [dept.id];
      ids.push(...dept.zones.map((z) => z.id));
      return ids;
    }
    if (locationValue.provinceId) {
      const province = LOCATIONS.find((p) => p.id === locationValue.provinceId);
      if (!province) return undefined;
      const ids: string[] = [];
      for (const dept of province.departments) {
        ids.push(dept.id);
        ids.push(...dept.zones.map((z) => z.id));
      }
      return ids;
    }
    return undefined;
  }, [locationValue]);

  const [localFilter, setLocalFilter] = useState<FilterCriteria>(() => {
    const saved = loadFiltersLocally<FilterCriteria>();
    if (saved && Object.keys(saved).length > 0) {
      setActiveFilter(saved);
      return saved;
    }
    return DEFAULT_FILTER;
  });

  const searchProperties = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setHasSearched(true);

    try {
      const filters: Record<string, unknown> = {};
      if (localFilter.listingType) filters.listingType = localFilter.listingType;
      if (localFilter.listingSubType) filters.listingSubType = localFilter.listingSubType;
      if (localFilter.propertyTypes?.length) filters.propertyTypes = localFilter.propertyTypes;
      if (localFilter.rooms?.length) filters.rooms = localFilter.rooms;
      if (localFilter.bedrooms?.length) filters.bedrooms = localFilter.bedrooms;
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
      if (localFilter.currency) filters.currency = localFilter.currency;
      if (localFilter.creditApproved !== undefined) filters.creditApproved = localFilter.creditApproved;
      if (localFilter.parking) filters.parking = localFilter.parking;
      if (localFilter.sellerType) filters.sellerType = localFilter.sellerType;

      const discardedIds = useFavoritesStore.getState().discarded.map((d) => d.property.id);

      const locationQuery = getLocationQuery();
      const textLocationQuery = locationQueryParam;

      const body: Record<string, unknown> = {
        filters,
        excludeIds: discardedIds,
        limit: 50,
        operationType: operationType,
      };

      if (locationQuery) {
        body.locationQuery = locationQuery;
      } else if (textLocationQuery) {
        body.locationQuery = textLocationQuery;
      }

      const localityIds = getLocalityIds();
      if (localityIds && localityIds.length > 0) {
        body.localityIds = localityIds;
      }

      if (!locationQuery && !textLocationQuery && !localityIds && geoLat != null && geoLng != null) {
        body.lat = geoLat;
        body.lng = geoLng;
      }

      const response = await csrfFetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const paged = result.data as PagedResponse;
        const items = paged.properties || [];
        setProperties(items);
        setSearchError(null);
        if (viewMode === 'swipe' && items.length > 0) {
          useSwipeStore.setState({
            currentProperty: items[0],
            swipeQueue: items.slice(1),
          });
        }
      } else {
        const result = await response.json().catch(() => ({}));
        const apiError = (result as Record<string, unknown>).error;
        const message =
          apiError &&
          typeof apiError === 'object' &&
          apiError !== null &&
          'message' in apiError &&
          typeof (apiError as Record<string, unknown>).message === 'string'
            ? (apiError as Record<string, unknown>).message
            : 'Error al buscar propiedades';
        setSearchError(String(message));
      }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado al buscar propiedades';
        setSearchError(message);
      } finally {
      setLoading(false);
    }
  }, [loading, localFilter, viewMode, operationType, getLocationQuery, getLocalityIds, geoLat, geoLng, locationQueryParam]);

  const searchPropertiesRef = useRef<(() => void) | null>(null);
  const lastSearchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    searchPropertiesRef.current = searchProperties;
  }, [searchProperties]);

   useEffect(() => {
    if (!isUrlParamsReady) return;
    const searchKey = `${operationType ?? 'ALL'}|${getLocationQuery() ?? ''}|${locationQueryParam ?? ''}|${JSON.stringify(getLocalityIds() ?? [])}|${geoLat ?? ''}|${geoLng ?? ''}|${JSON.stringify(localFilter)}`;
    if (lastSearchKeyRef.current === searchKey) return;
    lastSearchKeyRef.current = searchKey;
    searchPropertiesRef.current?.();
  }, [operationType, getLocationQuery, getLocalityIds, geoLat, geoLng, localFilter, locationQueryParam, isUrlParamsReady]);

  const handleClearFilters = useCallback(() => {
    setLocalFilter({});
    setActiveFilter({});
    setLocationValue({ departmentId: null, zoneId: null, provinceId: null });
    setLocationQueryParam(null);
    setOperationType(undefined);
    setIsFilterOpen(false);
  }, [setActiveFilter]);

  const handleSelectProperty = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  const handleToggleFavorite = useCallback((property: Property) => {
    useFavoritesStore.getState().toggleFavorite(property);
  }, []);

  const handleReject = useCallback((property: Property) => {
    useFavoritesStore.getState().discard(property);
    setProperties((prev) => prev.filter((p) => p.id !== property.id));
  }, []);

  const activeFilterCount = useMemo(() => {
    return [
      localFilter.listingType,
      localFilter.listingSubType,
      localFilter.propertyTypes?.length ? true : false,
      localFilter.rooms?.length ? true : false,
      localFilter.bedrooms?.length ? true : false,
      localFilter.bathrooms,
      localFilter.amenities?.length ? true : false,
      localFilter.priceMin || localFilter.priceMax,
      localFilter.currency,
      localFilter.creditApproved,
      localFilter.parking,
      localFilter.sellerType,
      operationType,
    ].filter(Boolean).length;
  }, [localFilter, operationType]);

  const displayedProperties = properties;

  useSwipeDeckSync(displayedProperties, viewMode);

  return (
    <div className="min-h-screen bg-app text-content-primary pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <motion.div
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={motionTokens.spring.gentle}
        >
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Propiedades</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-card border border-border-subtle p-1">
              <button
                onClick={() => setOperationType(undefined)}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  !operationType
                    ? 'bg-brand-olive text-white'
                    : 'text-content-secondary hover:bg-app'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setOperationType('RENT')}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  operationType === 'RENT'
                    ? 'bg-brand-olive text-white'
                    : 'text-content-secondary hover:bg-app'
                }`}
              >
                Alquiler
              </button>
              <button
                onClick={() => setOperationType('SALE')}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  operationType === 'SALE'
                    ? 'bg-brand-olive text-white'
                    : 'text-content-secondary hover:bg-app'
                }`}
              >
                Venta
              </button>
            </div>
            <div className="flex-1 min-w-[240px]">
              <MainSearchBar placeholder="Buscar por ciudad, provincia, departamento o zona..." />
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="relative flex items-center gap-1.5 rounded-lg bg-brand-terracotta px-3 py-2 text-xs sm:text-sm font-semibold text-white transition-colors hover:brightness-110 active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>

              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-olive text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-brand-olive text-white'
                    : 'bg-card border border-border-subtle text-content-secondary hover:bg-app'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('swipe')}
                className={`rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                  viewMode === 'swipe'
                    ? 'bg-brand-olive text-white'
                    : 'bg-card border border-border-subtle text-content-secondary hover:bg-app'
                }`}
              >
                Swipe
              </button>
            </div>
          </div>
        </motion.div>

        {/* Active Filters */}
        {(localFilter.listingType || localFilter.listingSubType || localFilter.propertyTypes?.length || localFilter.amenities?.length || localFilter.currency || localFilter.parking || localFilter.sellerType || locationValue.departmentId || locationValue.zoneId || operationType) && (
          <motion.div
            className="mb-6 flex flex-wrap items-center gap-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {locationValue.departmentId && (() => {
              const dept = findDepartmentById(locationValue.departmentId);
              return dept ? (
                <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                  📍 {dept.name}
                </span>
              ) : null;
            })()}
            {locationValue.zoneId && (() => {
              const dept = locationValue.departmentId ? findDepartmentById(locationValue.departmentId) : null;
              const zone = dept?.zones.find((z) => z.id === locationValue.zoneId);
              return zone ? (
                <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                  {zone.name}
                </span>
              ) : null;
            })()}
            {operationType === 'RENT' && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                Alquiler
              </span>
            )}
            {operationType === 'SALE' && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                Venta
              </span>
            )}
            {localFilter.listingType && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                {localFilter.listingType === 'rent' ? 'Alquiler' : localFilter.listingType === 'sale' ? 'Venta' : localFilter.listingType}
              </span>
            )}
            {localFilter.listingSubType && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                Temporal
              </span>
            )}
            {localFilter.propertyTypes?.map((type) => (
              <span key={type} className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                {type}
              </span>
            ))}
            {localFilter.amenities?.map((amenity) => (
              <span key={amenity} className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                {amenity}
              </span>
            ))}
            {localFilter.currency && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                {localFilter.currency}
              </span>
            )}
            {localFilter.parking && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                Cocheras: {localFilter.parking}
              </span>
            )}
            {localFilter.sellerType && (
              <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                {localFilter.sellerType === 'OWNER' ? 'Dueño directo' : 'Inmobiliaria'}
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="rounded-lg border border-border-subtle bg-card px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-app hover:text-content-primary"
            >
              Limpiar filtros
            </button>
          </motion.div>
        )}

        {/* Results */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" />
          </div>
        )}

        {!loading && searchError && (
          <div className="rounded-2xl border border-brand-clay/40 bg-brand-clay/10 p-6 text-center">
            <p className="text-sm font-medium text-brand-clay">{searchError}</p>
            <button
              onClick={() => searchPropertiesRef.current?.()}
              className="mt-3 rounded-lg bg-brand-terracotta px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !searchError && hasSearched && displayedProperties.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border-subtle p-12 text-center">
            <p className="text-content-secondary">No se encontraron propiedades con estos filtros.</p>
            <p className="mt-2 text-sm text-content-secondary">Intentá ampliar los criterios de búsqueda.</p>
          </div>
        )}

        {!loading && displayedProperties.length > 0 && (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {displayedProperties.map((property) => {
                const isFav = favoriteIds.has(property.id);
                return (
                  <motion.div
                    key={property.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ ...motionTokens.spring.gentle, delay: 0 }}
                  >
                    <PropertyCard
                      property={property}
                      isTop={false}
                      dragOffset={{ x: 0, y: 0 }}
                      isDragging={false}
                      variant="grid"
                      isFavorite={isFav}
                      onToggleFavorite={handleToggleFavorite}
                      onReject={handleReject}
                      onSelectProperty={handleSelectProperty}
                    />
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="flex justify-center">
              <SwipeDeck initialProperties={displayedProperties} />
            </div>
          )
        )}
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filter={localFilter}
        onFilterChange={setLocalFilter}
        onApply={() => {
          searchPropertiesRef.current?.();
          setIsFilterOpen(false);
        }}
        locationQuery={locationDisplay}
      />

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-12 w-12 animate-spin rounded-full border-4 border-border-subtle border-t-content-primary" /></div>}>
      <PropertiesPageInner />
    </Suspense>
  );
}
