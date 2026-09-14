import { useState, useCallback } from 'react';
import type { Property } from '@/store/useAppStore';

export function usePropertyImage(property: Property) {
  const images = property.images || [];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const currentImage = images[currentImageIndex];

  const handleNextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentImageIndex < images.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      }
    },
    [currentImageIndex, images.length]
  );

  const handlePrevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
    },
    [currentImageIndex]
  );

  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  return {
    images,
    currentImageIndex,
    currentImage,
    imageError,
    handleNextImage,
    handlePrevImage,
    handleImageError,
  };
}
