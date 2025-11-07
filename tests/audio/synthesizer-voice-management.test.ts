/**
 * Tests for synthesizer voice management
 * @module tests/audio/synthesizer-voice-management
 */

import { SynthesizerEngine } from '../../src/audio/synthesizer/core/SynthesizerEngine';
import { createMockAudioContext } from '../factories/audio-context-factory';
import type { SynthesizerVoiceConfig } from '../../src/types/synthesizer.types';

describe('Synthesizer Voice Management', () => {
  let audioContext: AudioContext;
  let synthesizer: SynthesizerEngine;

  beforeEach(() => {
    audioContext = createMockAudioContext();
    const config: SynthesizerVoiceConfig = {
      oscillators: [
        {
          enabled: true,
          waveform: 'sawtooth',
          octave: 0,
          semitone: 0,
          detune: 0,
          gain: 0.5,
          pulseWidth: 0.5,
          phase: 0,
          sync: false,
          ringMod: false,
        },
      ],
      filter: {
        enabled: true,
        mode: 'lowpass',
        cutoff: 20000,
        resonance: 0.3,
        drive: 0,
        keytracking: 0,
        envelopeAmount: 0,
        lfoAmount: 0,
      },
      ampEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
        curve: 'exponential',
        velocitySensitivity: 0.5,
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
        curve: 'exponential',
        velocitySensitivity: 0.3,
      },
      lfos: [],
      effects: {
        delay: { enabled: false, time: 0.25, tempoSync: true, syncDivision: '1/8', feedback: 0.3, wet: 0.2, dry: 0.8, pingPong: true, stereoWidth: 1 },
        reverb: { enabled: false, decay: 2, wet: 0.2, dry: 0.8, preDelay: 0.02, roomSize: 0.5, damping: 0.5 },
        chorus: { enabled: false, rate: 1, depth: 0.3, delay: 0.01, feedback: 0.2, wet: 0.3, dry: 0.7, stereoWidth: 0.8 },
        phaser: { enabled: false, rate: 0.5, depth: 0.5, stages: 4, feedback: 0.2, wet: 0.3, dry: 0.7 },
        distortion: { enabled: false, amount: 0.2, drive: 0.3, tone: 0.5, wet: 0.2, dry: 0.8, algorithm: 'soft' },
      },
      modulation: [],
      unison: { enabled: false, voices: 2, detune: 10, spread: 0.5, blend: 0.5 },
      arpeggiator: { enabled: false, pattern: 'up', rate: 4, tempoSync: true, syncDivision: '1/16', octaves: 1, gate: 0.7, swing: 0 },
      portamento: 0,
      voiceMode: 'poly',
      masterTuning: 0,
      pitchBendRange: 2,
    };

    synthesizer = new SynthesizerEngine(audioContext, config);
  });

  it('should play a note and return voice ID', () => {
    const voiceId = synthesizer.playNote(60, 0.8);

    expect(voiceId).not.toBeNull();
    expect(typeof voiceId).toBe('string');
  });

  it('should play multiple notes simultaneously', () => {
    const voiceId1 = synthesizer.playNote(60, 0.8);
    const voiceId2 = synthesizer.playNote(64, 0.7);
    const voiceId3 = synthesizer.playNote(67, 0.9);

    expect(voiceId1).not.toBeNull();
    expect(voiceId2).not.toBeNull();
    expect(voiceId3).not.toBeNull();
    expect(voiceId1).not.toBe(voiceId2);
    expect(voiceId2).not.toBe(voiceId3);
  });

  it('should stop a specific note', () => {
    const voiceId = synthesizer.playNote(60, 0.8);

    expect(() => {
      synthesizer.stopNote(voiceId ?? '');
    }).not.toThrow();
  });

  it('should stop all notes', () => {
    synthesizer.playNote(60, 0.8);
    synthesizer.playNote(64, 0.7);
    synthesizer.playNote(67, 0.9);

    expect(() => {
      synthesizer.stopAllNotes();
    }).not.toThrow();
  });

  it('should handle voice stealing when polyphony limit is reached', () => {
    // Play many notes to test voice stealing
    const voiceIds: string[] = [];

    for (let i = 0; i < 20; i++) {
      const voiceId = synthesizer.playNote(60 + i, 0.8);
      if (voiceId) {
        voiceIds.push(voiceId);
      }
    }

    // Should handle voice allocation
    expect(voiceIds.length).toBeGreaterThan(0);
  });

  it('should handle note on with velocity', () => {
    const voiceId1 = synthesizer.playNote(60, 0.5);
    const voiceId2 = synthesizer.playNote(60, 1.0);

    expect(voiceId1).not.toBeNull();
    expect(voiceId2).not.toBeNull();
  });

  it('should process audio without errors', () => {
    synthesizer.playNote(60, 0.8);

    expect(() => {
      synthesizer.process();
    }).not.toThrow();
  });

  it('should get state after playing notes', () => {
    synthesizer.playNote(60, 0.8);
    const state = synthesizer.getState();

    expect(state).toBeDefined();
    expect(state.activeVoices).toBeDefined();
  });
});

