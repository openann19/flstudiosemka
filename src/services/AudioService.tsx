/**
 * AudioService - Audio synthesis, effects, and sample loading
 * Strict TypeScript implementation with comprehensive error handling
 */

// Web Audio API types are global in TypeScript
import type { TrackType, FilterType, MasterEffects } from '../types/FLStudio.types';
import { SynthesizerEngine } from '../audio/synthesizer/core/SynthesizerEngine';
import type { SynthesizerVoiceConfig } from '../types/synthesizer.types';

export class AudioService {
  private audioContext: AudioContext;
  private busManager: unknown | null = null;
  private synthesizerEngines: Map<number, SynthesizerEngine> = new Map();
  // Node pools for reduced allocation overhead
  private gainNodePool: GainNode[] = [];
  private readonly poolSize = 20; // Pre-allocate 20 nodes of each type

  constructor(audioContext: AudioContext) {
    if (!audioContext) {
      throw new Error('AudioService: AudioContext is required');
    }
    this.audioContext = audioContext;
    this.initializeNodePools();
  }

  /**
   * Initialize node pools for better performance
   */
  private initializeNodePools(): void {
    // Pre-allocate gain nodes (they can be reused)
    for (let i = 0; i < this.poolSize; i++) {
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = 0;
      this.gainNodePool.push(gainNode);
    }
    // Note: Oscillators cannot be reused once stopped, so we create them on demand
    // but we can optimize by creating them in advance when needed
  }

  /**
   * Get a gain node from pool or create new one
   */
  private getGainNode(): GainNode {
    const node = this.gainNodePool.pop();
    if (node) {
      // Reset gain value
      node.gain.value = 0;
      return node;
    }
    // Pool exhausted, create new one
    return this.audioContext.createGain();
  }

  /**
   * Return gain node to pool (only if not connected)
   */
  private returnGainNode(node: GainNode): void {
    try {
      node.disconnect();
      node.gain.value = 0;
      if (this.gainNodePool.length < this.poolSize) {
        this.gainNodePool.push(node);
      }
    } catch {
      // Node already disconnected or in use, discard it
    }
  }

  /**
   * Set bus manager for routing
   */
  setBusManager(busManager: unknown): void {
    this.busManager = busManager;
  }

  /**
   * Get frequency for sound type and name
   */
  getFrequencyForSound(type: TrackType, name: string): number {
    const nameLower = name.toLowerCase();
    switch (type) {
      case 'drum':
        if (nameLower.includes('kick')) return 60;
        if (nameLower.includes('snare')) return 200;
        if (nameLower.includes('hi-hat')) return 8000;
        if (nameLower.includes('crash')) return 300;
        return 150;
      case 'synth':
        if (nameLower.includes('bass')) return 110;
        if (nameLower.includes('lead')) return 660;
        if (nameLower.includes('pad')) return 220;
        if (nameLower === 'test') return 440;
        return 440;
      default:
        return 440;
    }
  }

  /**
   * Get duration for sound type and name
   */
  getDurationForSound(type: TrackType, name: string): number {
    const nameLower = name.toLowerCase();
    switch (type) {
      case 'drum':
        if (nameLower.includes('kick')) return 0.2;
        if (nameLower.includes('snare')) return 0.15;
        if (nameLower.includes('hi-hat')) return 0.05;
        return 0.1;
      case 'synth':
        if (nameLower === 'test') return 0.5;
        return 0.4;
      default:
        return 0.2;
    }
  }

  /**
   * Get waveform type for sound
   */
  getWaveformForSound(type: TrackType, name: string): 'sine' | 'square' | 'sawtooth' | 'triangle' {
    const nameLower = name.toLowerCase();
    switch (type) {
      case 'drum':
        return 'square';
      case 'synth':
        if (nameLower.includes('pad')) return 'sine';
        if (nameLower.includes('lead')) return 'sawtooth';
        if (nameLower === 'test') return 'sine';
        return 'triangle';
      default:
        return 'sine';
    }
  }

  /**
   * Get or create synthesizer engine for track
   */
  getSynthesizerEngine(trackId: number, config?: SynthesizerVoiceConfig): SynthesizerEngine | null {
    if (!this.audioContext) {
      return null;
    }

    if (!this.synthesizerEngines.has(trackId)) {
      if (!config) {
        // Create default config
        config = this.createDefaultSynthesizerConfig();
      }
      const engine = new SynthesizerEngine(this.audioContext, config);
      this.synthesizerEngines.set(trackId, engine);
    }

    return this.synthesizerEngines.get(trackId) ?? null;
  }

  /**
   * Create synthesizer engine for track
   */
  createSynthesizerEngine(trackId: number, config: SynthesizerVoiceConfig): SynthesizerEngine {
    if (!this.audioContext) {
      throw new Error('AudioService: AudioContext not available');
    }

    const engine = new SynthesizerEngine(this.audioContext, config);
    this.synthesizerEngines.set(trackId, engine);
    return engine;
  }

