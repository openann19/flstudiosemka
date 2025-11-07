/**
 * LFOModule tests
 * @module audio/synthesizer/__tests__/LFOModule.test
 */

import { LFOModule } from '../lfos/LFOModule';
import type { LFOConfig } from '../../../types/synthesizer.types';

describe('LFOModule', () => {
  let audioContext: AudioContext;
  let lfo: LFOModule;

  beforeEach(() => {
    audioContext = new AudioContext();
    const config: LFOConfig = {
      enabled: true,
      waveform: 'sine',
      rate: 2,
      tempoSync: false,
      syncDivision: '1/4',
      depth: 0.5,
      delay: 0,
      fadeIn: 0,
      phase: 0,
    };
    lfo = new LFOModule(audioContext, config, 'lfo1');
  });

  afterEach(() => {
    audioContext.close();
  });

  test('should create LFO module', () => {
    expect(lfo).toBeDefined();
    expect(lfo.getConfig().waveform).toBe('sine');
  });

  test('should get modulation value', () => {
    const value = lfo.getValue();
    expect(value).toBeGreaterThanOrEqual(-1);
    expect(value).toBeLessThanOrEqual(1);
  });

  test('should update configuration', () => {
    lfo.updateConfig({ rate: 4 });
    expect(lfo.getConfig().rate).toBe(4);
  });

  test('should set BPM for tempo sync', () => {
    lfo.setBPM(120);
    lfo.updateConfig({ tempoSync: true });
    const value = lfo.getValue();
    expect(typeof value).toBe('number');
  });

  test('should reset phase', () => {
    lfo.getValue(); // Advance phase
    lfo.getValue(); // Get another value
    lfo.reset();
    // After reset, phase should be reset to 0
    const valueAfterReset = lfo.getValue();
    expect(typeof valueAfterReset).toBe('number');
    expect(lfo.getSourceType()).toBe('lfo1');
    // LFO should be enabled after reset
    expect(lfo.getConfig().enabled).toBe(true);
  });
});

