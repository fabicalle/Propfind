import type { PropertySearchFilters } from '@/domain/value-objects';

export type OperationType = 'RENT' | 'SALE';

export interface SearchParams {
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

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
