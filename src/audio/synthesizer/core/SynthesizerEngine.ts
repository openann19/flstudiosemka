/**
 * SynthesizerEngine - Main synthesizer orchestrator
 * Coordinates all modules: oscillators, filters, envelopes, LFOs, effects, modulation
 * @module audio/synthesizer/core/SynthesizerEngine
 */

import { VoiceManager } from './VoiceManager';
import { ModulationMatrix } from './ModulationMatrix';
import { MultiLFO } from '../lfos/MultiLFO';
import { ADSREnvelope } from '../envelopes/ADSREnvelope';
import { OscillatorModule } from '../oscillators/OscillatorModule';
import { MultimodeFilter } from '../filters/MultimodeFilter';
import { DelayEffect } from '../effects/DelayEffect';
import { ReverbEffect } from '../effects/ReverbEffect';
import { ChorusEffect } from '../effects/ChorusEffect';
import { PhaserEffect } from '../effects/PhaserEffect';
import { DistortionEffect } from '../effects/DistortionEffect';
import type {
  SynthesizerVoiceConfig,
  SynthesizerState,
  ActiveVoice,
} from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Convert MIDI note to frequency
 */
function midiNoteToFrequency(note: number, tuning: number = 0): number {
  const cents = tuning / 100;
  return 440 * Math.pow(2, (note - 69 + cents) / 12);
}

/**
 * Main synthesizer engine
 */
export class SynthesizerEngine {
  private audioContext: AudioContext;
  private voiceManager: VoiceManager;
  private modulationMatrix: ModulationMatrix;
  private multiLFO: MultiLFO;
  private config: SynthesizerVoiceConfig;
  private state: SynthesizerState;
  private lastNoteFrequency: number = 440;

