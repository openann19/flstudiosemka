/**
 * TrackMixer - Per-track mixing with effects, EQ, compression, and send/return
 * Manages individual track processing and routing
 * @module mixer/TrackMixer
 */

import { EffectChain } from '../effects/EffectChain';
import { EQ } from '../effects/EQ';
import { Compressor } from '../effects/Compressor';
import {
  AudioContextError,
  InvalidParameterError,
  ValidationUtils,
} from '../utils/errors';

/**
 * Track mixer state
 */
export interface TrackMixerState {
  trackId: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  eqEnabled: boolean;
  compressorEnabled: boolean;
  eqSettings: ReturnType<EQ['getSettings']>;
  compressorSettings: ReturnType<Compressor['getSettings']>;
}

/**
 * Per-track mixing with effects, EQ, compression, and send/return
 */
export class TrackMixer {
  private audioContext: AudioContext;

  private trackId: string;

  private inputNode: GainNode;

  private preFxGain: GainNode;

  private postFxGain: GainNode;

  private outputNode: GainNode;

  private effectChain: EffectChain;

  private eq: EQ;

  private eqEnabled: boolean;

  private compressor: Compressor;

  private compressorEnabled: boolean;

  private sends: Map<string, GainNode>;

  private returnGain: GainNode;

  private panner: StereoPannerNode;

  private muted: boolean;

  private soloed: boolean;

  private muteGain: GainNode;

