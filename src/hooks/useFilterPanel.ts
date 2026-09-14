'use client';

import { useCallback } from 'react';
import type { FilterCriteria } from '@/store/useAppStore';

type ArrayFilterFields = 'rooms' | 'bedrooms' | 'propertyTypes' | 'amenities';

export function useFilterPanel(
  filter: FilterCriteria,
  onFilterChange: (filter: FilterCriteria) => void,
  onClose: () => void
) {
  const toggleArray = useCallback(
    <K extends ArrayFilterFields>(
      field: K,
      value: NonNullable<FilterCriteria[K]>[number]
    ) => {
      const current = (filter[field] ?? []) as typeof value[];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      onFilterChange({ ...filter, [field]: updated });
    },
    [filter, onFilterChange]
  );

  const toggleBoolean = useCallback(
    (field: keyof FilterCriteria, value: boolean) => {
      const current = filter[field];
      onFilterChange({
        ...filter,
        [field]: current === value ? undefined : value,
      });
    },
    [filter, onFilterChange]
  );

  const setOperationType = useCallback(
    (value: 'rent' | 'sale' | 'temporal') => {
      if (value === 'temporal') {
        onFilterChange({
          ...filter,
          listingSubType: filter.listingSubType === 'temporal' ? undefined : 'temporal',
          listingType: filter.listingType === 'rent' ? undefined : filter.listingType,
        });
      } else {
        onFilterChange({
          ...filter,
          listingType: filter.listingType === value ? undefined : value,
          listingSubType: filter.listingSubType === 'temporal' ? undefined : filter.listingSubType,
        });
      }
    },
    [filter, onFilterChange]
  );

  const setSellerType = useCallback(
    (value: 'OWNER' | 'AGENCY') => {
      onFilterChange({
        ...filter,
        sellerType: filter.sellerType === value ? undefined : value,
      });
    },
    [filter, onFilterChange]
  );

  const setCurrency = useCallback(
    (value: 'any' | 'ARS' | 'USD') => {
      onFilterChange({
        ...filter,
        currency: value === 'any' ? undefined : value,
      });
    },
    [filter, onFilterChange]
  );

  const setParking = useCallback(
    (value: 'any' | '1+' | '2+') => {
      onFilterChange({
        ...filter,
        parking: filter.parking === value ? undefined : value,
      });
    },
    [filter, onFilterChange]
  );

  const handleClear = useCallback(() => {
    onFilterChange({});
    onClose();
  }, [onFilterChange, onClose]);

  const activeCount = [
    filter.listingType !== undefined,
    filter.listingSubType !== undefined,
    Boolean(filter.propertyTypes?.length),
    Boolean(filter.rooms?.length),
    Boolean(filter.bedrooms?.length),
    filter.bathrooms !== undefined,
    Boolean(filter.amenities?.length),
    filter.priceMin !== undefined || filter.priceMax !== undefined,
    filter.currency !== undefined,
    filter.creditApproved !== undefined,
    filter.parking !== undefined,
    filter.sellerType !== undefined,
  ].filter(Boolean).length;

  return {
    toggleArray,
    toggleBoolean,
    handleClear,
    activeCount,
    setOperationType,
    setSellerType,
    setCurrency,
    setParking,
  };
}