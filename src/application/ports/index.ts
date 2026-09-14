import { Property, PropertyReport } from '@/domain/entities';
import { BoundingBox, PropertySearchFilters, CreatePropertyInput, CreatePropertyReportInput } from '@/domain/value-objects';
import { SearchParams, PagedResult } from '@/types/search';

export interface PropertyRepository {
  searchByBoundingBox(params: {
    bbox: BoundingBox;
    filters: PropertySearchFilters;
    excludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<Property[]>;

  search(params: SearchParams): Promise<PagedResult<Property>>;

  findById(id: string): Promise<Property | null>;
  create(data: CreatePropertyInput): Promise<Property>;
  findFirstNotInIds(ids: string[], limit?: number): Promise<Property | null>;
}

export interface InteractionRepository {
  create(data: {
    propertyId: string;
    interactionType: 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SUPERLIKE' | 'VIEW_DETAIL' | 'CONTACT_REALTOR' | 'SAVE' | 'SHARE';
    swipeDirection?: 'left' | 'right' | 'up';
    sessionId: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;

  findRecentBySession(sessionId: string, limit?: number): Promise<Array<{ propertyId: string }>>;
}

export interface PropertyReportRepository {
  create(data: CreatePropertyReportInput): Promise<PropertyReport>;
  countByPropertyId(propertyId: string): Promise<number>;
  getReportedPropertyIds(threshold?: number): Promise<string[]>;
}