  /**
   * Update synthesizer configuration for track
   */
  updateSynthesizerConfig(trackId: number, config: Partial<SynthesizerVoiceConfig>): void {
    const engine = this.synthesizerEngines.get(trackId);
    if (engine) {
      engine.updateConfig(config);
    }
  }

  /**
   * Play sound with synthesis
   */
  playSound(
    type: TrackType,
    name: string,
    trackId: number | null = null,
    trackMixer: unknown | null = null,
    masterEffects: MasterEffects | null = null
  ): void {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      return;
    }

    // Use new synthesizer for synth tracks
    if (type === 'synth' && trackId !== null) {
      const engine = this.getSynthesizerEngine(trackId);
      if (engine) {
        const frequency = this.getFrequencyForSound(type, name);
        const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
        engine.playNote(midiNote, 0.8);
        return;
      }
    }

    // Fallback to simple oscillator for drums and other types
    try {
      const oscillator: OscillatorNode = this.audioContext.createOscillator();
      const gainNode: GainNode = this.getGainNode(); // Use pooled node

      const frequency = this.getFrequencyForSound(type, name);
      const duration = this.getDurationForSound(type, name);
      const waveform = this.getWaveformForSound(type, name);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = waveform;

      // Enhanced envelope with better curves for smoother sound
      const currentTime = this.audioContext.currentTime;
      const attackTime = 0.005; // 5ms attack for snappier transients
      const releaseTime = duration * 0.3; // 30% of duration for release
      const sustainLevel = 0.3;

      gainNode.gain.setValueAtTime(0, currentTime);
      // Linear attack for precise control
      gainNode.gain.linearRampToValueAtTime(sustainLevel, currentTime + attackTime);
      // Exponential release for natural decay
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration - releaseTime);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

