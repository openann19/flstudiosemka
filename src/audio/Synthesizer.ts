/**
 * Synthesizer - Advanced multi-oscillator synthesizer
 * Supports multiple waveforms, ADSR envelopes, LFO modulation, and FM synthesis
 * @module audio/Synthesizer
 */

import type { VoiceSettings } from '../types/audio';
import {
  AudioContextError,
  AudioProcessingError,
  InvalidParameterError,
  ValidationUtils,
} from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Voice node structure for active synthesis
 */
interface VoiceNodes {
  oscillators: OscillatorNode[];
  oscGains: GainNode[];
  masterGain: GainNode;
  filterNode: BiquadFilterNode | null;
  lfoNode: OscillatorNode | null;
  lfoGain: GainNode | null;
  envelope: GainNode;
  stopTime: number;
}

/**
 * Internal voice storage structure
 */
interface VoiceData {
  id: string;
  settings: VoiceSettings;
  nodes: VoiceNodes | null;
  isPlaying: boolean;
}

/**
 * Advanced multi-oscillator synthesizer with ADSR, LFO, and FM synthesis
 */
export class Synthesizer {
  private audioContext: AudioContext;

  private voices: Map<string, VoiceData>;

  private voiceIdCounter: number;

  private readonly defaultSettings: VoiceSettings;

  /**
   * Create a new Synthesizer instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.voices = new Map<string, VoiceData>();
    this.voiceIdCounter = 0;

    // Default settings
    this.defaultSettings = {
      oscillators: [
        { type: 'sine', frequency: 440, detune: 0, gain: 0.5 },
      ],
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.7,
        release: 0.3,
      },
      lfo: {
        enabled: false,
        frequency: 2,
        depth: 0,
        target: 'frequency',
      },
      filter: {
        enabled: false,
        type: 'lowpass',
        frequency: 20000,
        Q: 1,
      },
      fm: {
        enabled: false,
        ratio: 1,
        depth: 0,
      },
    };
  }

  /**
   * Create a new voice with settings
   * @param settings - Voice settings (optional, uses defaults if not provided)
   * @returns Voice ID string
   * @throws InvalidParameterError if settings are invalid
   */
  createVoice(settings: Partial<VoiceSettings> = {}): string {
    try {
      const voiceId = `voice_${this.voiceIdCounter++}`;
      const voiceSettings = this._mergeSettings(settings);

      this.voices.set(voiceId, {
        id: voiceId,
        settings: voiceSettings,
        nodes: null,
        isPlaying: false,
      });

      return voiceId;
    } catch (error) {
      logger.error('Synthesizer.createVoice error:', error);
      throw error;
    }
  }

  /**
   * Play a note with specified frequency and velocity
   * @param frequency - Frequency in Hz (20-20000)
   * @param velocity - Velocity 0-1 (default: 1.0)
   * @param startTime - When to start (default: current time)
   * @param voiceId - Voice ID (optional, creates new if not provided)
   * @returns Voice ID string, or null if voice not found
   * @throws InvalidParameterError if parameters are invalid
   */
  playNote(
    frequency: number,
    velocity: number = 1.0,
    startTime: number | null = null,
    voiceId: string | null = null
  ): string | null {
    try {
      ValidationUtils.validateFrequency(frequency, 'frequency');
      ValidationUtils.validateGain(velocity, 'velocity');

      if (!voiceId) {
        voiceId = this.createVoice();
      }

      const voice = this.voices.get(voiceId);
      if (!voice) {
        logger.warn('Synthesizer: Voice not found', { voiceId });
        return null;
      }

      const ctx = this.audioContext;
      const now = startTime ?? ctx.currentTime;
      const settings = voice.settings;

      // Create master gain
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);

      // Create oscillators
      const oscillators: OscillatorNode[] = [];
      const oscGains: GainNode[] = [];

      settings.oscillators.forEach((oscConfig) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = oscConfig.type as OscillatorType;
        osc.frequency.value = frequency * (1 + oscConfig.detune / 100);
        ValidationUtils.validateGain(oscConfig.gain, 'oscillator gain');
        oscGain.gain.value = oscConfig.gain;

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        oscillators.push(osc);
        oscGains.push(oscGain);
      });

      // Apply FM synthesis if enabled
      if (settings.fm?.enabled && oscillators.length >= 2) {
        const carrier = oscillators[0];
        const modulator = oscillators[1];
        
        if (!carrier || !modulator) {
          throw new Error('Carrier and modulator oscillators are required for FM synthesis');
        }

        modulator.frequency.value = frequency * (settings.fm.ratio || 1);
        const fmGain = ctx.createGain();
        fmGain.gain.value = (settings.fm.depth || 0) * frequency;
        modulator.connect(fmGain);
        fmGain.connect(carrier.frequency);
      }

