/**
 * AudioContext factory for test mocks
 * Creates mock AudioContext instances for testing
 * @module tests/factories/audio-context-factory
 */

/**
 * Create a mock AudioContext for testing
 * @param options - AudioContext configuration options
 * @returns Mock AudioContext instance
 */
export function createMockAudioContext(options: {
  sampleRate?: number;
  currentTime?: number;
  state?: AudioContextState;
} = {}): AudioContext {
  const { sampleRate = 44100, currentTime = 0, state = 'running' } = options;

  // Create a mock that passes instanceof checks
  const mockContext = Object.create(AudioContext.prototype);
  
  // Set properties
  Object.assign(mockContext, {
    sampleRate,
    currentTime,
    state,
    destination: {
      connect: jest.fn(),
      disconnect: jest.fn(),
      numberOfInputs: 0,
      numberOfOutputs: 0,
      channelCount: 2,
      channelCountMode: 'max' as ChannelCountMode,
      channelInterpretation: 'speakers' as ChannelInterpretation,
      maxChannelCount: 2,
      context: null as unknown as AudioContext,
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as AudioDestinationNode,
    createOscillator: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      frequency: {
        value: 440,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      } as unknown as AudioParam,
      detune: { value: 0 } as AudioParam,
      type: 'sine',
      start: jest.fn(),
      stop: jest.fn(),
      onended: null,
    })),
    createGain: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: {
        value: 1,
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      } as unknown as AudioParam,
    })),
    createBiquadFilter: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      type: 'lowpass',
      frequency: { value: 350 } as AudioParam,
      Q: { value: 1 } as AudioParam,
    })),
    createDelay: jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      delayTime: { value: 0 } as AudioParam,
      maxDelayTime: 1,
    })),
    createBuffer: jest.fn((channels: number, length: number, sampleRate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: jest.fn(() => new Float32Array(length)),
      copyFromChannel: jest.fn(),
      copyToChannel: jest.fn(),
    })),
    decodeAudioData: jest.fn(() =>
      Promise.resolve({
        numberOfChannels: 2,
        length: 44100,
        sampleRate: 44100,
        duration: 1,
        getChannelData: jest.fn(() => new Float32Array(44100)),
        copyFromChannel: jest.fn(),
        copyToChannel: jest.fn(),
      } as AudioBuffer)
    ),
    suspend: jest.fn(() => Promise.resolve()),
    resume: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
  });

  return mockContext;
}

/**
 * Create a mock AudioBuffer for testing
 * @param options - AudioBuffer configuration options
 * @returns Mock AudioBuffer instance
 */
export function createMockAudioBuffer(options: {
  numberOfChannels?: number;
  length?: number;
  sampleRate?: number;
} = {}): AudioBuffer {
  const {
    numberOfChannels = 2,
    length = 44100,
    sampleRate = 44100,
  } = options;

  const channelData = Array.from({ length: numberOfChannels }, () =>
    new Float32Array(length)
  );

  return {
    numberOfChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn((channel: number) => channelData[channel] ?? new Float32Array(length)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  } as unknown as AudioBuffer;
}

