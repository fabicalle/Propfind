'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { FilterCriteria, Property } from '@/store/useAppStore';
import { csrfFetch } from '@/lib/security/csrfClient';
import { useFilterStore } from '@/store/useFilterStore';
import { PropertyCard } from '@/components/PropertyCard';
import { SwipeDeck } from '@/components/SwipeDeck';
import PropertyDetailModal from '@/components/PropertyDetailModal';
import { FilterPanel } from '@/components/FilterPanel';
import { LocationFilter, type LocationFilterValue } from '@/features/properties/components/LocationFilter';
import { loadFiltersLocally } from '@/lib/persistence/filterPersistence';
import { getProvinceById, getProvinceBbox, findDepartmentById, LOCATIONS, DEFAULT_DEPARTMENT_ID, type LocationDepartment, type LocationZone } from '@/shared/data/locations';
import { motion } from 'framer-motion';
import { motionTokens } from '@/lib/motion/tokens';
import { Suspense } from 'react';
import { useSwipeStore } from '@/store/useSwipeStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGeoIP } from '@/features/properties/hooks/useGeoIP';

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

function PropertiesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setActiveFilter } = useFilterStore();
  const { departmentId: geoDepartmentId, departmentName: geoDepartmentName, city: geoCity, region: geoRegion, loading: geoLoading, lat: geoLat, lng: geoLng } = useGeoIP();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [locationValue, setLocationValue] = useState<LocationFilterValue>(() => {
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
        const currentProvinceId = provinceId || 'mendoza';
        const province = getProvinceById(currentProvinceId);
        const found = province?.departments.find(
          (d) => d.name.toLowerCase() === departmentParam.toLowerCase()
        );
        if (found) departmentId = found.id;
      }

      if (departmentId && zoneParam) {
        const currentProvinceId = provinceId || 'mendoza';
        const province = getProvinceById(currentProvinceId);
        const dept = province?.departments.find((d) => d.id === departmentId);
        const foundZone = dept?.zones.find((z) => z.name.toLowerCase() === zoneParam.toLowerCase());
        if (foundZone) zoneId = foundZone.id;
      }

      return { departmentId, zoneId, provinceId };
    }

    return {
      departmentId: null,
      zoneId: null,
      provinceId: null,
    };
  });

  useEffect(() => {
    if (locationValue.departmentId || locationValue.zoneId || locationValue.provinceId) return;
    if (!geoDepartmentId && !geoRegion) return;

    setLocationValue((current) => {
      if (current.departmentId || current.zoneId || current.provinceId) return current;
      const provinceId = geoRegion ? LOCATIONS.find((p) => p.name.toLowerCase() === geoRegion.toLowerCase())?.id ?? null : null;
      const departmentId = geoDepartmentId && geoDepartmentId !== 'all' ? geoDepartmentId : null;
      return { departmentId, zoneId: null, provinceId };
    });
  }, [geoDepartmentId, geoRegion, locationValue]);

  const locationQuery = searchParams.get('location')?.toLowerCase() || '';
  const locationDisplay = searchParams.get('location') || '';
  const provinceQuery = searchParams.get('provincia') || '';

  const getBboxForLocation = useCallback((): { south: number; west: number; north: number; east: number } | undefined => {
    if (locationValue.zoneId && locationValue.departmentId) {
      const dept = findDepartmentById(locationValue.departmentId);
      const zone = dept?.zones.find((z) => z.id === locationValue.zoneId);
      if (zone?.bbox) return zone.bbox;
    }

    if (locationValue.departmentId) {
      const dept = findDepartmentById(locationValue.departmentId);
      if (dept?.bbox) return dept.bbox;
    }

    if (locationValue.provinceId) {
      const provinceBbox = getProvinceBbox(locationValue.provinceId);
      if (provinceBbox) return provinceBbox;
    }

    if (!locationValue.departmentId && !locationValue.zoneId && !locationValue.provinceId && geoLat != null && geoLng != null) {
      const radiusKm = 50;
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((geoLat * Math.PI) / 180));
      return {
        south: geoLat - latDelta,
        west: geoLng - lngDelta,
        north: geoLat + latDelta,
        east: geoLng + lngDelta,
      };
    }

    if (!locationValue.departmentId && !locationValue.zoneId && !locationValue.provinceId && geoDepartmentId && geoDepartmentId !== 'all') {
      const dept = findDepartmentById(geoDepartmentId);
      if (dept?.bbox) return dept.bbox;
    }

    if (!locationValue.departmentId && !locationValue.zoneId && !locationValue.provinceId && geoRegion) {
      const province = LOCATIONS.find(
        (p) => p.name.toLowerCase() === geoRegion.toLowerCase()
      );
      if (province) {
        const provinceBbox = getProvinceBbox(province.id);
        if (provinceBbox) return provinceBbox;
      }
    }

    if (!locationValue.departmentId && !locationValue.zoneId && !locationValue.provinceId) {
      const defaultProvince = getProvinceById('mendoza');
      const defaultBbox = getProvinceBbox('mendoza') ?? defaultProvince?.departments.find((d) => d.id === DEFAULT_DEPARTMENT_ID)?.bbox;
      if (defaultBbox) {
        return defaultBbox;
      }
    }

    return undefined;
  }, [locationValue, geoDepartmentId, geoRegion, geoLat, geoLng]);

  const searchBbox = useMemo(() => getBboxForLocation(), [getBboxForLocation]);

  const [localFilter, setLocalFilter] = useState<FilterCriteria>(() => {
    if (locationQuery) {
      return {};
    }
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

      const body: Record<string, unknown> = {
        filters,
        excludeIds: discardedIds,
        limit: 50,
      };

      if (searchBbox) {
        body.bbox = searchBbox;
      }

      if (!searchBbox && !locationQuery && !provinceQuery) {
        setProperties([]);
        setSearchError('Seleccioná una ubicación o permití el acceso a tu ubicación para ver propiedades.');
        return;
      }

      const response = await csrfFetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        const items = result.data?.properties || [];
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
       console.error('searchProperties error', error);
     } finally {
       setLoading(false);
     }
  }, [loading, localFilter, viewMode]);

  const searchPropertiesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    searchPropertiesRef.current = searchProperties;
  }, [searchProperties]);

  useEffect(() => {
    searchPropertiesRef.current?.();
  }, [searchBbox]);

  const handleClearSearch = useCallback(() => {
    router.push('/properties');
  }, [router]);

  const handleClearFilters = useCallback(() => {
    setLocalFilter({});
    setActiveFilter({});
    setLocationValue((current) => {
      const next = { departmentId: null as string | null, zoneId: null as string | null, provinceId: null as string | null };
      if (current.provinceId) next.provinceId = current.provinceId;
      else if (geoRegion) next.provinceId = LOCATIONS.find((p) => p.name.toLowerCase() === geoRegion.toLowerCase())?.id ?? null;
      if (!next.provinceId && geoDepartmentId && geoDepartmentId !== 'all') next.departmentId = geoDepartmentId;
      return next;
    });
    setIsFilterOpen(false);
  }, [setActiveFilter, geoRegion, geoDepartmentId]);

  const handleSelectProperty = useCallback((property: Property) => {
    setSelectedProperty(property);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedProperty(null);
  }, []);

  const filteredProperties = useMemo(() => {
    let result = properties;

    if (locationQuery) {
      const q = locationQuery.toLowerCase();
      const exactDepartmentId = (() => {
        for (const province of LOCATIONS) {
          for (const department of province.departments) {
            const terms = [department.name.toLowerCase(), ...(department.aliases || []).map((a) => a.toLowerCase())];
            if (terms.some((term) => term === q)) {
              return department.id;
            }
          }
        }
        return undefined;
      })();

      if (exactDepartmentId) {
        const exactMatches = result.filter((p) => p.departmentId === exactDepartmentId);
        if (exactMatches.length > 0) {
          result = exactMatches;
        } else {
          result = result.filter((p) => {
            const searchable = [
              p.neighborhood,
              p.city,
              p.address,
              p.title,
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase();

            return searchable.includes(q);
          });
        }
      } else {
        result = result.filter((p) => {
          const searchable = [
            p.neighborhood,
            p.city,
            p.address,
            p.title,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchable.includes(q);
        });
      }
    }

    if (provinceQuery) {
      const normalizedProvince = provinceQuery.toLowerCase();
      const province = LOCATIONS.find(
        (p) => p.name.toLowerCase() === normalizedProvince
      );
      if (province) {
        const departmentIds = new Set(province.departments.map((d) => d.id));
        result = result.filter((p) => {
          if (p.departmentId && departmentIds.has(p.departmentId)) return true;
          const cityText = (p.city || '').toLowerCase();
          const addressText = (p.address || '').toLowerCase();
          return province.departments.some((d) => {
            const terms = [d.name.toLowerCase(), ...(d.aliases || []).map((a) => a.toLowerCase())];
            return terms.some((term) => cityText.includes(term) || addressText.includes(term));
          });
        });
      }
    }

    if (!locationValue.departmentId && !locationValue.zoneId) {
      return result;
    }

    const province = getProvinceById('mendoza');
    const selectedDept: LocationDepartment | null = locationValue.departmentId
      ? province?.departments.find((d) => d.id === locationValue.departmentId) ?? null
      : null;

    if (!selectedDept) return result;

    const selectedZone: LocationZone | null = locationValue.zoneId
      ? selectedDept.zones.find((z) => z.id === locationValue.zoneId) ?? null
      : null;

    const departmentTerms = [
      selectedDept.name.toLowerCase(),
      ...(selectedDept.aliases || []).map((a) => a.toLowerCase()),
    ];

    return result.filter((p) => {
      if (p.departmentId) {
        if (p.departmentId !== selectedDept.id) return false;
        if (!selectedZone) return true;
        if (p.localityId && p.localityId !== selectedZone.id) return false;
        return true;
      }

      const cityText = (p.city || '').toLowerCase();
      const neighborhoodText = (p.neighborhood || '').toLowerCase();
      const addressText = (p.address || '').toLowerCase();

      const cityMatch = departmentTerms.some((term) => cityText === term || cityText.includes(term) || neighborhoodText.includes(term) || addressText.includes(term));
      if (!cityMatch) return false;

      if (!selectedZone) return true;

      const zoneName = selectedZone.name.toLowerCase();
      return neighborhoodText === zoneName || neighborhoodText.includes(zoneName) || addressText.includes(zoneName);
    });
  }, [properties, locationValue, locationQuery, provinceQuery]);

  useEffect(() => {
    if (viewMode === 'swipe' && filteredProperties.length > 0) {
      useSwipeStore.setState({
        currentProperty: filteredProperties[0],
        swipeQueue: filteredProperties.slice(1),
      });
    }
  }, [viewMode, filteredProperties]);

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
    ].filter(Boolean).length;
  }, [localFilter]);

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
            <LocationFilter
              value={locationValue}
              onChange={setLocationValue}
              defaultProvinceId={geoRegion ? LOCATIONS.find((p) => p.name.toLowerCase() === geoRegion.toLowerCase())?.id ?? null : null}
            />
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
        {(localFilter.listingType || localFilter.listingSubType || localFilter.propertyTypes?.length || localFilter.amenities?.length || localFilter.currency || localFilter.parking || localFilter.sellerType || locationValue.departmentId || locationValue.zoneId) && (
          <motion.div
            className="mb-6 flex flex-wrap items-center gap-2"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {locationValue.departmentId && (() => {
              const province = getProvinceById('mendoza');
              const dept = province?.departments.find((d) => d.id === locationValue.departmentId);
              return dept ? (
                <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                  📍 {dept.name}
                </span>
              ) : null;
            })()}
            {locationValue.zoneId && (() => {
              const province = getProvinceById('mendoza');
              const dept = province?.departments.find((d) => d.id === locationValue.departmentId);
              const zone = dept?.zones.find((z) => z.id === locationValue.zoneId);
              return zone ? (
                <span className="rounded-full bg-border-chip px-3 py-1 text-xs text-content-primary">
                  {zone.name}
                </span>
              ) : null;
            })()}
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
                onClick={searchProperties}
                className="mt-3 rounded-lg bg-brand-terracotta px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && !searchError && hasSearched && filteredProperties.length === 0 && (
           <div className="rounded-2xl border border-dashed border-border-subtle p-12 text-center">
             {locationQuery ? (
               <>
                  <p className="text-content-primary">No encontramos propiedades que coincidan con ‘{locationQuery}’.</p>
                 <button
                   onClick={handleClearSearch}
                   className="mt-4 rounded-lg bg-brand-olive px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                 >
                   Limpiar búsqueda y ver todas
                 </button>
               </>
             ) : (
               <>
                 <p className="text-content-secondary">No se encontraron propiedades con estos filtros.</p>
                 <p className="mt-2 text-sm text-content-secondary">Intentá ampliar los criterios de búsqueda.</p>
               </>
             )}
           </div>
         )}

         {!loading && filteredProperties.length > 0 && (
           viewMode === 'grid' ? (
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
               {filteredProperties.map((property, index) => {
                 const isFav = useFavoritesStore.getState().isFavorite(property.id);
                 return (
                   <motion.div
                     key={property.id}
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     transition={{ ...motionTokens.spring.gentle, delay: index * 0.05 }}
                   >
                  <PropertyCard
                    property={property}
                    isTop={false}
                    dragOffset={{ x: 0, y: 0 }}
                    isDragging={false}
                    variant="grid"
                    isFavorite={isFav}
                    onToggleFavorite={(property) => {
                      if (isFav) {
                        useFavoritesStore.getState().removeFavorite(property.id);
                      } else {
                        useFavoritesStore.getState().addFavorite(property);
                      }
                    }}
                    onReject={(property) => {
                      useFavoritesStore.getState().discard(property);
                      setProperties((prev) => prev.filter((p) => p.id !== property.id));
                    }}
                    onSelectProperty={handleSelectProperty}
                  />
                   </motion.div>
                 );
               })}
             </div>
           ) : (
             <div className="flex justify-center">
               <SwipeDeck initialProperties={filteredProperties} />
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
          searchProperties();
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
