import { Property } from '@/domain/entities';
import { PropertyRepository, InteractionRepository } from '@/application/ports';
import { BoundingBox, PropertySearchFilters } from '@/domain/value-objects';
import { SearchParams, PagedResult } from '@/types/search';
import { MOCK_PROPERTIES, getMockPropertyById } from './properties';

export class MockPropertyRepository implements PropertyRepository {
  async searchByBoundingBox(params: {
    bbox: BoundingBox;
    filters: PropertySearchFilters;
    excludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<Property[]> {
    const { bbox, filters, excludeIds = [], limit, offset } = params;

    const results = MOCK_PROPERTIES.filter((p) => {
      if (!p.isActive) return false;
      if (excludeIds.includes(p.id)) return false;
      if (p.lat < bbox.south || p.lat > bbox.north) return false;
      if (p.lng < bbox.west || p.lng > bbox.east) return false;
      if (filters.listingType && p.listingType !== filters.listingType) return false;
      if (filters.listingSubType && p.listingSubType !== filters.listingSubType) return false;
      if (filters.sellerType && p.sellerType !== filters.sellerType) return false;
      if (filters.currency && p.priceCurrency !== filters.currency) return false;
      if (filters.creditApproved && !p.creditApproved) return false;
      if (filters.priceMin !== undefined && p.price < filters.priceMin) return false;
      if (filters.priceMax !== undefined && p.price > filters.priceMax) return false;
      if (filters.rooms && filters.rooms.length > 0 && !filters.rooms.includes(p.rooms ?? 0)) return false;
      if (filters.bedrooms && filters.bedrooms.length > 0 && !filters.bedrooms.includes(p.bedrooms ?? 0)) return false;
      if (filters.propertyTypes && filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(p.propertyType ?? '')) return false;
      if (filters.parking) {
        const parkingValue = p.parking ?? 'any';
        if (filters.parking === '1+' && parkingValue === 'any') return false;
        if (filters.parking === '2+' && (parkingValue === 'any' || parkingValue === '1+')) return false;
      }
      if (filters.amenities && filters.amenities.length > 0) {
        const hasAll = filters.amenities.every((a) => p.amenities.includes(a));
        if (!hasAll) return false;
      }
      return true;
    });

    const paginated = results.slice(offset, offset + limit);

    return paginated.map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
    }));
  }

  async findById(id: string): Promise<Property | null> {
    const property = getMockPropertyById(id);
    if (!property) return null;
    return {
      ...property,
      createdAt: new Date(property.createdAt),
      bedrooms: property.bedrooms ?? null,
      listingSubType: property.listingSubType ?? null,
      sellerType: property.sellerType ?? null,
      creditApproved: property.creditApproved ?? null,
      parking: property.parking ?? null,
      contactInfo: property.contactInfo ?? null,
    };
  }

  async create(data: {
    title: string;
    description?: string;
    price: number;
    priceCurrency?: string;
    totalMonthlyCost?: number;
    areaM2?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    propertyType?: string;
    listingType: 'sale' | 'rent';
    listingSubType?: string;
    sellerType?: string;
    creditApproved?: boolean;
    parking?: string;
    lat: number;
    lng: number;
    address?: string;
    neighborhood?: string;
    city?: string;
    images?: Array<{ url: string; width: number; height: number; alt?: string }>;
    amenities?: string[];
    sourceUrl?: string;
    publisherId?: string;
    isMock?: boolean;
    embedding?: string;
    contactInfo?: {
      name: string;
      email: string;
      phone: string;
      whatsapp: string;
    };
  }): Promise<Property> {
    const id = crypto.randomUUID();
    const property: Property = {
      id,
      title: data.title,
      description: data.description ?? null,
      price: data.price,
      priceCurrency: data.priceCurrency ?? 'USD',
      totalMonthlyCost: data.totalMonthlyCost ?? null,
      areaM2: data.areaM2 ?? null,
      rooms: data.rooms ?? null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      propertyType: data.propertyType ?? null,
      listingType: data.listingType,
      listingSubType: data.listingSubType ?? null,
      sellerType: (data.sellerType ?? null) as 'OWNER' | 'AGENCY' | null,
      creditApproved: data.creditApproved ?? null,
      parking: data.parking ?? null,
      lat: data.lat,
      lng: data.lng,
      address: data.address ?? null,
      neighborhood: data.neighborhood ?? null,
      city: data.city ?? null,
      images: data.images ?? [],
      amenities: data.amenities ?? [],
      sourceUrl: data.sourceUrl ?? null,
      isActive: true,
      createdAt: new Date(),
      publisherId: data.publisherId ?? null,
      contactInfo: data.contactInfo ?? null,
      isMock: data.isMock ?? false,
      embedding: data.embedding ?? null,
    };

    MOCK_PROPERTIES.push(property);
    return property;
  }

  async search(params: SearchParams): Promise<PagedResult<Property>> {
    const { query = '', locationQuery = '', localityIds = [], lat, lng, radiusKm = 50, operationType, page = 1, limit = 20, excludeIds = [], filters } = params;

    const offset = (page - 1) * limit;
    const hasGeoCoords = lat != null && lng != null;

    const effectiveListingType = operationType ?? filters?.listingType;

    const buildTextSearchMatch = (text: string): ((p: Property) => boolean) => {
      const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
      if (words.length === 0) return () => true;

      const lowerWords = words.map((w) => w.toLowerCase());

      return (p: Property) => {
        for (const word of lowerWords) {
          const inField = [p.title, p.description, p.neighborhood, p.city, p.address].some(
            (field) => field?.toLowerCase().includes(word)
          );
          if (!inField) return false;
        }
        return true;
      };
    };

    const queryMatch = query ? buildTextSearchMatch(query) : null;
    const locationMatch = locationQuery && localityIds.length === 0 ? buildTextSearchMatch(locationQuery) : null;

    const doSearch = (useGeo: boolean) => {
      const results = MOCK_PROPERTIES.filter((p) => {
        if (!p.isActive) return false;
        if (excludeIds.includes(p.id)) return false;

        if (effectiveListingType) {
          const expectedType = effectiveListingType === 'SALE' ? 'sale' : effectiveListingType === 'RENT' ? 'rent' : effectiveListingType;
          if (p.listingType !== expectedType) return false;
        }

        if (useGeo && hasGeoCoords && lat && lng) {
          const R = 6371;
          const dLat = ((p.lat - lat) * Math.PI) / 180;
          const dLon = ((p.lng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat * Math.PI) / 180) *
              Math.cos((p.lat * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          if (distance > radiusKm) return false;
        }

        if (queryMatch && !queryMatch(p)) return false;
        if (locationMatch && !locationMatch(p)) return false;

        if (localityIds.length > 0) {
          const localitySet = new Set(localityIds);
          if (!localitySet.has(p.departmentId ?? '')) {
            return false;
          }
        }

        if (filters?.propertyTypes?.length && !filters.propertyTypes.includes(p.propertyType ?? '')) return false;
        if (filters?.priceMin != null && p.price < filters.priceMin) return false;
        if (filters?.priceMax != null && p.price > filters.priceMax) return false;
        if (filters?.bedrooms?.length && !(filters.bedrooms.includes(p.bedrooms ?? 0))) return false;
        if (filters?.rooms?.length && !(filters.rooms.includes(p.rooms ?? 0))) return false;
        if (filters?.bathrooms != null && (p.bathrooms ?? 0) < filters.bathrooms) return false;
        if (filters?.amenities?.length && !filters.amenities.every((a) => p.amenities?.includes(a))) return false;
        if (filters?.creditApproved != null && p.creditApproved !== filters.creditApproved) return false;
        if (filters?.parking && p.parking !== filters.parking) return false;
        if (filters?.sellerType && p.sellerType !== filters.sellerType) return false;
        if (filters?.currency && p.priceCurrency !== filters.currency) return false;
        if (filters?.listingSubType && p.listingSubType !== filters.listingSubType) return false;

        return true;
      });

      const sorted = [...results].sort((a, b) => {
        if (!hasGeoCoords || !lat || !lng) return 0;
        const distA = Math.sqrt((a.lat - lat) ** 2 + (a.lng - lat) ** 2);
        const distB = Math.sqrt((b.lat - lat) ** 2 + (b.lng - lat) ** 2);
        return distA - distB;
      });

      return sorted;
    };

    let sorted = doSearch(hasGeoCoords);

    if (sorted.length === 0 && hasGeoCoords) {
      sorted = doSearch(false);
    }

    const paginated = sorted.slice(offset, offset + limit);

    return {
      items: paginated.map((p) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      })),
      total: sorted.length,
      page,
      limit,
      hasMore: offset + limit < sorted.length,
    };
  }

  async findRecentForSession(_sessionId: string, _limit = 100): Promise<Array<{ propertyId: string }>> {
    return [];
  }

  async findFirstNotInIds(ids: string[], limit = 1): Promise<Property | null> {
    const filtered = MOCK_PROPERTIES.filter((p) => !ids.includes(p.id));
    if (filtered.length === 0) return null;
    const property = filtered.slice(0, limit)[0];
    if (!property) return null;
    return {
      ...property,
      createdAt: new Date(property.createdAt),
      bedrooms: property.bedrooms ?? null,
      listingSubType: property.listingSubType ?? null,
      sellerType: property.sellerType ?? null,
      creditApproved: property.creditApproved ?? null,
      parking: property.parking ?? null,
      contactInfo: property.contactInfo ?? null,
    };
  }
}

export class MockInteractionRepository implements InteractionRepository {
  private interactions: Array<{
    propertyId: string;
    interactionType: string;
    swipeDirection: string | null;
    sessionId: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }> = [];

  async create(data: {
    propertyId: string;
    interactionType: 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SUPERLIKE' | 'VIEW_DETAIL' | 'CONTACT_REALTOR' | 'SAVE' | 'SHARE';
    swipeDirection?: 'left' | 'right' | 'up';
    sessionId: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.interactions.push({
      propertyId: data.propertyId,
      interactionType: data.interactionType,
      swipeDirection: data.swipeDirection ?? null,
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: data.metadata,
    });
  }

  async findRecentBySession(sessionId: string, limit = 100): Promise<Array<{ propertyId: string }>> {
    return this.interactions
      .filter((i) => i.sessionId === sessionId)
      .slice(-limit)
      .map((i) => ({ propertyId: i.propertyId }));
  }
}
