/**
 * SnapshotManager - Snapshot system
 * Save and recall parameter states with morphing
 * @module audio/synthesizer/macros/SnapshotManager
 */

import type { SynthesizerVoiceConfig } from '../../../types/synthesizer.types';

/**
 * Snapshot
 */
export interface Snapshot {
  id: string;
  name: string;
  config: SynthesizerVoiceConfig;
  timestamp: number;
}

/**
 * Snapshot manager
 */
export class SnapshotManager {
  private snapshots: Map<string, Snapshot> = new Map();
  private currentSnapshotId: string | null = null;
  private morphing: boolean = false;
  private morphProgress: number = 0;
  private morphFrom: Snapshot | null = null;
  private morphTo: Snapshot | null = null;

  /**
   * Create a new snapshot manager
   */
  constructor() {
    // Initialize with empty snapshots
  }

  /**
   * Save snapshot
   */
  saveSnapshot(name: string, config: SynthesizerVoiceConfig): string {
    const id = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const snapshot: Snapshot = {
      id,
      name,
      config: JSON.parse(JSON.stringify(config)), // Deep copy
      timestamp: Date.now(),
    };

    this.snapshots.set(id, snapshot);
    return id;
  }

  /**
   * Load snapshot
   */
  loadSnapshot(id: string): Snapshot | null {
    return this.snapshots.get(id) ?? null;
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(id: string): boolean {
    if (this.snapshots.has(id)) {
      this.snapshots.delete(id);
      if (this.currentSnapshotId === id) {
        this.currentSnapshotId = null;
      }
      return true;
    }
    return false;
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): Snapshot[] {
    return Array.from(this.snapshots.values());
  }

  /**
   * Get snapshot by name
   */
  getSnapshotByName(name: string): Snapshot | null {
    for (const snapshot of this.snapshots.values()) {
      if (snapshot.name === name) {
        return snapshot;
      }
    }
    return null;
  }

  /**
   * Start morphing between snapshots
   */
  startMorph(fromId: string, toId: string): void {
    const from = this.snapshots.get(fromId);
    const to = this.snapshots.get(toId);

    if (from && to) {
      this.morphing = true;
      this.morphProgress = 0;
      this.morphFrom = from;
      this.morphTo = to;
    }
  }

  /**
   * Update morph progress
   */
  updateMorph(progress: number): void {
    this.morphProgress = Math.max(0, Math.min(1, progress));
  }

  /**
   * Get morphed configuration
   */
  getMorphedConfig(): SynthesizerVoiceConfig | null {
    if (!this.morphing || !this.morphFrom || !this.morphTo) {
      return null;
    }

    const from = this.morphFrom.config;
    const to = this.morphTo.config;
    const t = this.morphProgress;

    // Interpolate between configurations
    // This is a simplified version - full implementation would interpolate all parameters
    return this.interpolateConfigs(from, to, t);
  }

  /**
   * Interpolate between two configurations
   */
  private interpolateConfigs(
    from: SynthesizerVoiceConfig,
    to: SynthesizerVoiceConfig,
    t: number
  ): SynthesizerVoiceConfig {
    // Deep copy and interpolate numeric values
    const result = JSON.parse(JSON.stringify(to)) as SynthesizerVoiceConfig;

    // Interpolate oscillator gains
    for (let i = 0; i < 4; i += 1) {
      const fromOsc = from.oscillators[i];
      const toOsc = to.oscillators[i];
      const resultOsc = result.oscillators[i];
      if (fromOsc && toOsc && resultOsc) {
        resultOsc.gain = fromOsc.gain * (1 - t) + toOsc.gain * t;
        resultOsc.detune = fromOsc.detune * (1 - t) + toOsc.detune * t;
      }
    }

    // Interpolate filter cutoff
    result.filter.cutoff = from.filter.cutoff * (1 - t) + to.filter.cutoff * t;
    result.filter.resonance = from.filter.resonance * (1 - t) + to.filter.resonance * t;

    // Interpolate envelope parameters
    result.ampEnvelope.attack = from.ampEnvelope.attack * (1 - t) + to.ampEnvelope.attack * t;
    result.ampEnvelope.decay = from.ampEnvelope.decay * (1 - t) + to.ampEnvelope.decay * t;
    result.ampEnvelope.sustain =
      from.ampEnvelope.sustain * (1 - t) + to.ampEnvelope.sustain * t;
    result.ampEnvelope.release =
      from.ampEnvelope.release * (1 - t) + to.ampEnvelope.release * t;

    return result;
  }

  /**
   * Stop morphing
   */
  stopMorph(): void {
    this.morphing = false;
    this.morphProgress = 0;
    this.morphFrom = null;
    this.morphTo = null;
  }

  /**
   * Check if morphing
   */
  isMorphing(): boolean {
    return this.morphing;
  }

  /**
   * Get current snapshot ID
   */
  getCurrentSnapshotId(): string | null {
    return this.currentSnapshotId;
  }

  /**
   * Set current snapshot
   */
  setCurrentSnapshot(id: string): void {
    if (this.snapshots.has(id)) {
      this.currentSnapshotId = id;
    }
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
    this.currentSnapshotId = null;
    this.stopMorph();
  }
}

