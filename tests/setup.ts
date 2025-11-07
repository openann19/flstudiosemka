/**
 * Jest setup file
 * Configures test environment and mocks
 */

import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for tests
global.React = React;

// Mock Web Audio API
const createMockAudioParam = (value: number = 0) => ({
  value,
  setValueAtTime: jest.fn(),
  linearRampToValueAtTime: jest.fn(),
  exponentialRampToValueAtTime: jest.fn(),
  setTargetAtTime: jest.fn(),
  setValueCurveAtTime: jest.fn(),
  cancelScheduledValues: jest.fn(),
  cancelAndHoldAtTime: jest.fn(),
});

const createMockAudioNode = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  numberOfInputs: 1,
  numberOfOutputs: 1,
  channelCount: 2,
  channelCountMode: 'max' as ChannelCountMode,
  channelInterpretation: 'speakers' as ChannelInterpretation,
  context: null as unknown as AudioContext,
});

global.AudioContext = class MockAudioContext {
  destination: AudioDestinationNode;
  sampleRate: number;
  currentTime: number;
  state: AudioContextState;

  constructor() {
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {
      ...createMockAudioNode(),
      maxChannelCount: 2,
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      removeEventListener: jest.fn(),
    } as AudioDestinationNode;
  }

  createOscillator(): OscillatorNode {
    return {
      ...createMockAudioNode(),
      frequency: createMockAudioParam(440),
      detune: createMockAudioParam(0),
      type: 'sine',
      start: jest.fn(),
      stop: jest.fn(),
    } as unknown as OscillatorNode;
  }

  createGain(): GainNode {
    return {
      ...createMockAudioNode(),
      gain: createMockAudioParam(1),
    } as unknown as GainNode;
  }

  createBiquadFilter(): BiquadFilterNode {
    return {
      ...createMockAudioNode(),
      type: 'lowpass',
      frequency: createMockAudioParam(350),
      detune: createMockAudioParam(0),
      Q: createMockAudioParam(1),
      gain: createMockAudioParam(0),
    } as unknown as BiquadFilterNode;
  }

  createDelay(): DelayNode {
    return {
      ...createMockAudioNode(),
      delayTime: createMockAudioParam(0),
      maxDelayTime: 1,
    } as unknown as DelayNode;
  }

  createConvolver(): ConvolverNode {
    return {
      ...createMockAudioNode(),
      buffer: null,
      normalize: true,
    } as unknown as ConvolverNode;
  }

  createAnalyser(): AnalyserNode {
    return {
      ...createMockAudioNode(),
      fftSize: 2048,
      frequencyBinCount: 1024,
      minDecibels: -100,
      maxDecibels: -30,
      smoothingTimeConstant: 0.8,
      getFloatFrequencyData: jest.fn(),
      getByteFrequencyData: jest.fn(),
      getFloatTimeDomainData: jest.fn(),
      getByteTimeDomainData: jest.fn(),
    } as unknown as AnalyserNode;
  }

  createBufferSource(): AudioBufferSourceNode {
    return {
      ...createMockAudioNode(),
      buffer: null,
      playbackRate: createMockAudioParam(1),
      detune: createMockAudioParam(0),
      loop: false,
      loopStart: 0,
      loopEnd: 0,
      start: jest.fn(),
      stop: jest.fn(),
    } as unknown as AudioBufferSourceNode;
  }

  createScriptProcessor(): ScriptProcessorNode {
    return {
      ...createMockAudioNode(),
      bufferSize: 4096,
      numberOfInputChannels: 2,
      numberOfOutputChannels: 2,
    } as unknown as ScriptProcessorNode;
  }

  createWaveShaper(): WaveShaperNode {
    return {
      ...createMockAudioNode(),
      curve: null,
      oversample: 'none' as OverSampleType,
    } as unknown as WaveShaperNode;
  }

  createDynamicsCompressor(): DynamicsCompressorNode {
    return {
      ...createMockAudioNode(),
      threshold: createMockAudioParam(-24),
      knee: createMockAudioParam(30),
      ratio: createMockAudioParam(12),
      attack: createMockAudioParam(0.003),
      release: createMockAudioParam(0.25),
    } as unknown as DynamicsCompressorNode;
  }

  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
    return {
      sampleRate,
      length,
      duration: length / sampleRate,
      numberOfChannels,
      getChannelData: jest.fn(() => new Float32Array(length)),
      copyFromChannel: jest.fn(),
      copyToChannel: jest.fn(),
    } as unknown as AudioBuffer;
  }

  decodeAudioData(): Promise<AudioBuffer> {
    return Promise.resolve(this.createBuffer(2, 44100, 44100));
  }

  suspend(): Promise<void> {
    return Promise.resolve();
  }

  resume(): Promise<void> {
    return Promise.resolve();
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
} as unknown as typeof AudioContext;

// Mock MediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({} as MediaStream)),
  },
});

// Suppress console errors in tests unless needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      originalError.call(console, ...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock requestAnimationFrame for timing tests
global.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
  return setTimeout(cb, 16);
});

global.cancelAnimationFrame = jest.fn((id: number) => {
  clearTimeout(id);
});

// Mock performance.now for audio timing tests
const mockPerformanceNow = jest.fn(() => Date.now());
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string): string | null => store[key] ?? null),
    setItem: jest.fn((key: string, value: string): void => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string): void => {
      delete store[key];
    }),
    clear: jest.fn((): void => {
      store = {};
    }),
    get length(): number {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Custom matchers for audio testing
expect.extend({
  toBeValidAudioParam(received: unknown): jest.CustomMatcherResult {
    const pass =
      typeof received === 'object' &&
      received !== null &&
      'value' in received &&
      typeof (received as { value: number }).value === 'number';

    return {
      message: (): string =>
        pass
          ? `expected ${received} not to be a valid AudioParam`
          : `expected ${received} to be a valid AudioParam`,
      pass,
    };
  },
});

