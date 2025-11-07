/**
 * ADSREnvelope tests
 * @module audio/synthesizer/__tests__/ADSREnvelope.test
 */

import { ADSREnvelope } from '../envelopes/ADSREnvelope';
import type { ADSREnvelopeParams } from '../../../types/synthesizer.types';

describe('ADSREnvelope', () => {
  let audioContext: AudioContext;
  let envelope: ADSREnvelope;

  beforeEach(() => {
    audioContext = new AudioContext();
    const params: ADSREnvelopeParams = {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.7,
      release: 0.3,
      curve: 'exponential',
      velocitySensitivity: 0.5,
    };
    envelope = new ADSREnvelope(audioContext, params);
  });

  afterEach(() => {
    audioContext.close();
  });

  test('should create ADSR envelope', () => {
    expect(envelope).toBeDefined();
    expect(envelope.getParams().attack).toBe(0.1);
  });

  test('should trigger attack', () => {
    envelope.triggerAttack();
    expect(envelope.isActive()).toBe(true);
  });

  test('should trigger release', () => {
    envelope.triggerAttack();
    envelope.triggerRelease();
    // Envelope should still be active during release
    expect(envelope.isActive()).toBe(true);
  });

  test('should set velocity', () => {
    envelope.setVelocity(0.5);
    envelope.triggerAttack();
    // Velocity affects peak level
    expect(envelope.getValue()).toBeGreaterThanOrEqual(0);
  });

  test('should update parameters', () => {
    envelope.updateParams({ attack: 0.2 });
    expect(envelope.getParams().attack).toBe(0.2);
  });
});

