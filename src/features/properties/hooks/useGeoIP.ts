import { useState, useEffect, useCallback, useRef } from 'react';
import { getProvinceById, DEFAULT_DEPARTMENT_ID, DEFAULT_DEPARTMENT_NAME, LOCATIONS, type LocationDepartment } from '@/shared/data/locations';

interface GeoIPResult {
  provinceId: string | null;
  departmentId: string | null;
  departmentName: string | null;
  city?: string;
  region?: string;
  country?: string;
  lat?: number;
  lng?: number;
  error?: string;
}

export function useGeoIP() {
  const [result, setResult] = useState<GeoIPResult>({
    provinceId: null,
    departmentId: null,
    departmentName: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const detect = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const cached = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('geoip_cache') : null;
      if (cached) {
        const data = JSON.parse(cached) as GeoIPResult;
        setResult(data);
        setLoading(false);
        return;
      }

      let data: Record<string, unknown> | null = null;

      try {
        const response = await fetch('https://ipapi.co/json/', {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'PropertyFinder/1.0',
          },
        });

        if (response.ok) {
          const parsed = await response.json();
          if (parsed && typeof parsed === 'object' && !('error' in parsed)) {
            data = parsed as Record<string, unknown>;
          }
        }
      } catch {
        data = null;
      }

      if (!data) {
        try {
          const fallback = await fetch('http://ip-api.com/json/', {
            headers: { Accept: 'application/json' },
          });

          if (fallback.ok) {
            const fallbackData = await fallback.json();
            if (fallbackData && typeof fallbackData === 'object' && !('fail' in fallbackData)) {
              const fd = fallbackData as Record<string, unknown>;
              data = {
                city: (fd.city as string) || '',
                region: (fd.regionName as string) || (fd.region as string) || '',
                country_name: (fd.country as string) || '',
                latitude: fd.lat as number | undefined,
                longitude: fd.lon as number | undefined,
              };
            }
          }
        } catch {
          data = null;
        }
      }

      if (!data) {
        throw new Error('No se pudo detectar la ubicación');
      }

      const region = (data.region as string) || (data.region_name as string) || (data.state as string) || '';
      const city = (data.city as string) || '';
      const lat = typeof data.latitude === 'number' ? (data.latitude as number) : typeof data.lat === 'number' ? (data.lat as number) : undefined;
      const lng = typeof data.longitude === 'number' ? (data.longitude as number) : typeof data.lon === 'number' ? (data.lon as number) : undefined;

      let provinceId: string | null = null;
      let departmentId: string | null = null;
      let departmentName: string | null = null;

      if (region.toLowerCase().includes('mendoza')) {
        provinceId = 'mendoza';
        const province = getProvinceById('mendoza');
        const matched = province?.departments.find((d: LocationDepartment) =>
          city.toLowerCase().includes(d.name.toLowerCase())
        );
        departmentId = matched?.id ?? DEFAULT_DEPARTMENT_ID;
        departmentName = matched?.name ?? DEFAULT_DEPARTMENT_NAME;
      } else if (region) {
        const province = LOCATIONS.find((p) => p.name.toLowerCase() === region.toLowerCase());
        provinceId = province?.id ?? null;
        if (provinceId) {
          const found = province?.departments.find((d) => d.name.toLowerCase() === city.toLowerCase());
          departmentId = found?.id ?? DEFAULT_DEPARTMENT_ID;
          departmentName = found?.name ?? DEFAULT_DEPARTMENT_NAME;
        }
      }

      const payload: GeoIPResult = {
        provinceId,
        departmentId,
        departmentName,
        city,
        region,
        country: (data.country_name as string) || (data.country as string) || '',
        lat,
        lng,
      };

      setResult(payload);
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('geoip_cache', JSON.stringify(payload));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setResult({
        provinceId: null,
        departmentId: DEFAULT_DEPARTMENT_ID,
        departmentName: DEFAULT_DEPARTMENT_NAME,
        error: message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    detect();
  }, [detect]);

  return {
    ...result,
    loading,
    error,
    retry: detect,
  };
}
