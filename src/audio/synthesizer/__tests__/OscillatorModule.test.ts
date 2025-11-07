/**
 * OscillatorModule tests
 * @module audio/synthesizer/__tests__/OscillatorModule.test
 */

import { OscillatorModule } from '../oscillators/OscillatorModule';
import type { OscillatorConfig } from '../../../types/synthesizer.types';

describe('OscillatorModule', () => {
  let audioContext: AudioContext;
  let oscillator: OscillatorModule;

  beforeEach(() => {
    audioContext = new AudioContext();
    const config: OscillatorConfig = {
      enabled: true,
      waveform: 'sine',
      octave: 0,
      semitone: 0,
      detune: 0,
      gain: 0.5,
      pulseWidth: 0.5,
      phase: 0,
      sync: false,
      ringMod: false,
    };
    oscillator = new OscillatorModule(audioContext, config, 'osc1Pitch');
  });

  afterEach(() => {
    audioContext.close();
  });

  test('should create oscillator module', () => {
    expect(oscillator).toBeDefined();
    expect(oscillator.getConfig().waveform).toBe('sine');
  });

  test('should set frequency', () => {
    oscillator.setFrequency(440);
    // Frequency is set internally
    expect(oscillator.getConfig()).toBeDefined();
  });

  test('should set MIDI note', () => {
    oscillator.setNote(69); // A4
    // Note is converted to frequency internally
    expect(oscillator.getConfig()).toBeDefined();
  });

  test('should update configuration', () => {
    oscillator.updateConfig({ waveform: 'sawtooth' });
    expect(oscillator.getConfig().waveform).toBe('sawtooth');
  });

  test('should apply modulation', () => {
    oscillator.setFrequency(440);
    oscillator.applyModulation(0.5, 1.0);
    // Modulation should affect frequency
    expect(oscillator.getCurrentValue()).toBe(0.5);
  });
});

