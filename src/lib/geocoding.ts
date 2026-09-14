export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export async function geocodeAddress(address: string): Promise<GeoCoordinates | null> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'PropFind/1.0' },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as AddressSuggestion[];
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch {
    return null;
  }
}

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'PropFind/1.0' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    return (await response.json()) as AddressSuggestion[];
  } catch {
    return [];
  }
}
