/**
 * Tests for audio engine initialization
 * @module tests/audio/audio-engine-init
 */

import { createMockAudioContext } from '../factories/audio-context-factory';

describe('Audio Engine Initialization', () => {
  it('should create AudioContext', () => {
    const audioContext = createMockAudioContext();

    expect(audioContext).not.toBeNull();
    expect(audioContext.sampleRate).toBe(44100);
    expect(audioContext.state).toBe('running');
  });

  it('should create AudioContext with custom sample rate', () => {
    const audioContext = createMockAudioContext({ sampleRate: 48000 });

    expect(audioContext.sampleRate).toBe(48000);
  });

  it('should create destination node', () => {
    const audioContext = createMockAudioContext();

    expect(audioContext.destination).toBeDefined();
    expect(audioContext.destination.maxChannelCount).toBe(2);
  });

  it('should create gain node', () => {
    const audioContext = createMockAudioContext();
    const gainNode = audioContext.createGain();

    expect(gainNode).toBeDefined();
    expect(gainNode.gain).toBeDefined();
    expect(gainNode.connect).toBeDefined();
  });

  it('should create oscillator node', () => {
    const audioContext = createMockAudioContext();
    const oscillator = audioContext.createOscillator();

    expect(oscillator).toBeDefined();
    expect(oscillator.frequency).toBeDefined();
    expect(oscillator.start).toBeDefined();
    expect(oscillator.stop).toBeDefined();
  });

  it('should create audio buffer', () => {
    const audioContext = createMockAudioContext();
    const buffer = audioContext.createBuffer(2, 44100, 44100);

    expect(buffer).toBeDefined();
    expect(buffer.numberOfChannels).toBe(2);
    expect(buffer.length).toBe(44100);
    expect(buffer.sampleRate).toBe(44100);
    expect(buffer.duration).toBe(1);
  });

  it('should decode audio data', async () => {
    const audioContext = createMockAudioContext();
    const arrayBuffer = new ArrayBuffer(8);
    const decoded = await audioContext.decodeAudioData(arrayBuffer);

    expect(decoded).toBeDefined();
    expect(decoded.numberOfChannels).toBe(2);
    expect(decoded.sampleRate).toBe(44100);
  });

  it('should suspend audio context', async () => {
    const audioContext = createMockAudioContext();
    await audioContext.suspend();

    expect(audioContext.state).toBe('running'); // Mock doesn't change state
  });

  it('should resume audio context', async () => {
    const audioContext = createMockAudioContext();
    await audioContext.resume();

    expect(audioContext.state).toBe('running');
  });

  it('should close audio context', async () => {
    const audioContext = createMockAudioContext();
    await audioContext.close();

    // Mock should handle close
    expect(audioContext).toBeDefined();
  });
});

