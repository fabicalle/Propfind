import { useState } from 'react';

export interface GeorefLocationResult {
  id: string;
  name: string;
  provinceId: string;
  provinceName: string;
  departmentId: string;
  departmentName: string;
  lat: number;
  lng: number;
}

export function useGeorefSearch() {
  const [results, setResults] = useState<GeorefLocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/georef/search?q=${encodeURIComponent(query.trim())}&max=10`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to search locations');
      }

      const data = await response.json();
      const localidades: GeorefLocationResult[] = data.data?.localidades || [];
      const departamentos: GeorefLocationResult[] = data.data?.departamentos || [];

      const merged = [...localidades, ...departamentos];
      const unique = merged.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );

      setResults(unique);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, loading, error, search, clear };
}
