/**
 * BusManager - Manages audio buses for send/return effects
 * Handles bus routing and grouping
 * @module mixer/BusManager
 */

import { EffectChain, type Effect } from '../effects/EffectChain';
import {
  AudioContextError,
  ValidationUtils,
} from '../utils/errors';

/**
 * Bus configuration
 */
export interface BusConfig {
  name?: string;
  effects?: Effect[];
  volume?: number;
}

/**
 * Bus data structure
 */
export interface Bus {
  id: string;
  name: string;
  inputNode: GainNode;
  outputNode: GainNode;
  effectChain: EffectChain;
  volume: number;
  effects: Effect[];
}

/**
 * Bus info for listing
 */
export interface BusInfo {
  id: string;
  name: string;
  volume: number;
}

/**
 * Manages audio buses for send/return effects
 */
export class BusManager {
  private audioContext: AudioContext;

  private buses: Map<string, Bus>;

  private masterBus: GainNode;

  /**
   * Create a new BusManager instance
   * @param audioContext - Web Audio API AudioContext
   * @throws AudioContextError if audioContext is invalid
   */
  constructor(audioContext: AudioContext) {
    if (!audioContext || !(audioContext instanceof AudioContext)) {
      throw new AudioContextError('Invalid AudioContext provided', { audioContext });
    }

    this.audioContext = audioContext;
    this.buses = new Map<string, Bus>();
    this.masterBus = audioContext.createGain();
    this.masterBus.connect(audioContext.destination);
  }

  /**
   * Create a new bus
   * @param busId - Bus ID
   * @param config - Bus configuration (optional)
   * @returns Bus object
   * @throws InvalidParameterError if busId is invalid
   */
  createBus(busId: string, config: BusConfig = {}): Bus {
    try {
      ValidationUtils.validateString(busId, 'busId');

      const { name = busId, effects = [], volume = 1.0 } = config;

      ValidationUtils.validateGain(volume, 'volume');

      const inputNode = this.audioContext.createGain();
      const outputNode = this.audioContext.createGain();
      outputNode.gain.value = volume;

      // Create effect chain for bus
      const effectChain = new EffectChain(this.audioContext);

      // Connect: input -> effects -> output -> master
      inputNode.connect(effectChain.getInput());
      effectChain.getOutput().connect(outputNode);
      outputNode.connect(this.masterBus);

      const bus: Bus = {
        id: busId,
        name,
        inputNode,
        outputNode,
        effectChain,
        volume,
        effects: [],
      };

      // Add initial effects
      effects.forEach((effect) => {
        effectChain.addEffect(effect);
        bus.effects.push(effect);
      });

      this.buses.set(busId, bus);
      return bus;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get bus
   * @param busId - Bus ID
   * @returns Bus object or undefined if not found
   */
  getBus(busId: string): Bus | undefined {
    return this.buses.get(busId);
  }

  /**
   * Remove bus
   * @param busId - Bus ID
   * @throws InvalidParameterError if busId is invalid
   */
  removeBus(busId: string): void {
    try {
      ValidationUtils.validateString(busId, 'busId');

      const bus = this.buses.get(busId);
      if (bus) {
        try {
          bus.inputNode.disconnect();
          bus.outputNode.disconnect();
        } catch {
          // Already disconnected - ignore
        }
        bus.effectChain.clear();
        this.buses.delete(busId);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set bus volume
   * @param busId - Bus ID
   * @param volume - Volume 0-1
   * @throws InvalidParameterError if parameters are invalid
   */
  setBusVolume(busId: string, volume: number): void {
    try {
      ValidationUtils.validateString(busId, 'busId');
      ValidationUtils.validateGain(volume, 'volume');

      const bus = this.buses.get(busId);
      if (bus) {
        bus.volume = volume;
        bus.outputNode.gain.value = volume;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get master bus
   * @returns Master bus GainNode
   */
  getMasterBus(): GainNode {
    return this.masterBus;
  }

  /**
   * Set master volume
   * @param volume - Volume 0-1
   * @throws InvalidParameterError if volume is invalid
   */
  setMasterVolume(volume: number): void {
    try {
      ValidationUtils.validateGain(volume, 'volume');
      this.masterBus.gain.value = volume;
    } catch (error) {
      throw error;
    }
  }

  /**
   * List all buses
   * @returns Array of bus info
   */
  listBuses(): BusInfo[] {
    return Array.from(this.buses.values()).map((bus) => ({
      id: bus.id,
      name: bus.name,
      volume: bus.volume,
    }));
  }
}

// Export to window for browser compatibility
if (typeof window !== 'undefined') {
  window.BusManager = BusManager;
}

