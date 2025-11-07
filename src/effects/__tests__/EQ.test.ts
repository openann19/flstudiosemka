/**
 * EQ Tests - Comprehensive test suite for PRO Q 4 EQ
 * @module effects/__tests__/EQ.test
 */

import { EQ, ProcessingMode } from '../EQ';
import { EQBand, FilterType } from '../EQBand';
import { CharacterProcessor, CharacterMode } from '../CharacterProcessor';
import { DynamicEQProcessor, DynamicMode } from '../DynamicEQProcessor';
import { LinearPhaseProcessor } from '../LinearPhaseProcessor';

describe('EQ', () => {
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
  });

  afterEach(async () => {
    await audioContext.close();
  });

  describe('Constructor', () => {
    it('should create EQ instance with valid AudioContext', () => {
      const eq = new EQ(audioContext);
      expect(eq).toBeInstanceOf(EQ);
      expect(eq.inputNode).toBeDefined();
      expect(eq.outputNode).toBeDefined();
    });

    it('should throw error with invalid AudioContext', () => {
      expect(() => {
         
        new EQ(null as any);
      }).toThrow();
    });

    it('should initialize with legacy bands for backward compatibility', () => {
      const eq = new EQ(audioContext);
      const bands = eq.getAllBands();
      expect(bands.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Band Management', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should add a new band', () => {
      const band = eq.addBand({
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 3,
        Q: 2,
        enabled: true,
      });

      expect(band).toBeInstanceOf(EQBand);
      expect(eq.getBand('test-band')).toBe(band);
    });

    it('should throw error when maximum bands reached', () => {
      // Get current band count (includes legacy bands)
      const currentBandCount = eq.getAllBands().length;
      const bandsToAdd = 24 - currentBandCount;

      // Add bands up to the maximum
      for (let i = 0; i < bandsToAdd; i += 1) {
        eq.addBand({
          id: `band-${i}`,
          type: FilterType.Peaking,
          frequency: 1000 + i * 100,
          gain: 0,
          enabled: true,
        });
      }

      // Now adding one more should throw
      expect(() => {
        eq.addBand({
          id: 'band-max',
          type: FilterType.Peaking,
          frequency: 1000,
          gain: 0,
          enabled: true,
        });
      }).toThrow();
    });

    it('should remove a band by ID', () => {
      eq.addBand({
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      });

      const removed = eq.removeBand('test-band');
      expect(removed).toBe(true);
      expect(eq.getBand('test-band')).toBeUndefined();
    });

    it('should return false when removing non-existent band', () => {
      const removed = eq.removeBand('non-existent');
      expect(removed).toBe(false);
    });

    it('should enable a band', () => {
      const band = eq.addBand({
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: false,
      });

      eq.enableBand('test-band');
      expect(band.isEnabled()).toBe(true);
    });

    it('should disable a band', () => {
      const band = eq.addBand({
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      });

      eq.disableBand('test-band');
      expect(band.isEnabled()).toBe(false);
    });

    it('should update band configuration', () => {
      eq.addBand({
        id: 'test-band',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      });

      const updated = eq.setBand('test-band', {
        frequency: 2000,
        gain: 3,
      });

      expect(updated).toBe(true);
      const band = eq.getBand('test-band');
      expect(band?.getConfig().frequency).toBe(2000);
      expect(band?.getConfig().gain).toBe(3);
    });

    it('should return all bands', () => {
      eq.addBand({
        id: 'band-1',
        type: FilterType.Peaking,
        frequency: 1000,
        gain: 0,
        enabled: true,
      });
      eq.addBand({
        id: 'band-2',
        type: FilterType.Peaking,
        frequency: 2000,
        gain: 0,
        enabled: true,
      });

      const bands = eq.getAllBands();
      expect(bands.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Processing Modes', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should set processing mode to zero-latency', () => {
      eq.setProcessingMode(ProcessingMode.ZeroLatency);
      expect(eq.getProcessingMode()).toBe(ProcessingMode.ZeroLatency);
    });

    it('should set processing mode to linear-phase', () => {
      eq.setProcessingMode(ProcessingMode.LinearPhase);
      expect(eq.getProcessingMode()).toBe(ProcessingMode.LinearPhase);
    });

    it('should throw error with invalid processing mode', () => {
      expect(() => {
         
        eq.setProcessingMode('invalid' as any);
      }).toThrow();
    });
  });

  describe('Character Modes', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should set character mode to clean', () => {
      eq.setCharacterMode(CharacterMode.Clean);
      expect(eq.getCharacterMode()).toBe(CharacterMode.Clean);
    });

    it('should set character mode to subtle', () => {
      eq.setCharacterMode(CharacterMode.Subtle);
      expect(eq.getCharacterMode()).toBe(CharacterMode.Subtle);
    });

    it('should set character mode to warm', () => {
      eq.setCharacterMode(CharacterMode.Warm);
      expect(eq.getCharacterMode()).toBe(CharacterMode.Warm);
    });

    it('should set character amount', () => {
      eq.setCharacterAmount(0.5);
      expect(eq.getCharacterAmount()).toBe(0.5);
    });

    it('should throw error with invalid character amount', () => {
      expect(() => {
        eq.setCharacterAmount(1.5);
      }).toThrow();
    });
  });

  describe('Dry/Wet Mix', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should set dry/wet mix', () => {
      eq.setDryWet(0.5);
      expect(eq.getDryWet()).toBe(0.5);
    });

    it('should throw error with invalid dry/wet mix', () => {
      expect(() => {
        eq.setDryWet(1.5);
      }).toThrow();
    });
  });

  describe('Bypass', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should set bypass state', () => {
      eq.setBypass(true);
      expect(eq.isBypassed()).toBe(true);
    });

    it('should disable bypass', () => {
      eq.setBypass(false);
      expect(eq.isBypassed()).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should set low shelf parameters', () => {
      eq.setLowShelf(200, 3);
      const settings = eq.getSettings();
      expect(settings.low.frequency).toBe(200);
      expect(settings.low.gain).toBe(3);
    });

    it('should set mid band parameters', () => {
      eq.setMidBand(1000, 2, 1.5);
      const settings = eq.getSettings();
      expect(settings.mid.frequency).toBe(1000);
      expect(settings.mid.gain).toBe(2);
      expect(settings.mid.Q).toBe(1.5);
    });

    it('should set high shelf parameters', () => {
      eq.setHighShelf(5000, 3);
      const settings = eq.getSettings();
      expect(settings.high.frequency).toBe(5000);
      expect(settings.high.gain).toBe(3);
    });

    it('should set all bands at once', () => {
      eq.setBands({
        low: { frequency: 200, gain: 2 },
        mid: { frequency: 1000, gain: 1, Q: 2 },
        high: { frequency: 5000, gain: 3 },
      });

      const settings = eq.getSettings();
      expect(settings.low.frequency).toBe(200);
      expect(settings.mid.frequency).toBe(1000);
      expect(settings.high.frequency).toBe(5000);
    });

    it('should reset to flat response', () => {
      eq.setLowShelf(200, 3);
      eq.setMidBand(1000, 2, 1.5);
      eq.setHighShelf(5000, 3);

      eq.reset();

      const settings = eq.getSettings();
      expect(settings.low.gain).toBe(0);
      expect(settings.mid.gain).toBe(0);
      expect(settings.high.gain).toBe(0);
    });
  });

  describe('Configuration', () => {
    let eq: EQ;

    beforeEach(() => {
      eq = new EQ(audioContext);
    });

    it('should get complete configuration', () => {
      const config = eq.getConfiguration();
      expect(config).toHaveProperty('bands');
      expect(config).toHaveProperty('characterMode');
      expect(config).toHaveProperty('processingMode');
      expect(config).toHaveProperty('dryWet');
      expect(config).toHaveProperty('bypass');
    });

    it('should set complete configuration', () => {
      eq.setConfiguration({
        characterMode: CharacterMode.Warm,
        characterAmount: 0.5,
        processingMode: ProcessingMode.LinearPhase,
        dryWet: 0.8,
        bypass: false,
      });

      const config = eq.getConfiguration();
      expect(config.characterMode).toBe(CharacterMode.Warm);
      expect(config.characterAmount).toBe(0.5);
      expect(config.processingMode).toBe(ProcessingMode.LinearPhase);
      expect(config.dryWet).toBe(0.8);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', () => {
      const eq = new EQ(audioContext);
      expect(() => {
        eq.cleanup();
      }).not.toThrow();
    });
  });
});

