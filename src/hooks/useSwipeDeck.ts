'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useSwipeStore } from '@/store/useSwipeStore';
import type { SwipeDirection, Property } from '@/store/useAppStore';
import { csrfFetch } from '@/lib/security/csrfClient';

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;
const PREFETCH_THRESHOLD = 2;

interface SwipeDeckState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  swipeDirection: SwipeDirection | null;
}

interface UseSwipeDeckReturn {
  state: SwipeDeckState;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  triggerSwipe: (direction: SwipeDirection) => void;
  undo: () => void;
  canUndo: boolean;
  prefetchStatus: 'idle' | 'fetching' | 'ready';
}

export function useSwipeDeck(
  onSwipeComplete?: (direction: SwipeDirection, property: Property) => void,
  initialProperties: Property[] = []
): UseSwipeDeckReturn {
  const { currentProperty, swipe, undo, undoStack, swipeQueue, enqueueProperties, setCurrentProperty, setSwipeQueue } =
    useSwipeStore();

  useEffect(() => {
    if (!currentProperty && initialProperties.length > 0 && swipeQueue.length === 0) {
      setCurrentProperty(initialProperties[0]);
      setSwipeQueue(initialProperties.slice(1));
    }
  }, [currentProperty, initialProperties, swipeQueue.length, setCurrentProperty, setSwipeQueue]);

  const [state, setState] = useState<SwipeDeckState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    swipeDirection: null,
  });

  const [prefetchStatus, setPrefetchStatus] = useState<'idle' | 'fetching' | 'ready'>('idle');

  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastPositionRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const canUndo = undoStack.length > 0;

  const prefetchNext = useCallback(async () => {
    if (swipeQueue.length >= PREFETCH_THRESHOLD) return;
    if (prefetchStatus === 'fetching') return;

    setPrefetchStatus('fetching');

    try {
      const response = await csrfFetch('/api/properties/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            limit: 3,
            excludeIds: useSwipeStore.getState().discardedHistory,
          }),
      });

      if (response.ok) {
        const result = await response.json();
        const properties = result.data?.properties || [];
        if (properties.length) {
          enqueueProperties(properties);
        }
      }
    } catch {
      // Silently fail prefetch
    } finally {
      setPrefetchStatus('ready');
    }
  }, [swipeQueue.length, prefetchStatus, enqueueProperties]);

  const triggerSwipe = useCallback(
    (direction: SwipeDirection) => {
      if (!currentProperty) return;

      swipe(direction);
      onSwipeComplete?.(direction, currentProperty);

      // Trigger prefetch if queue is running low
      if (swipeQueue.length <= PREFETCH_THRESHOLD) {
        prefetchNext();
      }
    },
    [currentProperty, swipe, swipeQueue.length, prefetchNext, onSwipeComplete]
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    lastPositionRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setState((prev) => ({ ...prev, isDragging: true }));

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    lastPositionRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };

    let direction: SwipeDirection | null = null;
    if (deltaX > SWIPE_THRESHOLD / 2) direction = 'right';
    else if (deltaX < -SWIPE_THRESHOLD / 2) direction = 'left';
    else if (deltaY < -SWIPE_THRESHOLD / 2) direction = 'up';

    setState({
      isDragging: true,
      dragOffset: { x: deltaX, y: deltaY },
      swipeDirection: direction,
    });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragStartRef.current || !lastPositionRef.current) {
        setState({ isDragging: false, dragOffset: { x: 0, y: 0 }, swipeDirection: null });
        return;
      }

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const deltaTime = Date.now() - dragStartRef.current.time;

      const velocityX = deltaTime > 0 ? deltaX / deltaTime : 0;
      const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0;

      let finalDirection: SwipeDirection | null = null;

      if (deltaX > SWIPE_THRESHOLD || velocityX > 0.5) {
        finalDirection = 'right';
      } else if (deltaX < -SWIPE_THRESHOLD || velocityX < -0.5) {
        finalDirection = 'left';
      } else if (deltaY < -SWIPE_THRESHOLD || velocityY < -0.5) {
        finalDirection = 'up';
      }

      if (finalDirection) {
        triggerSwipe(finalDirection);
      }

      dragStartRef.current = null;
      lastPositionRef.current = null;

      setState({ isDragging: false, dragOffset: { x: 0, y: 0 }, swipeDirection: null });
    },
    [triggerSwipe]
  );

  return {
    state,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
    triggerSwipe,
    undo,
    canUndo,
    prefetchStatus,
  };
}
