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
      const response = await fetch('https://ipapi.co/json/', {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`ipapi responded with ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.reason || 'ipapi error');
      }

      const region = data.region || data.region_name || data.state || '';
      const city = data.city || '';
      const lat = typeof data.latitude === 'number' ? data.latitude : undefined;
      const lng = typeof data.longitude === 'number' ? data.longitude : undefined;

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

      setResult({
        provinceId,
        departmentId,
        departmentName,
        city,
        region,
        country: data.country_name,
        lat,
        lng,
      });
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
