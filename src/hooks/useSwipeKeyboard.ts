import { useEffect, useCallback } from 'react';
import type { SwipeDirection } from '@/store/useAppStore';

interface UseSwipeKeyboardOptions {
  triggerSwipe: (direction: SwipeDirection) => void;
  undo: () => void;
  canUndo: boolean;
}

export function useSwipeKeyboard({ triggerSwipe, undo, canUndo }: UseSwipeKeyboardOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        triggerSwipe('left');
        break;
      case 'ArrowRight':
        triggerSwipe('right');
        break;
      case 'ArrowUp':
        triggerSwipe('up');
        break;
      case 'z':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          undo();
        }
        break;
    }
  }, [triggerSwipe, undo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
