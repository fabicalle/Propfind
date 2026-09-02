import { useCallback } from 'react';
import type { FilterCriteria } from '@/store/useAppStore';

export function useFilterPanel(filter: FilterCriteria, onFilterChange: (filter: FilterCriteria) => void, onClose: () => void) {
  const toggleArray = useCallback(
    (field: 'rooms' | 'bedrooms' | 'propertyTypes' | 'amenities', value: number | string) => {
      const current = (filter[field] || []) as (number | string)[];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      onFilterChange({ ...filter, [field]: updated });
    },
    [filter, onFilterChange]
  );

  const toggleBoolean = useCallback(
    (field: 'creditApproved', value: boolean) => {
      const current = filter[field];
      onFilterChange({ ...filter, [field]: current === value ? undefined : value });
    },
    [filter, onFilterChange]
  );

  const handleClear = useCallback(() => {
    onFilterChange({
      listingType: undefined,
      listingSubType: undefined,
      propertyTypes: [],
      rooms: [],
      bedrooms: [],
      bathrooms: undefined,
      amenities: [],
      priceMin: undefined,
      priceMax: undefined,
      areaMin: undefined,
      areaMax: undefined,
      currency: undefined,
      creditApproved: undefined,
      parking: undefined,
      sellerType: undefined,
    });
    onClose();
  }, [onFilterChange, onClose]);

  const activeCount = [
    filter.listingType,
    filter.listingSubType,
    filter.propertyTypes?.length ? true : false,
    filter.rooms?.length ? true : false,
    filter.bedrooms?.length ? true : false,
    filter.bathrooms,
    filter.amenities?.length ? true : false,
    filter.priceMin || filter.priceMax,
    filter.currency,
    filter.creditApproved,
    filter.parking,
    filter.sellerType,
  ].filter(Boolean).length;

  return {
    toggleArray,
    toggleBoolean,
    handleClear,
    activeCount,
  };
}
