/**
 * PresetService - Preset management service
 * Handles saving/loading channel and mixer presets
 * @module services/PresetService
 */

/**
 * Channel preset data
 */
export interface ChannelPreset {
  id: string;
  name: string;
  category: string;
  params: {
    volume: number;
    pan: number;
    amp: {
      a: number;
      d: number;
      s: number;
      r: number;
    };
    filter: {
      cutoff: number;
      resonance: number;
      type: string;
    };
    detune: number;
    waveform: string;
    sends: {
      reverb: number;
      delay: number;
    };
  };
}

/**
 * Mixer preset data
 */
export interface MixerPreset {
  id: string;
  name: string;
  category: string;
  settings: {
    volume: number;
    pan: number;
    effects: unknown[];
    sends: {
      reverb: number;
      delay: number;
    };
  };
}

/**
 * Preset service
 */
export class PresetService {
  private readonly storageKey = 'fl-studio-presets';
  private channelPresets: Map<string, ChannelPreset>;
  private mixerPresets: Map<string, MixerPreset>;

  /**
   * Create a new PresetService instance
   */
  constructor() {
    this.channelPresets = new Map();
    this.mixerPresets = new Map();
    this.loadPresets();
  }

  /**
   * Save channel preset
   */
  saveChannelPreset(preset: ChannelPreset): void {
    this.channelPresets.set(preset.id, preset);
    this.savePresets();
  }

  /**
   * Load channel preset
   */
  getChannelPreset(id: string): ChannelPreset | undefined {
    return this.channelPresets.get(id);
  }

  /**
   * Get all channel presets
   */
  getAllChannelPresets(): ChannelPreset[] {
    return Array.from(this.channelPresets.values());
  }

  /**
   * Get channel presets by category
   */
  getChannelPresetsByCategory(category: string): ChannelPreset[] {
    return Array.from(this.channelPresets.values()).filter((p) => p.category === category);
  }

  /**
   * Delete channel preset
   */
  deleteChannelPreset(id: string): boolean {
    const deleted = this.channelPresets.delete(id);
    if (deleted) {
      this.savePresets();
    }
    return deleted;
  }

  /**
   * Save mixer preset
   */
  saveMixerPreset(preset: MixerPreset): void {
    this.mixerPresets.set(preset.id, preset);
    this.savePresets();
  }

  /**
   * Load mixer preset
   */
  getMixerPreset(id: string): MixerPreset | undefined {
    return this.mixerPresets.get(id);
  }

  /**
   * Get all mixer presets
   */
  getAllMixerPresets(): MixerPreset[] {
    return Array.from(this.mixerPresets.values());
  }

  /**
   * Get mixer presets by category
   */
  getMixerPresetsByCategory(category: string): MixerPreset[] {
    return Array.from(this.mixerPresets.values()).filter((p) => p.category === category);
  }

  /**
   * Delete mixer preset
   */
  deleteMixerPreset(id: string): boolean {
    const deleted = this.mixerPresets.delete(id);
    if (deleted) {
      this.savePresets();
    }
    return deleted;
  }

  /**
   * Save presets to localStorage
   */
  private savePresets(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const data = {
        channelPresets: Array.from(this.channelPresets.values()),
        mixerPresets: Array.from(this.mixerPresets.values()),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Error saving - ignore
    }
  }

  /**
   * Load presets from localStorage
   */
  private loadPresets(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored) as {
          channelPresets?: ChannelPreset[];
          mixerPresets?: MixerPreset[];
        };

        if (data.channelPresets) {
          data.channelPresets.forEach((preset) => {
            this.channelPresets.set(preset.id, preset);
          });
        }

        if (data.mixerPresets) {
          data.mixerPresets.forEach((preset) => {
            this.mixerPresets.set(preset.id, preset);
          });
        }
      }
    } catch {
      // Error loading - ignore
    }
  }
}

// Export singleton instance
export const presetService = new PresetService();

