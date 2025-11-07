/**
 * VoiceManager tests
 * @module audio/synthesizer/__tests__/VoiceManager.test
 */

import { VoiceManager } from '../core/VoiceManager';
import type { ActiveVoice } from '../../../types/synthesizer.types';

describe('VoiceManager', () => {
  let voiceManager: VoiceManager;
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
    voiceManager = new VoiceManager(8, 'poly');
  });

  afterEach(() => {
    audioContext.close();
  });

  test('should create voice manager', () => {
    expect(voiceManager).toBeDefined();
    expect(voiceManager.getMaxPolyphony()).toBe(8);
  });

  test('should allocate voice', () => {
    const nodes: ActiveVoice['nodes'] = {
      oscillators: [],
      gains: [],
      masterGain: audioContext.createGain(),
    };
    const voiceId = voiceManager.allocateVoice(60, 440, 0.8, audioContext.currentTime, nodes);
    expect(voiceId).toBeDefined();
    expect(voiceManager.getActiveVoiceCount()).toBe(1);
  });

  test('should release voice', () => {
    const nodes: ActiveVoice['nodes'] = {
      oscillators: [],
      gains: [],
      masterGain: audioContext.createGain(),
    };
    const voiceId = voiceManager.allocateVoice(60, 440, 0.8, audioContext.currentTime, nodes);
    voiceManager.releaseVoice(voiceId);
    expect(voiceManager.getActiveVoiceCount()).toBe(0);
  });

  test('should stop all voices', () => {
    const nodes: ActiveVoice['nodes'] = {
      oscillators: [],
      gains: [],
      masterGain: audioContext.createGain(),
    };
    voiceManager.allocateVoice(60, 440, 0.8, audioContext.currentTime, nodes);
    voiceManager.allocateVoice(64, 523.25, 0.8, audioContext.currentTime, nodes);
    voiceManager.stopAllVoices();
    expect(voiceManager.getActiveVoiceCount()).toBe(0);
  });

  test('should handle voice stealing', () => {
    const nodes: ActiveVoice['nodes'] = {
      oscillators: [],
      gains: [],
      masterGain: audioContext.createGain(),
    };
    // Allocate voices up to max polyphony
    for (let i = 0; i < 8; i += 1) {
      voiceManager.allocateVoice(60 + i, 440, 0.8, audioContext.currentTime, nodes);
    }
    // Next allocation should trigger voice stealing
    const voiceId = voiceManager.allocateVoice(68, 440, 0.8, audioContext.currentTime, nodes);
    expect(voiceId).toBeDefined();
    expect(voiceManager.getActiveVoiceCount()).toBe(8);
  });

  test('should set voice mode', () => {
    voiceManager.setVoiceMode('mono');
    expect(voiceManager.getVoiceMode()).toBe('mono');
  });
});

