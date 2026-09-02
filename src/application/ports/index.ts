import { Property } from '@/domain/entities';
import { BoundingBox, PropertySearchFilters, CreatePropertyInput } from '@/domain/value-objects';

export interface PropertyRepository {
  searchByBoundingBox(params: {
    bbox: BoundingBox;
    filters: PropertySearchFilters;
    excludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<Property[]>;

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
