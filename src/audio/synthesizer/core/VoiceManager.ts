/**
 * VoiceManager - Voice allocation and polyphony management
 * Handles voice stealing and polyphonic voice management
 * @module audio/synthesizer/core/VoiceManager
 */

import type { ActiveVoice, VoiceMode } from '../../../types/synthesizer.types';
import { logger } from '../../../utils/logger';

/**
 * Voice manager for polyphonic synthesis
 */
export class VoiceManager {
  private voices: Map<string, ActiveVoice> = new Map();
  private maxPolyphony: number = 16;
  private voiceMode: VoiceMode = 'poly';
  private voiceIdCounter: number = 0;

  /**
   * Create a new voice manager
   */
  constructor(maxPolyphony: number = 16, voiceMode: VoiceMode = 'poly') {
    this.maxPolyphony = Math.max(1, Math.min(32, maxPolyphony));
    this.voiceMode = voiceMode;
  }

  /**
   * Set maximum polyphony
   */
  setMaxPolyphony(polyphony: number): void {
    this.maxPolyphony = Math.max(1, Math.min(32, polyphony));
    this.cleanupInactiveVoices();
  }

  /**
   * Set voice mode
   */
  setVoiceMode(mode: VoiceMode): void {
    this.voiceMode = mode;

    if (mode === 'mono') {
      // Stop all voices except the most recent
      this.stopAllVoices();
    }
  }

  /**
   * Allocate a new voice
   */
  allocateVoice(
    note: number,
    frequency: number,
    velocity: number,
    startTime: number,
    nodes: ActiveVoice['nodes']
  ): string {
    const voiceId = `voice_${this.voiceIdCounter++}`;

    // Check if we need to steal a voice
    if (this.voices.size >= this.maxPolyphony) {
      if (this.voiceMode === 'mono') {
        // In mono mode, stop all existing voices
        this.stopAllVoices();
      } else {
        // Steal oldest voice
        this.stealOldestVoice();
      }
    }

    // Create new voice
    const voice: ActiveVoice = {
      id: voiceId,
      note,
      frequency,
      velocity,
      startTime,
      nodes,
    };

    this.voices.set(voiceId, voice);
    return voiceId;
  }

  /**
   * Steal the oldest voice
   */
  private stealOldestVoice(): void {
    let oldestVoice: ActiveVoice | null = null;
    let oldestTime = Infinity;

    for (const voice of this.voices.values()) {
      if (voice.startTime < oldestTime) {
        oldestTime = voice.startTime;
        oldestVoice = voice;
      }
    }

    if (oldestVoice) {
      this.releaseVoice(oldestVoice.id);
    }
  }

  /**
   * Release a voice
   */
  releaseVoice(voiceId: string): void {
    const voice = this.voices.get(voiceId);
    if (!voice) {
      return;
    }

    // Stop all audio nodes
    try {
      voice.nodes.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // Already stopped
        }
      });

      if (voice.nodes.filter) {
        voice.nodes.filter.disconnect();
      }

      voice.nodes.masterGain.disconnect();
    } catch (error) {
      logger.error('VoiceManager: Error releasing voice', { error, voiceId });
    }

    this.voices.delete(voiceId);
  }

  /**
   * Stop all voices
   */
  stopAllVoices(): void {
    const voiceIds = Array.from(this.voices.keys());
    voiceIds.forEach((id) => this.releaseVoice(id));
  }

  /**
   * Get active voice count
   */
  getActiveVoiceCount(): number {
    return this.voices.size;
  }

  /**
   * Get voice by ID
   */
  getVoice(voiceId: string): ActiveVoice | undefined {
    return this.voices.get(voiceId);
  }

  /**
   * Get all active voices
   */
  getAllVoices(): ActiveVoice[] {
    return Array.from(this.voices.values());
  }

  /**
   * Find voice by note (for legato mode)
   */
  findVoiceByNote(note: number): ActiveVoice | undefined {
    for (const voice of this.voices.values()) {
      if (voice.note === note) {
        return voice;
      }
    }
    return undefined;
  }

  /**
   * Cleanup inactive voices
   */
  cleanupInactiveVoices(): void {
    // Remove voices that are no longer playing
    // This is a safety mechanism - actual cleanup happens in releaseVoice
    const toRemove: string[] = [];

    for (const [id, voice] of this.voices.entries()) {
      // Check if oscillators are still active
      let isActive = false;
      for (const osc of voice.nodes.oscillators) {
        try {
          // If we can access the frequency, it's still active
          if (osc.frequency) {
            isActive = true;
            break;
          }
        } catch {
          // Oscillator is stopped
        }
      }

      if (!isActive) {
        toRemove.push(id);
      }
    }

    toRemove.forEach((id) => this.voices.delete(id));
  }

  /**
   * Get maximum polyphony
   */
  getMaxPolyphony(): number {
    return this.maxPolyphony;
  }

  /**
   * Get voice mode
   */
  getVoiceMode(): VoiceMode {
    return this.voiceMode;
  }
}

