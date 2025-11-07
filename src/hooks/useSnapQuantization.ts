/**
 * useSnapQuantization - Snap and quantization logic hook
 * Handles snap settings, intervals, and beat quantization
 */

import { useState, useCallback } from 'react';
import type { SnapSetting } from '../types/FLStudio.types';

interface UseSnapQuantizationProps {
  beatsPerBar: number;
  stepsPerBeat: number;
}

// Parameter names in function types are for documentation only
/* eslint-disable no-unused-vars */
interface UseSnapQuantizationReturn {
  snapSetting: SnapSetting;
  setSnapSetting: (setting: SnapSetting) => void;
  getSnapInterval: () => number;
  quantizeBeat: (beat: number, mode?: 'nearest' | 'floor' | 'ceil') => number;
}
/* eslint-enable no-unused-vars */

/**
 * Hook for managing snap settings and quantization
 */
export function useSnapQuantization({
  beatsPerBar,
  stepsPerBeat,
}: UseSnapQuantizationProps): UseSnapQuantizationReturn {
  const [snapSetting, setSnapSetting] = useState<SnapSetting>('beat');

  /**
   * Get snap interval
   */
  const getSnapInterval = useCallback((): number => {
    switch (snapSetting) {
      case 'bar':
        return beatsPerBar;
      case 'beat':
        return 1;
      case 'step':
        return 1 / stepsPerBeat;
      case 'none':
      default:
        return 0;
    }
  }, [snapSetting, beatsPerBar, stepsPerBeat]);

  /**
   * Quantize beat
   */
  const quantizeBeat = useCallback(
    (beat: number, mode: 'nearest' | 'floor' | 'ceil' = 'nearest'): number => {
      const interval = getSnapInterval();
      if (!interval) {
        return beat;
      }

      const ratio = beat / interval;
      switch (mode) {
        case 'floor':
          return Math.floor(ratio) * interval;
        case 'ceil':
          return Math.ceil(ratio) * interval;
        default:
          return Math.round(ratio) * interval;
      }
    },
    [getSnapInterval]
  );

  return {
    snapSetting,
    setSnapSetting,
    getSnapInterval,
    quantizeBeat,
  };
}