      // Create filter if enabled
      let filterNode: BiquadFilterNode | null = null;
      if (settings.filter?.enabled) {
        filterNode = ctx.createBiquadFilter();
        filterNode.type = settings.filter.type as BiquadFilterType;
        ValidationUtils.validateFrequency(settings.filter.frequency, 'filter frequency');
        filterNode.frequency.value = settings.filter.frequency;
        filterNode.Q.value = settings.filter.Q;

        // Insert filter before master gain
        oscillators.forEach((_osc, index) => {
          const gain = oscGains[index];
          if (!gain) {
            return;
          }
          gain.disconnect();
          gain.connect(filterNode!);
        });
        filterNode.connect(masterGain);
      }

      // Create LFO if enabled
      let lfoNode: OscillatorNode | null = null;
      let lfoGain: GainNode | null = null;
      if (settings.lfo?.enabled) {
        lfoNode = ctx.createOscillator();
        lfoGain = ctx.createGain();

        ValidationUtils.validateFrequency(settings.lfo.frequency, 'LFO frequency');
        lfoNode.frequency.value = settings.lfo.frequency;
        ValidationUtils.validateGain(settings.lfo.depth, 'LFO depth');
        lfoGain.gain.value = settings.lfo.depth;

        lfoNode.connect(lfoGain);

        // Connect LFO to target
        if (settings.lfo.target === 'frequency' && oscillators[0]) {
          lfoGain.connect(oscillators[0].frequency);
        } else if (settings.lfo.target === 'gain') {
          lfoGain.connect(masterGain.gain);
        } else if (settings.lfo.target === 'filter' && filterNode) {
          lfoGain.connect(filterNode.frequency);
        }
      }

      // Create ADSR envelope
      const envelope = this._createEnvelope(ctx, now, settings.envelope, velocity);

      // Apply envelope to master gain
      envelope.connect(masterGain.gain);

      // Start oscillators and LFO
      oscillators.forEach((osc) => osc.start(now));
      if (lfoNode) {
        lfoNode.start(now);
      }

      // Calculate release time
      const releaseTime = settings.envelope.release;
      const stopTime = now + 0.1 + releaseTime; // Minimum 0.1s + release

      // Store voice nodes
      voice.nodes = {
        oscillators,
        oscGains,
        masterGain,
        filterNode,
        lfoNode,
        lfoGain,
        envelope,
        stopTime,
      };
      voice.isPlaying = true;

      // Auto-stop after release
      setTimeout(() => {
        this.stopNote(voiceId!);
      }, (stopTime - now) * 1000 + 100);

