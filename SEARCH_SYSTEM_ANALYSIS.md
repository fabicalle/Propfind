/**
 * SEARCH SYSTEM — Consolidated end-to-end logic
 * 
 * Flow: MainSearchBar → router.push → URL params → useEffect → searchKey → 
 *       searchProperties() → csrfFetch('/api/properties/search') → 
 *       SearchPropertiesUseCase → PrismaRepository.search() / MockRepository.search()
 * 
 * Issues found & fixed:
 * 1. hasInitializedFromUrlRef blocked URL re-parse on MainSearchBar navigation
 * 2. SQL injection (string interpolation in Prisma IN clauses)
 * 3. locationQueryParam race condition (dual effect)
 * 4. Catch block silently swallowed errors (search appeared to "do nothing"
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchPropertiesUseCase } from '@/application/use-cases/propertyUseCases';
import { useGeoIP } from '@/features/properties/hooks/useGeoIP';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { csrfFetch } from '@/lib/security/csrfClient';

// ==============================================================================
// TYPES
// ==============================================================================

type OperationType = 'RENT' | 'SALE';

interface SearchParams {
  query?: string;
  locationQuery?: string;
  localityIds?: string[];
  lat?: number;
  lng?: number;
  radiusKm?: number;
  operationType?: OperationType;
  page?: number;
  limit?: number;
  excludeIds?: string[];
  filters?: PropertySearchFilters;
}

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==============================================================================
// HOOK: useGeoIP — IP-based location detection
// File: src/features/properties/hooks/useGeoIP.ts
// ==============================================================================

interface GeoIPResult {
  provinceId: string | null;
  departmentId: string | null;  // 'all' if not matched to a department
  departmentName: string | null;
  city?: string;
  region?: string;
  lat?: number;
  lng?: number;
}

function useGeoIP() {
  const [result, setResult] = useState<GeoIPResult>({
    provinceId: null, departmentId: null, departmentName: null,
  });
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  const detect = useCallback(async () => {
    if (initializedRef.current) return;  // Only runs once per component instance
    initializedRef.current = true;
    setLoading(true);

    // Tries ipapi.co → ip-api.com → fallback to Mendoza coords
    // Mendoza detection: region.toLowerCase().includes('mendoza')
    //   → provinceId = 'mendoza'
    //   → department matched by city name vs department names
    //   → if no match: departmentId = DEFAULT_DEPARTMENT_ID = 'all'

    const payload = {
      provinceId, departmentId, departmentName, city, region, lat, lng,
    };
    setResult(payload);
    sessionStorage.setItem('geoip_cache', JSON.stringify(payload));
  }, []);

  useEffect(() => { detect(); }, [detect]);
  return { ...result, loading, error };
}

// ==============================================================================
// COMPONENT: MainSearchBar — Search input UI
// File: src/features/search/components/MainSearchBar.tsx
// ==============================================================================

function MainSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { departmentId: geoDeptId, departmentName, city: geoCity, region } = useGeoIP();

  const handleInputChange = (value) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      setSuggestions(searchLocations(value));  // Static LOCATIONS data search
      setIsOpen(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0 && activeIndex >= 0) {
      // SUGGESTION selected → navigates with hierarchy params
      // e.g. /properties?departamento=Mendoza or /properties?provincia=Buenos Aires
      // OR /properties?departamento=CABA&zona=Palermo
      navigateToResults(suggestions[activeIndex]);
    } else if (query.trim()) {
      // FREE TEXT → navigates with ?location= query param
      // e.g. /properties?location=mendoza
      router.push(`/properties?location=${encodeURIComponent(query.trim())}`);
      setQuery('');
    } else if (!query.trim() && departmentName) {
      // EMPTY query + geo IP data → navigates with geo params
      // BUG: if departmentId === 'all' AND region/city are both "Mendoza"
      // → produces /properties?provincia=Mendoza&zona=Mendoza
      // → 404 because 'provincia' param isn't handled properly
      const params = new URLSearchParams();
      if (geoDeptId && geoDeptId !== 'all') {
        params.set('departamento', departmentName);
      } else if (region) {
        params.set('provincia', region);
      }
      if (geoCity) {
        params.set('zona', geoCity);
      }
      router.push(`/properties?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={query} onChange={(e) => handleInputChange(e.target.value)} onKeyDown={handleKeyDown} />
      <button type="submit" />
      {isOpen && suggestions.length > 0 && <ul>{suggestions.map(...)}</ul>}
    </form>
  );
}

// ==============================================================================
// COMPONENT: PropertiesPage — Search orchestration
// File: src/app/properties/page.tsx
// ==============================================================================

function PropertiesPageInner() {
  const searchParams = useSearchParams();
  const { departmentId: geoDepartmentId, city: geoCity, region: geoRegion, lat: geoLat, lng: geoLng } = useGeoIP();

  // STATE
  const [locationQueryParam, setLocationQueryParam] = useState(null);
  const [locationValue, setLocationValue] = useState({ departmentId: null, zoneId: null, provinceId: null });
  const [localFilter, setLocalFilter] = useState(DEFAULT_FILTER);
  const [operationType, setOperationType] = useState(undefined);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isUrlParamsReady, setIsUrlParamsReady] = useState(false);

  // --- URL param → locationQueryParam (always runs) ---
  const urlLocation = searchParams?.get('location') ?? null;
  useEffect(() => {
    setLocationQueryParam(urlLocation);
  }, [urlLocation]);

  // --- URL param → locationValue (FIXED: no hasInitializedFromUrlRef guard) ---
  // Previously had `if (hasInitializedFromUrlRef.current) return;` which blocked
  // re-parsing on MainSearchBar navigation (router.push)
  useEffect(() => {
    const departmentParam = searchParams?.get('departamento');
    const zoneParam = searchParams?.get('zona');
    const provinceParam = searchParams?.get('provincia');

    if (!departmentParam && !zoneParam && !provinceParam && !urlLocation) {
      setIsUrlParamsReady(true);
      return;
    }

    setIsUrlParamsReady(true);
    let departmentId = null, zoneId = null, provinceId = null;

    // Parse provincia param → provinceId
    if (provinceParam) {
      const foundProvince = LOCATIONS.find(p => p.name.toLowerCase() === provinceParam.toLowerCase());
      if (foundProvince) provinceId = foundProvince.id;
    }

    // Parse departamento param → departmentId (by name or alias)
    if (departmentParam) {
      const found = LOCATIONS.flatMap(p => p.departments).find(d =>
        d.name.toLowerCase() === departmentParam.toLowerCase() ||
        d.aliases?.some(a => a.toLowerCase() === departmentParam.toLowerCase())
      );
      if (found) {
        departmentId = found.id;
        // Find parent province
        const province = LOCATIONS.find(p => p.departments.some(d => d.id === found.id));
        if (province) provinceId = provinceId ?? province.id;
      }
    }

    // Parse zona param → zoneId (within department context)
    if (departmentId && zoneParam) {
      const province = LOCATIONS.find(p => p.id === provinceId) ?? LOCATIONS.find(p => p.departments.some(d => d.id === departmentId));
      const dept = province?.departments.find(d => d.id === departmentId);
      const foundZone = dept?.zones.find(z => z.name.toLowerCase() === zoneParam.toLowerCase());
      if (foundZone) zoneId = foundZone.id;
    }

    setLocationValue({ departmentId, zoneId, provinceId });
  }, [searchParams, urlLocation]);

  // --- Geo IP fallback for locationValue (fills in if URL params don't set it) ---
  useEffect(() => {
    if (locationValue.departmentId || locationValue.zoneId || locationValue.provinceId) return;
    if (!geoDepartmentId && !geoRegion) return;

    setLocationValue({
      departmentId: geoDepartmentId !== 'all' ? geoDepartmentId : null,
      zoneId: null,
      provinceId: geoRegion ? LOCATIONS.find(p => p.name.toLowerCase() === geoRegion.toLowerCase())?.id ?? null : null,
    });
  }, [geoDepartmentId, geoRegion, locationValue.departmentId, locationValue.zoneId, locationValue.provinceId]);

  // --- DERIVED: Location query strings/IDs ---
  const getLocationQuery = useCallback(() => {
    if (locationValue.departmentId) {
      return findDepartmentById(locationValue.departmentId)?.name;
    }
    if (locationValue.provinceId) {
      return LOCATIONS.find(p => p.id === locationValue.provinceId)?.name;
    }
    return undefined;
  }, [locationValue]);

  const getLocalityIds = useCallback(() => {
    // Level 1: Department level — returns [dept.id, ...zone.ids]
    // Level 2: Province level — returns all dept.ids + all zone.ids
    // These are used for strict hierarchical filtering: p.department_id IN (...) OR p.locality_id IN (...)
  }, [locationValue]);

  // --- SEARCH TRIGGER ---
  const searchPropertiesRef = useRef(null);
  const lastSearchKeyRef = useRef(null);

  // GUARD: Don't search until URL params are parsed
  // (prevents race condition with geo IP state updates)
  useEffect(() => {
    if (!isUrlParamsReady) return;

    const searchKey = `${operationType ?? 'ALL'}|${getLocationQuery() ?? ''}|${locationQueryParam ?? ''}|${JSON.stringify(getLocalityIds() ?? [])}|${geoLat ?? ''}|${geoLng ?? ''}|${JSON.stringify(localFilter)}`;
    
    if (lastSearchKeyRef.current === searchKey) return;  // Dedup
    lastSearchKeyRef.current = searchKey;
    searchPropertiesRef.current?.();
  }, [operationType, getLocationQuery, getLocalityIds, geoLat, geoLng, localFilter, locationQueryParam, isUrlParamsReady]);

  // --- SEARCH EXECUTION ---
  const searchProperties = useCallback(async () => {
    if (loading) return;  // Prevent concurrent searches
    setLoading(true);
    setHasSearched(true);

    try {
      // Build body with priority: locationQuery (from locationValue) > textLocationQuery (from URL ?location=) > geo lat/lng
      const locationQuery = getLocationQuery();
      const textLocationQuery = locationQueryParam;

      const body = {
        filters,
        excludeIds: discardedIds,
        limit: 50,
        operationType,
      };

      // Priority 1: Hierarchical name (e.g. "Mendoza" from locationValue)
      if (locationQuery) {
        body.locationQuery = locationQuery;
      }
      // Priority 2: Free text from URL (?location=mendoza)
      else if (textLocationQuery) {
        body.locationQuery = textLocationQuery;
      }

      // Priority 3: Locality IDs for strict filtering
      const localityIds = getLocalityIds();
      if (localityIds && localityIds.length > 0) {
        body.localityIds = localityIds;
      }

      // Priority 4: Geo IP coords (only if no other location source)
      if (!locationQuery && !textLocationQuery && !localityIds && geoLat && geoLng) {
        body.lat = geoLat;
        body.lng = geoLng;
      }

      // FETCH
      const response = await csrfFetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const paged = (await response.json()).data;
        setProperties(paged.properties || []);
        setSearchError(null);
      } else {
        const result = await response.json().catch(() => ({}));
        setSearchError(result.error?.message || 'Error al buscar propiedades');
      }
    } catch (error) {
      // FIXED: was silently swallowed — "searchbar does nothing" because error was never shown
      const message = error instanceof Error ? error.message : 'Error inesperado al buscar propiedades';
      setSearchError(message);
    } finally {
      setLoading(false);
    }
  }, [loading, localFilter, viewMode, operationType, getLocationQuery, getLocalityIds, geoLat, geoLng, locationQueryParam]);

  // Update ref when searchProperties changes
  useEffect(() => {
    searchPropertiesRef.current = searchProperties;
  }, [searchProperties]);
}

// ==============================================================================
// API ROUTE: POST /api/properties/search (/src/app/api/properties/search/route.ts)
// ==============================================================================

async function POST_impl(request: NextRequest) {
  // 1. Auto-seed (dev only, when USE_MOCK_DATA=false)
  if (AUTO_SEED) {
    const mockCount = await countMockProperties();
    if (mockCount !== 26) {
      await purgeMockProperties();
      await seedMockProperties();
    }
  }

  // 2. Validate input
  const validated = searchSchema.parse(await request.json());

  // 3. GeoIP header fallback for lat/lng
  // FIXED: now checks localityIds length to skip geo injection
  const hasLocationQuery = Boolean(validated.locationQuery) || 
                           Boolean(validated.query) || 
                           (validated.localityIds && validated.localityIds.length > 0);

  const params: SearchParams = {
    query: validated.query,
    locationQuery: validated.locationQuery,
    lat: hasExplicitLocation
      ? validated.lat
      : !hasLocationQuery && Number.isFinite(latFromHeader) ? latFromHeader : undefined,
    lng: hasExplicitLocation
      ? validated.lng
      : !hasLocationQuery && Number.isFinite(lngFromHeader) ? lngFromHeader : undefined,
    // ... rest of params
  };

  // 4. Execute search (with mock fallback on DB error in dev)
  try {
    result = await searchPropertiesUseCase.execute(params, sessionId);
  } catch (searchError) {
    if (env.isDev) {
      const mockRepo = new MockPropertyRepository();
      const fallbackUseCase = new SearchPropertiesUseCase(mockRepo, new MockInteractionRepository());
      result = await fallbackUseCase.execute(params, sessionId);
    } else {
      throw searchError;
    }
  }

  // 5. Enrich with publisher contact info
  const publishers = await prisma.publisherProfile.findMany({...});

  return successResponse({ properties, total, page, limit, hasMore });
}

// ==============================================================================
// REPOSITORY: PrismaPropertyRepository.search()
// File: src/infrastructure/repositories/PrismaRepositories.ts
// ==============================================================================

class PrismaPropertyRepository {
  async search(params: SearchParams): Promise<PagedResult<Property>> {
    const { query, locationQuery, localityIds, lat, lng, radiusKm, operationType, page, limit, excludeIds, filters } = params;

    const effectiveListingType = operationType ?? filters?.listingType;
    // When operationType is undefined (TODOS), no listing_type filter — returns ALL

    const buildQuery = (useGeo: boolean) => {
      const conditions = ['p.is_active = true'];
      const queryParams = [];

      if (effectiveListingType) {
        const dbType = effectiveListingType === 'SALE' ? 'sale' : 'rent';
        conditions.push(`p.listing_type = '${dbType}'`);  // Safe: validated by Zod enum
      }

      // LEVEL 1: Multi-word text search (query parameter)
      // Splits text into words, each word must match across: title, description, address, neighborhood, city, department_id
      const buildTextSearchCondition = (text: string) => {
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return null;
        
        const fields = ['p.title', 'p.description', 'p.address', 'p.neighborhood', 'p.city', 'p.department_id'];
        const wordConditions = [];
        
        for (const word of words) {
          const paramsForWord = [];
          for (let i = 0; i < fields.length; i++) {
            queryParams.push(`%${word}%`);
            paramsForWord.push(queryParams.length);
          }
          // Each word: (title ILIKE '%word%' OR description ILIKE '%word%' OR ...)
          const fieldConditions = fields.map((_, i) => `${fields[i]} ILIKE $${paramsForWord[i]}`);
          wordConditions.push(`(${fieldConditions.join(' OR ')})`);
        }
        // All words must match (AND): (word1_conditions) AND (word2_conditions)
        return `(${wordConditions.join(' AND ')})`;
      };

      const textCond = buildTextSearchCondition(query);
      if (textCond) conditions.push(textCond);

      // LEVEL 2: Location text fallback (only when localityIds is empty)
      if (localityIds.length === 0 && locationQuery) {
        const locCond = buildTextSearchCondition(locationQuery);
        if (locCond) conditions.push(locCond);
      }

      // LEVEL 3: Locality IDs — strict hierarchical filtering (HIGHEST priority)
      // FIXED: Uses IN() with individual scalar params instead of ANY($N::text[]) array
      if (localityIds.length > 0) {
        const placeholders = localityIds.map(id => {
          queryParams.push(id);
          return `$${queryParams.length}`;
        });
        // Matches both department_id and locality_id
        conditions.push(`(p.department_id IN (${placeholders.join(', ')}) OR p.locality_id IN (${placeholders.join(', ')}))`);
      }

      // Filter conditions (all parameterized)
      if (excludeIds.length > 0) {
        const ph = excludeIds.map(id => `$${queryParams.push(id)}`);
        conditions.push(`p.id NOT IN (${ph.join(', ')})`);
      }
      if (filters?.propertyTypes?.length) {
        const ph = filters.propertyTypes.map(t => `$${queryParams.push(t)}`);
        conditions.push(`p.property_type IN (${ph.join(', ')})`);
      }
      if (filters?.priceMin != null) { conditions.push(`p.price >= $${queryParams.push(filters.priceMin)}`); }
      if (filters?.priceMax != null) { conditions.push(`p.price <= $${queryParams.push(filters.priceMax)}`); }
      if (filters?.bedrooms?.length) {
        const ph = filters.bedrooms.map(n => `$${queryParams.push(Number(n))}`);
        conditions.push(`p.bedrooms IN (${ph.join(', ')})`);
      }
      if (filters?.rooms?.length) {
        const ph = filters.rooms.map(n => `$${queryParams.push(Number(n))}`);
        conditions.push(`p.rooms IN (${ph.join(', ')})`);
      }
      if (filters?.bathrooms != null) { conditions.push(`p.bathrooms >= $${queryParams.push(filters.bathrooms)}`); }
      if (filters?.amenities?.length) { conditions.push(`p.amenities::jsonb ?| $${queryParams.push(filters.amenities)}::text[]`); }
      // parking, sellerType, currency, listingSubType — all parameterized
      
      // Geo distance (Haversine)
      if (useGeo && hasGeo && Number.isFinite(lat!) && Number.isFinite(lng!)) {
        queryParams.push(lat, lng, radiusKm);
        conditions.push(`(6371 * acos(...)) <= $${queryParams.length}`);
        distanceExpr = `(6371 * acos(...)) AS distance_km`;
      }

      queryParams.push(limit, offset);
      return { whereClause: conditions.join(' AND '), params: queryParams, distanceExpr };
    };

    // Geo fallback: retry without geo if 0 results
    let { properties, totalCount } = await runQuery(hasGeo);
    if (totalCount === 0 && hasGeo) {
      const fallback = await runQuery(false);
      properties = fallback.properties;
      totalCount = fallback.totalCount;
    }

    return { items: properties, total: totalCount, page, limit, hasMore: page * limit < totalCount };
  }
}

// ==============================================================================
// REPOSITORY: MockPropertyRepository.search()
// File: src/mocks/repositories.ts
// ==============================================================================

class MockPropertyRepository {
  async search(params: SearchParams): Promise<PagedResult<Property>> {
    // Same multi-word matching logic as Prisma but in JavaScript:
    // buildTextSearchMatch splits text into words, each word must match
    // across [p.title, p.description, p.neighborhood, p.city, p.address]

    const buildTextSearchMatch = (text: string): ((p: Property) => boolean) => {
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      const lowerWords = words.map(w => w.toLowerCase());

      return (p) => {
        for (const word of lowerWords) {
          const inField = [p.title, p.description, p.neighborhood, p.city, p.address].some(
            field => field?.toLowerCase().includes(word)
          );
          if (!inField) return false;  // ALL words must match
        }
        return true;
      };
    };

    // Same geo fallback logic as Prisma
    let sorted = doSearch(hasGeoCoords);
    if (sorted.length === 0 && hasGeoCoords) sorted = doSearch(false);

    const paginated = sorted.slice(offset, offset + limit);
    return { items: paginated, total: sorted.length, page, limit, hasMore: ... };
  }
}