  /**
   * Create a new TrackMixer instance
   * @param audioContext - Web Audio API AudioContext
   * @param trackId - Track identifier
   * @throws AudioContextError if audioContext is invalid
   * @throws InvalidParameterError if trackId is invalid
   */
  constructor(audioContext: AudioContext, trackId: string) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }
    ValidationUtils.validateString(trackId, 'trackId');

    this.audioContext = audioContext;
    this.trackId = trackId;

    // Create audio nodes
    this.inputNode = audioContext.createGain();
    this.preFxGain = audioContext.createGain();
    this.postFxGain = audioContext.createGain();
    this.outputNode = audioContext.createGain();

    // Effect chain
    this.effectChain = new EffectChain(audioContext);

    // EQ
    this.eq = new EQ(audioContext);
    this.eqEnabled = false;

    // Compressor
    this.compressor = new Compressor(audioContext);
    this.compressorEnabled = false;

    // Send/return
    this.sends = new Map<string, GainNode>();
    this.returnGain = audioContext.createGain();
    this.returnGain.gain.value = 0;

    // Pan
    this.panner = audioContext.createStereoPanner();
    this.panner.pan.value = 0;

    // Mute/Solo
    this.muted = false;
    this.soloed = false;
    this.muteGain = audioContext.createGain();
    this.muteGain.gain.value = 1;

    // Build routing
    this._buildRouting();
  }

  /**
   * Build audio routing
   * @private
   */
  private _buildRouting(): void {
    // Input -> Pre-FX Gain -> EQ (if enabled) -> Compressor (if enabled) -> Effect Chain -> Post-FX Gain -> Pan -> Mute -> Output
    this.inputNode.connect(this.preFxGain);

    let currentNode: AudioNode = this.preFxGain;

    // EQ
    if (this.eqEnabled) {
      currentNode.connect(this.eq.inputNode);
      currentNode = this.eq.outputNode;
    }

    // Compressor
    if (this.compressorEnabled) {
      currentNode.connect(this.compressor.inputNode);
      currentNode = this.compressor.outputNode;
    }

    // Effect chain
    currentNode.connect(this.effectChain.getInput());
    currentNode = this.effectChain.getOutput();

    // Post-FX gain
    currentNode.connect(this.postFxGain);

    // Pan
    this.postFxGain.connect(this.panner);

    // Mute
    this.panner.connect(this.muteGain);

    // Output
    this.muteGain.connect(this.outputNode);
  }

  /**
   * Rebuild routing (call after enabling/disabling components)
   * @private
   */
  private _rebuildRouting(): void {
    // Disconnect all
    try {
      this.inputNode.disconnect();
      this.preFxGain.disconnect();
      if (this.eqEnabled) {
        this.eq.inputNode.disconnect();
        this.eq.outputNode.disconnect();
      }
      if (this.compressorEnabled) {
        this.compressor.inputNode.disconnect();
        this.compressor.outputNode.disconnect();
      }
      this.effectChain.getInput().disconnect();
      this.effectChain.getOutput().disconnect();
      this.postFxGain.disconnect();
      this.panner.disconnect();
      this.muteGain.disconnect();
    } catch {
      // Already disconnected - ignore
    }

    // Rebuild
    this._buildRouting();
  }

  /**
   * Set volume (post-FX)
   * @param volume - Volume 0-1
   * @throws InvalidParameterError if volume is invalid
   */
  setVolume(volume: number): void {
    try {
      ValidationUtils.validateGain(volume, 'volume');
      this.postFxGain.gain.value = volume;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get volume
   * @returns Current volume 0-1
   */
  getVolume(): number {
    return this.postFxGain.gain.value;
  }

  /**
   * Set pan
   * @param pan - Pan -1 to 1 (0 = center)
   * @throws InvalidParameterError if pan is invalid
   */
  setPan(pan: number): void {
    try {
      if (typeof pan !== 'number' || Number.isNaN(pan)) {
        throw new InvalidParameterError('pan', pan, 'number');
      }
      if (pan < -1 || pan > 1) {
        throw new InvalidParameterError('pan', pan, 'number between -1 and 1');
      }
      this.panner.pan.value = pan;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pan
   * @returns Current pan -1 to 1
   */
  getPan(): number {
    return this.panner.pan.value;
  }

  /**
   * Enable/disable EQ
   * @param enabled - Whether to enable
   */
  setEQEnabled(enabled: boolean): void {
    this.eqEnabled = enabled;
    this._rebuildRouting();
  }

  /**
   * Enable/disable compressor
   * @param enabled - Whether to enable
   */
  setCompressorEnabled(enabled: boolean): void {
    this.compressorEnabled = enabled;
    this._rebuildRouting();
  }

  /**
   * Get EQ instance
   * @returns EQ instance
   */
  getEQ(): EQ {
    return this.eq;
  }

  /**
   * Get compressor instance
   * @returns Compressor instance
   */
  getCompressor(): Compressor {
    return this.compressor;
  }

  /**
   * Get effect chain
   * @returns Effect chain instance
   */
  getEffectChain(): EffectChain {
    return this.effectChain;
  }

  /**
   * Get audio context
   * @returns Audio context
   */
  getAudioContext(): AudioContext {
    return this.audioContext;
  }

  /**
   * Add send to bus
   * @param sendId - Send ID
   * @param busNode - Bus input node
   * @param level - Send level 0-1 (default: 0)
   * @returns Send gain node
   * @throws InvalidParameterError if parameters are invalid
   */
  addSend(sendId: string, busNode: AudioNode, level: number = 0): GainNode {
    try {
      ValidationUtils.validateString(sendId, 'sendId');
      ValidationUtils.validateGain(level, 'level');
      if (!busNode) {
        throw new InvalidParameterError('busNode', busNode, 'AudioNode');
      }

      const sendGain = this.audioContext.createGain();
      sendGain.gain.value = level;

      // Connect from post-FX gain (before pan)
      this.postFxGain.connect(sendGain);
      sendGain.connect(busNode);

      this.sends.set(sendId, sendGain);
      return sendGain;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set send level
   * @param sendId - Send ID
   * @param level - Send level 0-1
   * @throws InvalidParameterError if parameters are invalid
   */
  setSendLevel(sendId: string, level: number): void {
    try {
      ValidationUtils.validateString(sendId, 'sendId');
      ValidationUtils.validateGain(level, 'level');

      const send = this.sends.get(sendId);
      if (send) {
        send.gain.value = level;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove send
   * @param sendId - Send ID
   */
  removeSend(sendId: string): void {
    const send = this.sends.get(sendId);
    if (send) {
      try {
        send.disconnect();
      } catch {
        // Already disconnected - ignore
      }
      this.sends.delete(sendId);
    }
  }

  /**
   * Set mute
   * @param muted - Whether to mute
   */
  setMute(muted: boolean): void {
    this.muted = muted;
    this.muteGain.gain.value = muted ? 0 : 1;
  }

  /**
   * Set solo
   * @param soloed - Whether to solo
   */
  setSolo(soloed: boolean): void {
    this.soloed = soloed;
    // Solo logic should be handled by mixer manager
  }

  /**
   * Get input node
   * @returns Input GainNode
   */
  getInput(): GainNode {
    return this.inputNode;
  }

  /**
   * Get output node
   * @returns Output GainNode
   */
  getOutput(): GainNode {
    return this.outputNode;
  }

  /**
   * Get state
   * @returns Current state
   */
  getState(): TrackMixerState {
    return {
      trackId: this.trackId,
      volume: this.getVolume(),
      pan: this.getPan(),
      muted: this.muted,
      soloed: this.soloed,
      eqEnabled: this.eqEnabled,
      compressorEnabled: this.compressorEnabled,
      eqSettings: this.eq.getSettings(),
      compressorSettings: this.compressor.getSettings(),
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.inputNode.disconnect();
      this.effectChain.clear();
      this.eq.cleanup();
      this.compressor.cleanup();

      for (const send of this.sends.values()) {
        try {
          send.disconnect();
        } catch (error) {
          // Already disconnected - ignore
        }
      }
      this.sends.clear();
    } catch {
      // Error during cleanup - ignore
    }
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.TrackMixer = TrackMixer;
}