describe('EQBand', () => {
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
  });

  afterEach(async () => {
    await audioContext.close();
  });

  describe('Filter Types', () => {
    const filterTypes = [
      FilterType.Peaking,
      FilterType.LowShelf,
      FilterType.HighShelf,
      FilterType.LowPass,
      FilterType.HighPass,
      FilterType.Notch,
      FilterType.AllPass,
      FilterType.BandPass,
    ];

    filterTypes.forEach((type) => {
      it(`should create band with ${type} filter type`, () => {
        const band = new EQBand(audioContext, {
          id: 'test',
          type,
          frequency: 1000,
          gain: 0,
          enabled: true,
        });

        expect(band.getType()).toBe(type);
      });
    });
  });

  describe('Parameter Validation', () => {
    it('should validate frequency range', () => {
      expect(() => {
        new EQBand(audioContext, {
          id: 'test',
          type: FilterType.Peaking,
          frequency: 5, // Below minimum
          gain: 0,
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        new EQBand(audioContext, {
          id: 'test',
          type: FilterType.Peaking,
          frequency: 50000, // Above maximum
          gain: 0,
          enabled: true,
        });
      }).toThrow();
    });

    it('should validate gain range', () => {
      expect(() => {
        new EQBand(audioContext, {
          id: 'test',
          type: FilterType.Peaking,
          frequency: 1000,
          gain: -70, // Below minimum
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        new EQBand(audioContext, {
          id: 'test',
          type: FilterType.Peaking,
          frequency: 1000,
          gain: 70, // Above maximum
          enabled: true,
        });
      }).toThrow();
    });

    it('should validate Q range', () => {
      expect(() => {
        new EQBand(audioContext, {
          id: 'test',
          type: FilterType.Peaking,
          frequency: 1000,
          gain: 0,
          Q: 0.001, // Below minimum
          enabled: true,
        });
      }).toThrow();

      expect(() => {
        new EQBand(audioContext, {
          id: 'test',
          type: FilterType.Peaking,
          frequency: 1000,
          gain: 0,
          Q: 200, // Above maximum
          enabled: true,
        });
      }).toThrow();
    });
  });
});

describe('CharacterProcessor', () => {
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
  });

  afterEach(async () => {
    await audioContext.close();
  });

  it('should create character processor', () => {
    const processor = new CharacterProcessor(audioContext);
    expect(processor).toBeInstanceOf(CharacterProcessor);
  });

  it('should set character mode', () => {
    const processor = new CharacterProcessor(audioContext);
    processor.setMode(CharacterMode.Warm);
    expect(processor.getConfig().mode).toBe(CharacterMode.Warm);
  });

  it('should set character amount', () => {
    const processor = new CharacterProcessor(audioContext);
    processor.setAmount(0.5);
    expect(processor.getConfig().amount).toBe(0.5);
  });
});

