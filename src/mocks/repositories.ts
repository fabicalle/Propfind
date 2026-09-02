import { Property } from '@/domain/entities';
import { PropertyRepository, InteractionRepository } from '@/application/ports';
import { BoundingBox, PropertySearchFilters } from '@/domain/value-objects';
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
    };

    MOCK_PROPERTIES.push(property);
    return property;
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
