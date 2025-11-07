/**
 * Tests for useChannelRackInteractions hook
 * @module tests/hooks/useChannelRackInteractions
 */

import { renderHook } from '@testing-library/react';
import { useChannelRackInteractions } from '../../src/hooks/useChannelRackInteractions';

describe('useChannelRackInteractions', () => {
  describe('initialization', () => {
    it('should return container ref', () => {
      const { result } = renderHook(() => useChannelRackInteractions());

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull();
    });

    it('should accept options', () => {
      const onScroll = jest.fn();
      const onPan = jest.fn();

      const { result } = renderHook(() =>
        useChannelRackInteractions({
          onScroll,
          onPan,
          enabled: true,
        })
      );

      expect(result.current.containerRef).toBeDefined();
    });
  });
});
