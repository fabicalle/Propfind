import { useState, useCallback } from 'react';
import type { Property } from '@/store/useAppStore';

export function usePropertyDetailSlider(property: Property) {
  const images = property.imagesGallery?.length
    ? property.imagesGallery
    : property.images?.map((img) => img.url) || [];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev: number) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev: number) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  return {
    images,
    currentImageIndex,
    handlePrev,
    handleNext,
  };
}