describe('DynamicEQProcessor', () => {
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
  });

  afterEach(async () => {
    await audioContext.close();
  });

  it('should create dynamic EQ processor', () => {
    const processor = new DynamicEQProcessor(audioContext, {
      bandId: 'test',
      mode: DynamicMode.Compressor,
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.1,
      gain: 0,
      enabled: true,
    });

    expect(processor).toBeInstanceOf(DynamicEQProcessor);
  });

  it('should set dynamic mode', () => {
    const processor = new DynamicEQProcessor(audioContext, {
      bandId: 'test',
      mode: DynamicMode.Compressor,
      threshold: -20,
      ratio: 4,
      attack: 0.003,
      release: 0.1,
      gain: 0,
      enabled: true,
    });

    processor.setMode(DynamicMode.Expander);
    expect(processor.getConfig().mode).toBe(DynamicMode.Expander);
  });
});

describe('LinearPhaseProcessor', () => {
  let audioContext: AudioContext;

  beforeEach(() => {
    audioContext = new AudioContext();
  });

  afterEach(async () => {
    await audioContext.close();
  });

  it('should create linear phase processor', () => {
    const processor = new LinearPhaseProcessor(audioContext);
    expect(processor).toBeInstanceOf(LinearPhaseProcessor);
  });

  it('should set enabled state', () => {
    const processor = new LinearPhaseProcessor(audioContext);
    processor.setEnabled(true);
    expect(processor.isEnabled()).toBe(true);
  });
});