  /**
   * Create a new synthesizer engine
   */
  constructor(audioContext: AudioContext, config: SynthesizerVoiceConfig) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new Error('SynthesizerEngine: Invalid AudioContext');
    }
    this.audioContext = audioContext;
    this.config = { ...config };
    this.voiceManager = new VoiceManager(16, this.config.voiceMode);
    this.modulationMatrix = new ModulationMatrix();
    this.multiLFO = new MultiLFO(audioContext);

    // Initialize LFOs
    this.config.lfos.forEach((lfoConfig, index) => {
      this.multiLFO.initializeLFO(index, lfoConfig);
    });

    this.state = {
      config: this.config,
      activeVoices: new Map(),
      polyphony: 16,
      currentBPM: 120,
      isPlaying: false,
    };

    this.setupModulationRouting();
  }

  /**
   * Setup modulation routing
   */
  private setupModulationRouting(): void {
    // Register LFOs as modulation sources
    this.config.lfos.forEach((_lfo, index) => {
      const lfo = this.multiLFO.getLFO(index);
      if (lfo) {
        this.modulationMatrix.getRouter().registerSource(`lfo${(index + 1) as 1 | 2 | 3}`, lfo);
      }
    });
  }

  /**
   * Play a note
   */
  playNote(note: number, velocity: number = 1.0, startTime?: number): string | null {
    try {
      const now = startTime ?? this.audioContext.currentTime;
      const frequency = midiNoteToFrequency(note, this.config.masterTuning);

      // Handle portamento
      let targetFrequency = frequency;
      if (this.config.portamento > 0 && this.lastNoteFrequency > 0) {
        // Portamento will be handled by frequency ramp
        targetFrequency = frequency;
      }
      this.lastNoteFrequency = frequency;

      // Create voice nodes
      const nodes = this.createVoiceNodes(targetFrequency, velocity, now);

      // Allocate voice
      const voiceId = this.voiceManager.allocateVoice(
        note,
        targetFrequency,
        velocity,
        now,
        nodes
      );

      // Start envelopes
      this.triggerEnvelopes(voiceId, velocity, now);

      // Update state
      const voice = this.voiceManager.getVoice(voiceId);
      if (voice) {
        this.state.activeVoices.set(voiceId, voice);
      }

      return voiceId;
    } catch (error) {
      logger.error('SynthesizerEngine: Error playing note', { error, note, velocity });
      return null;
    }
  }

  /**
   * Create voice audio nodes
   */
  private createVoiceNodes(
    frequency: number,
    _velocity: number,
    startTime: number
  ): ActiveVoice['nodes'] {
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    const masterGain = this.audioContext.createGain();
    masterGain.gain.value = 0;

    // Create oscillators
    this.config.oscillators.forEach((oscConfig, index) => {
      if (!oscConfig.enabled) {
        return;
      }

      const oscModule = new OscillatorModule(
        this.audioContext,
        oscConfig,
        `osc${(index + 1) as 1 | 2 | 3 | 4}Pitch`
      );
      oscModule.setFrequency(frequency);
      oscModule.start(startTime);

      const osc = oscModule.getOscillator();
      const gain = oscModule.getGainNode();

      if (osc && gain) {
        oscillators.push(osc);
        gains.push(gain);
        gain.connect(masterGain);
      }
    });

    // Create filter
    let filter: BiquadFilterNode | undefined;
    if (this.config.filter.enabled) {
      const filterModule = new MultimodeFilter(
        this.audioContext,
        this.config.filter,
        'filterCutoff'
      );
      const filterNode = filterModule.getFilterNode();
      if (filterNode) {
        filter = filterNode;
        masterGain.connect(filter);
      }
    }

    // Connect to effects chain
    let currentNode: AudioNode = filter ?? masterGain;
    currentNode = this.connectEffectsChain(currentNode);

    // Connect to destination
    currentNode.connect(this.audioContext.destination);

    return {
      oscillators,
      gains,
      filter,
      masterGain,
    };
  }

  /**
   * Connect effects chain
   */
  private connectEffectsChain(input: AudioNode): AudioNode {
    let currentNode: AudioNode = input;

    const effects = [
      { effect: this.config.effects.distortion, create: () => new DistortionEffect(this.audioContext, this.config.effects.distortion) },
      { effect: this.config.effects.phaser, create: () => new PhaserEffect(this.audioContext, this.config.effects.phaser) },
      { effect: this.config.effects.chorus, create: () => new ChorusEffect(this.audioContext, this.config.effects.chorus) },
      { effect: this.config.effects.delay, create: () => new DelayEffect(this.audioContext, this.config.effects.delay) },
      { effect: this.config.effects.reverb, create: () => new ReverbEffect(this.audioContext, this.config.effects.reverb) },
    ];

    for (const { effect, create } of effects) {
      if (effect.enabled) {
        const effectInstance = create();
        currentNode.connect(effectInstance.getInputNode());
        currentNode = effectInstance.getOutputNode();
      }
    }

    return currentNode;
  }

  /**
   * Trigger envelopes for a voice
   */
  private triggerEnvelopes(voiceId: string, velocity: number, startTime: number): void {
    const voice = this.voiceManager.getVoice(voiceId);
    if (!voice) {
      return;
    }

    // Create amp envelope
    const ampEnvelope = new ADSREnvelope(this.audioContext, this.config.ampEnvelope);
    ampEnvelope.setVelocity(velocity);
    ampEnvelope.triggerAttack(startTime);

    // Connect to master gain
    ampEnvelope.getGainNode().connect(voice.nodes.masterGain.gain);

    // Create filter envelope if needed
    if (this.config.filter.enabled && this.config.filter.envelopeAmount !== 0) {
      const filterEnvelope = new ADSREnvelope(this.audioContext, this.config.filterEnvelope);
      filterEnvelope.setVelocity(velocity);
      filterEnvelope.triggerAttack(startTime);
      // Filter envelope modulation is handled by filter module
    }
  }

  /**
   * Stop a note
   */
  stopNote(voiceId: string): void {
    this.voiceManager.releaseVoice(voiceId);
    this.state.activeVoices.delete(voiceId);
  }

  /**
   * Stop all notes
   */
  stopAllNotes(): void {
    this.voiceManager.stopAllVoices();
    this.state.activeVoices.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SynthesizerVoiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.state.config = this.config;

    // Update voice manager
    if (config.voiceMode) {
      this.voiceManager.setVoiceMode(config.voiceMode);
    }

    // Update LFOs
    if (config.lfos) {
      config.lfos.forEach((lfoConfig, index) => {
        this.multiLFO.updateLFO(index, lfoConfig);
      });
    }
  }

  /**
   * Set BPM for tempo sync
   */
  setBPM(bpm: number): void {
    this.state.currentBPM = bpm;
    this.multiLFO.setBPM(bpm);
  }

  /**
   * Process audio (call every frame)
   */
  process(): void {
    this.multiLFO.process();
    this.modulationMatrix.process();
  }

  /**
   * Get current state
   */
  getState(): SynthesizerState {
    return {
      ...this.state,
      activeVoices: new Map(this.state.activeVoices),
    };
  }

  /**
   * Get configuration
   */
  getConfig(): SynthesizerVoiceConfig {
    return { ...this.config };
  }
}