      return voiceId;
    } catch (error) {
      logger.error('Synthesizer.playNote error:', error);
      if (error instanceof InvalidParameterError || error instanceof AudioContextError) {
        throw error;
      }
      throw new AudioProcessingError('Failed to play note', { frequency, velocity, error });
    }
  }

  /**
   * Stop a note and trigger release phase
   * @param voiceId - Voice ID to stop
   * @throws InvalidParameterError if voiceId is invalid
   */
  stopNote(voiceId: string): void {
    try {
      ValidationUtils.validateString(voiceId, 'voiceId');

      const voice = this.voices.get(voiceId);
      if (!voice || !voice.nodes || !voice.isPlaying) {
        return;
      }

      const { nodes, settings } = voice;
      const now = this.audioContext.currentTime;
      const releaseTime = settings.envelope.release;

      // Trigger release phase
      if (nodes.masterGain) {
        nodes.masterGain.gain.cancelScheduledValues(now);
        nodes.masterGain.gain.setValueAtTime(nodes.masterGain.gain.value, now);
        nodes.masterGain.gain.linearRampToValueAtTime(0, now + releaseTime);
      }

      // Stop oscillators after release
      setTimeout(() => {
        nodes.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Already stopped - ignore error
            logger.debug('Oscillator already stopped');
          }
        });

        if (nodes.lfoNode) {
          try {
            nodes.lfoNode.stop();
            nodes.lfoNode.disconnect();
          } catch {
            // Already stopped - ignore error
            logger.debug('LFO already stopped');
          }
        }

        if (nodes.masterGain) {
          nodes.masterGain.disconnect();
        }

        voice.isPlaying = false;
        voice.nodes = null;
      }, releaseTime * 1000);
    } catch (error) {
      logger.error('Synthesizer.stopNote error:', error);
      // Don't throw - graceful degradation
    }
  }

  /**
   * Create ADSR envelope gain node
   * @private
   * @param ctx - AudioContext
   * @param startTime - Start time
   * @param envelope - Envelope configuration
   * @param velocity - Velocity multiplier
   * @returns GainNode with envelope applied
   */
  private _createEnvelope(
    ctx: AudioContext,
    startTime: number,
    envelope: VoiceSettings['envelope'],
    velocity: number
  ): GainNode {
    const gain = ctx.createGain();
    const { attack, decay, sustain, release } = envelope;

    ValidationUtils.validateTime(attack, 'envelope attack');
    ValidationUtils.validateTime(decay, 'envelope decay');
    ValidationUtils.validateGain(sustain, 'envelope sustain');
    ValidationUtils.validateTime(release, 'envelope release');

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(velocity, startTime + attack);
    gain.gain.linearRampToValueAtTime(
      velocity * sustain,
      startTime + attack + decay
    );

    // Release will be handled when note stops
    return gain;
  }

  /**
   * Merge settings with defaults
   * @private
   * @param settings - Partial settings to merge
   * @returns Complete VoiceSettings object
   */
  private _mergeSettings(settings: Partial<VoiceSettings>): VoiceSettings {
    const defaultLfo = this.defaultSettings.lfo!;
    const mergedLfo = settings.lfo
      ? {
          enabled: settings.lfo.enabled !== undefined ? settings.lfo.enabled : defaultLfo.enabled,
          frequency: settings.lfo.frequency !== undefined ? settings.lfo.frequency : defaultLfo.frequency,
          depth: settings.lfo.depth !== undefined ? settings.lfo.depth : defaultLfo.depth,
          target: settings.lfo.target !== undefined ? settings.lfo.target : defaultLfo.target,
        }
      : defaultLfo;

    const defaultFilter = this.defaultSettings.filter!;
    const mergedFilter = settings.filter
      ? {
          enabled: settings.filter.enabled !== undefined ? settings.filter.enabled : defaultFilter.enabled,
          type: settings.filter.type !== undefined ? settings.filter.type : defaultFilter.type,
          frequency: settings.filter.frequency !== undefined ? settings.filter.frequency : defaultFilter.frequency,
          Q: settings.filter.Q !== undefined ? settings.filter.Q : defaultFilter.Q,
        }
      : defaultFilter;

    const defaultFm = this.defaultSettings.fm!;
    const mergedFm = settings.fm
      ? {
          enabled: settings.fm.enabled !== undefined ? settings.fm.enabled : defaultFm.enabled,
          ratio: settings.fm.ratio !== undefined ? settings.fm.ratio : defaultFm.ratio,
          depth: settings.fm.depth !== undefined ? settings.fm.depth : defaultFm.depth,
        }
      : defaultFm;

    return {
      oscillators: settings.oscillators || this.defaultSettings.oscillators,
      envelope: { ...this.defaultSettings.envelope, ...(settings.envelope || {}) },
      lfo: mergedLfo,
      filter: mergedFilter,
      fm: mergedFm,
    };
  }

  /**
   * Update voice settings
   * @param voiceId - Voice ID
   * @param settings - New settings to apply
   * @throws InvalidParameterError if voiceId is invalid
   */
  updateVoice(voiceId: string, settings: Partial<VoiceSettings>): void {
    try {
      ValidationUtils.validateString(voiceId, 'voiceId');

      const voice = this.voices.get(voiceId);
      if (!voice) {
        throw new InvalidParameterError('voiceId', voiceId, 'existing voice ID');
      }

      voice.settings = this._mergeSettings({ ...voice.settings, ...settings });
    } catch (error) {
      logger.error('Synthesizer.updateVoice error:', error);
      throw error;
    }
  }

  /**
   * Get voice data
   * @param voiceId - Voice ID
   * @returns Voice data object or undefined if not found
   */
  getVoice(voiceId: string): VoiceData | undefined {
    return this.voices.get(voiceId);
  }

  /**
   * Stop all active voices
   */
  stopAll(): void {
    for (const voiceId of this.voices.keys()) {
      this.stopNote(voiceId);
    }
  }

  /**
   * Get all active voice IDs
   * @returns Array of active voice IDs
   */
  getActiveVoices(): string[] {
    return Array.from(this.voices.keys()).filter(
      (id) => this.voices.get(id)?.isPlaying
    );
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.Synthesizer = Synthesizer;
}