      if (trackId !== null && trackMixer) {
        this.connectThroughTrackMixer(oscillator, gainNode, trackMixer);
      } else if (masterEffects) {
        this.connectWithMasterEffects(oscillator, gainNode, masterEffects);
      } else {
        this.connectToDestination(oscillator, gainNode);
      }

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      // Cleanup: return gain node to pool when oscillator finishes
      oscillator.onended = (): void => {
        try {
          oscillator.disconnect();
          this.returnGainNode(gainNode);
        } catch {
          // Already disconnected, ignore
        }
      };
    } catch (error) {
      throw new Error(`AudioService: Failed to play sound - ${error}`);
    }
  }

  /**
   * Create default synthesizer configuration
   */
  private createDefaultSynthesizerConfig(): SynthesizerVoiceConfig {
    return {
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
        { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
        { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
        { enabled: false, waveform: 'sine', octave: 0, semitone: 0, detune: 0, gain: 0, pulseWidth: 0.5, phase: 0, sync: false, ringMod: false },
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
      lfos: [
        { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
        { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
        { enabled: false, waveform: 'sine', rate: 2, tempoSync: false, syncDivision: '1/4', depth: 0, delay: 0, fadeIn: 0, phase: 0 },
      ],
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
  }

  /**
   * Connect audio through track mixer
   */
  private connectThroughTrackMixer(
    oscillator: OscillatorNode,
    gainNode: GainNode,
    trackMixer: unknown
  ): void {
    try {
      oscillator.connect(gainNode);
      if (
        trackMixer &&
        typeof trackMixer === 'object' &&
        'getInput' in trackMixer &&
        typeof (trackMixer as { getInput: () => AudioNode }).getInput === 'function'
      ) {
        const input = (trackMixer as { getInput: () => AudioNode }).getInput();
        gainNode.connect(input);

        if (
          'getOutput' in trackMixer &&
          typeof (trackMixer as { getOutput: () => AudioNode }).getOutput === 'function'
        ) {
          const output = (trackMixer as { getOutput: () => AudioNode }).getOutput();
          if (this.busManager) {
            this.connectToBusManager(output);
          } else {
            output.connect(this.audioContext.destination);
          }
        }
      } else {
        this.connectToDestination(oscillator, gainNode);
      }
    } catch (error) {
      throw new Error(`AudioService: Failed to connect through track mixer - ${error}`);
    }
  }

  /**
   * Connect audio through master effects chain
   */
  private connectWithMasterEffects(
    oscillator: OscillatorNode,
    gainNode: GainNode,
    masterEffects: MasterEffects
  ): void {
    try {
      oscillator.connect(gainNode);
      let currentNode: AudioNode = gainNode;

      if (masterEffects.distortion.enabled) {
        currentNode = this.createDistortion(currentNode, masterEffects.distortion.amount);
      }

      if (masterEffects.filter.enabled) {
        currentNode = this.createFilter(currentNode, masterEffects.filter);
      }

      if (masterEffects.delay.enabled) {
        currentNode = this.createDelay(currentNode, masterEffects.delay);
      }

      if (masterEffects.reverb.enabled) {
        currentNode = this.createReverb(currentNode, masterEffects.reverb);
      }

      if (this.busManager) {
        this.connectToBusManager(currentNode);
      } else {
        currentNode.connect(this.audioContext.destination);
      }
    } catch (error) {
      throw new Error(`AudioService: Failed to connect with master effects - ${error}`);
    }
  }

  /**
   * Connect to destination
   */
  private connectToDestination(oscillator: OscillatorNode, gainNode: GainNode): void {
    try {
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
    } catch (error) {
      throw new Error(`AudioService: Failed to connect to destination - ${error}`);
    }
  }

  /**
   * Connect to bus manager
   */
  private connectToBusManager(node: AudioNode): void {
    try {
      if (
        this.busManager &&
        typeof this.busManager === 'object' &&
        'getMasterBus' in this.busManager &&
        typeof (this.busManager as { getMasterBus: () => AudioNode }).getMasterBus === 'function'
      ) {
        const masterBus = (this.busManager as { getMasterBus: () => AudioNode }).getMasterBus();
        node.connect(masterBus);
      } else {
        node.connect(this.audioContext.destination);
      }
    } catch (error) {
      throw new Error(`AudioService: Failed to connect to bus manager - ${error}`);
    }
  }

  /**
   * Create distortion effect
   */
  createDistortion(inputNode: AudioNode, amount: number): WaveShaperNode {
    try {
      const distortion: WaveShaperNode = this.audioContext.createWaveShaper();
      const k = amount * 50;
      const samples = 44100;
      const curve = new Float32Array(samples);

      for (let i = 0; i < samples; i += 1) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((3 + k) * x * 20 * Math.PI) / (1 + k * Math.abs(x));
      }

      distortion.curve = curve;
      distortion.oversample = '4x';
      inputNode.connect(distortion);
      return distortion;
    } catch (error) {
      throw new Error(`AudioService: Failed to create distortion - ${error}`);
    }
  }

  /**
   * Create filter effect
   */
  createFilter(
    inputNode: AudioNode,
    filterSettings: { type: FilterType; frequency: number }
  ): BiquadFilterNode {
    try {
      const filter: BiquadFilterNode = this.audioContext.createBiquadFilter();
      filter.type = filterSettings.type;
      filter.frequency.setValueAtTime(filterSettings.frequency, this.audioContext.currentTime);
      filter.Q.setValueAtTime(1, this.audioContext.currentTime);
      inputNode.connect(filter);
      return filter;
    } catch (error) {
      throw new Error(`AudioService: Failed to create filter - ${error}`);
    }
  }

  /**
   * Create delay effect
   */
  createDelay(
    inputNode: AudioNode,
    delaySettings: { time: number; feedback: number; wet: number }
  ): GainNode {
    try {
      const delay: DelayNode = this.audioContext.createDelay();
      const feedback: GainNode = this.audioContext.createGain();
      const wetGain: GainNode = this.audioContext.createGain();
      const dryGain: GainNode = this.audioContext.createGain();

      delay.delayTime.setValueAtTime(delaySettings.time, this.audioContext.currentTime);
      feedback.gain.setValueAtTime(delaySettings.feedback, this.audioContext.currentTime);
      wetGain.gain.setValueAtTime(delaySettings.wet, this.audioContext.currentTime);
      dryGain.gain.setValueAtTime(1 - delaySettings.wet, this.audioContext.currentTime);

      inputNode.connect(dryGain);
      inputNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);

      const output: GainNode = this.audioContext.createGain();
      dryGain.connect(output);
      wetGain.connect(output);

      return output;
    } catch (error) {
      throw new Error(`AudioService: Failed to create delay - ${error}`);
    }
  }

  /**
   * Create reverb effect
   */
  createReverb(
    inputNode: AudioNode,
    reverbSettings: { decay: number; wet: number }
  ): GainNode {
    try {
      const reverb: ConvolverNode = this.audioContext.createConvolver();
      const wetGain: GainNode = this.audioContext.createGain();
      const dryGain: GainNode = this.audioContext.createGain();

      const length = this.audioContext.sampleRate * reverbSettings.decay;
      const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

      for (let channel = 0; channel < 2; channel += 1) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i += 1) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
      }

      reverb.buffer = impulse;
      wetGain.gain.setValueAtTime(reverbSettings.wet, this.audioContext.currentTime);
      dryGain.gain.setValueAtTime(1 - reverbSettings.wet, this.audioContext.currentTime);

      inputNode.connect(dryGain);
      inputNode.connect(reverb);
      reverb.connect(wetGain);

      const output: GainNode = this.audioContext.createGain();
      dryGain.connect(output);
      wetGain.connect(output);

      return output;
    } catch (error) {
      throw new Error(`AudioService: Failed to create reverb - ${error}`);
    }
  }

  /**
   * Load audio sample file
   */
  async loadAudioSample(file: File): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioService: AudioContext not available');
    }

    try {
      if (typeof window !== 'undefined' && 'loadAudioSample' in window) {
        const loadFn = (window as { loadAudioSample?: (ctx: AudioContext, f: File) => Promise<AudioBuffer> }).loadAudioSample;
        if (loadFn && typeof loadFn === 'function') {
          return await loadFn(this.audioContext, file);
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      throw new Error(`AudioService: Failed to load audio sample - ${error}`);
    }
  }
}

