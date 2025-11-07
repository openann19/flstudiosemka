/**
 * Tests for PresetService
 * @module tests/services/PresetService
 */

import { PresetService, type ChannelPreset, type MixerPreset } from '../../src/services/PresetService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => {
      store[key] = value;
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('PresetService', () => {
  let service: PresetService;

  beforeEach(() => {
    localStorageMock.clear();
    service = new PresetService();
  });

  describe('channel presets', () => {
    const channelPreset: ChannelPreset = {
      id: 'test-channel-preset',
      name: 'Test Channel Preset',
      category: 'test',
      params: {
        volume: 0.8,
        pan: 0.2,
        amp: {
          a: 0.1,
          d: 0.2,
          s: 0.7,
          r: 0.3,
        },
        filter: {
          cutoff: 0.5,
          resonance: 0.3,
          type: 'lowpass',
        },
        detune: 0,
        waveform: 'sine',
        sends: {
          reverb: 0.2,
          delay: 0.1,
        },
      },
    };

    it('should save channel preset', () => {
      service.saveChannelPreset(channelPreset);

      const saved = service.getChannelPreset('test-channel-preset');
      expect(saved).toEqual(channelPreset);
    });

    it('should load channel preset', () => {
      service.saveChannelPreset(channelPreset);

      const loaded = service.getChannelPreset('test-channel-preset');
      expect(loaded).toEqual(channelPreset);
    });

    it('should return undefined for non-existent preset', () => {
      const loaded = service.getChannelPreset('non-existent');
      expect(loaded).toBeUndefined();
    });

    it('should get all channel presets', () => {
      service.saveChannelPreset(channelPreset);

      const presets = service.getAllChannelPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0]).toEqual(channelPreset);
    });

    it('should get channel presets by category', () => {
      const preset1: ChannelPreset = { ...channelPreset, id: 'preset-1', category: 'bass' };
      const preset2: ChannelPreset = { ...channelPreset, id: 'preset-2', category: 'lead' };
      const preset3: ChannelPreset = { ...channelPreset, id: 'preset-3', category: 'bass' };

      service.saveChannelPreset(preset1);
      service.saveChannelPreset(preset2);
      service.saveChannelPreset(preset3);

      const bassPresets = service.getChannelPresetsByCategory('bass');
      expect(bassPresets).toHaveLength(2);
      expect(bassPresets.every((p) => p.category === 'bass')).toBe(true);
    });

    it('should delete channel preset', () => {
      service.saveChannelPreset(channelPreset);
      service.deleteChannelPreset('test-channel-preset');

      const loaded = service.getChannelPreset('test-channel-preset');
      expect(loaded).toBeUndefined();
    });

    it('should persist channel presets to localStorage', () => {
      service.saveChannelPreset(channelPreset);

      const newService = new PresetService();
      const loaded = newService.getChannelPreset('test-channel-preset');

      expect(loaded).toEqual(channelPreset);
    });
  });

  describe('mixer presets', () => {
    const mixerPreset: MixerPreset = {
      id: 'test-mixer-preset',
      name: 'Test Mixer Preset',
      category: 'test',
      settings: {
        volume: 0.9,
        pan: 0.1,
        effects: [],
        sends: {
          reverb: 0.3,
          delay: 0.2,
        },
      },
    };

    it('should save mixer preset', () => {
      service.saveMixerPreset(mixerPreset);

      const saved = service.getMixerPreset('test-mixer-preset');
      expect(saved).toEqual(mixerPreset);
    });

    it('should load mixer preset', () => {
      service.saveMixerPreset(mixerPreset);

      const loaded = service.getMixerPreset('test-mixer-preset');
      expect(loaded).toEqual(mixerPreset);
    });

    it('should return undefined for non-existent mixer preset', () => {
      const loaded = service.getMixerPreset('non-existent');
      expect(loaded).toBeUndefined();
    });

    it('should get all mixer presets', () => {
      service.saveMixerPreset(mixerPreset);

      const presets = service.getAllMixerPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0]).toEqual(mixerPreset);
    });

    it('should get mixer presets by category', () => {
      const preset1: MixerPreset = { ...mixerPreset, id: 'preset-1', category: 'master' };
      const preset2: MixerPreset = { ...mixerPreset, id: 'preset-2', category: 'bus' };
      const preset3: MixerPreset = { ...mixerPreset, id: 'preset-3', category: 'master' };

      service.saveMixerPreset(preset1);
      service.saveMixerPreset(preset2);
      service.saveMixerPreset(preset3);

      const masterPresets = service.getMixerPresetsByCategory('master');
      expect(masterPresets).toHaveLength(2);
      expect(masterPresets.every((p) => p.category === 'master')).toBe(true);
    });

    it('should delete mixer preset', () => {
      service.saveMixerPreset(mixerPreset);
      service.deleteMixerPreset('test-mixer-preset');

      const loaded = service.getMixerPreset('test-mixer-preset');
      expect(loaded).toBeUndefined();
    });

    it('should persist mixer presets to localStorage', () => {
      service.saveMixerPreset(mixerPreset);

      const newService = new PresetService();
      const loaded = newService.getMixerPreset('test-mixer-preset');

      expect(loaded).toEqual(mixerPreset);
    });
  });

  describe('preset management', () => {
    it('should handle empty preset lists', () => {
      expect(service.getAllChannelPresets()).toEqual([]);
      expect(service.getAllMixerPresets()).toEqual([]);
    });

    it('should update existing preset', () => {
      const preset: ChannelPreset = {
        id: 'test-preset',
        name: 'Original Name',
        category: 'test',
        params: {
          volume: 0.5,
          pan: 0,
          amp: { a: 0.1, d: 0.2, s: 0.7, r: 0.3 },
          filter: { cutoff: 0.5, resonance: 0.3, type: 'lowpass' },
          detune: 0,
          waveform: 'sine',
          sends: { reverb: 0, delay: 0 },
        },
      };

      service.saveChannelPreset(preset);

      const updated: ChannelPreset = {
        ...preset,
        name: 'Updated Name',
        params: { ...preset.params, volume: 0.9 },
      };

      service.saveChannelPreset(updated);

      const loaded = service.getChannelPreset('test-preset');
      expect(loaded?.name).toBe('Updated Name');
      expect(loaded?.params.volume).toBe(0.9);
    });
  });
});

