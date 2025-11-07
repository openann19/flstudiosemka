/**
 * useChannelRackInteractions - Mouse interactions for Channel Rack
 * Handles scroll, pan, and other mouse interactions
 * @module hooks/useChannelRackInteractions
 */

import { useEffect, useRef } from 'react';
import { useMouseInteractions } from './useMouseInteractions';

/**
 * Options for channel rack interactions
 */
export interface UseChannelRackInteractionsOptions {
  onScroll?: (delta: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  enabled?: boolean;
}

/**
 * React hook for channel rack mouse interactions
 */
export function useChannelRackInteractions(
  options: UseChannelRackInteractionsOptions = {}
): {
  containerRef: React.RefObject<HTMLDivElement>;
} {
  const { onScroll, onPan, enabled = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useMouseInteractions({ enabled });

  /**
   * Setup scroll interactions
   */
  useEffect(() => {
    if (!containerRef.current || !enabled || !onScroll) {
      return;
    }

    mouse.registerScrollTimeline(containerRef.current, (delta) => {
      onScroll(delta);
    });
  }, [containerRef, mouse, enabled, onScroll]);

  /**
   * Setup pan interactions
   */
  useEffect(() => {
    if (!containerRef.current || !enabled || !onPan) {
      return;
    }

    mouse.registerMiddleMousePan(containerRef.current, (state) => {
      onPan(state.deltaX, state.deltaY);
    });
  }, [containerRef, mouse, enabled, onPan]);

  return {
    containerRef,
  };
}

