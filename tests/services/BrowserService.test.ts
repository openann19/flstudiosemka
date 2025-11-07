/**
 * Tests for BrowserService
 * @module tests/services/BrowserService
 */

import { BrowserService } from '../../src/services/BrowserService';

describe('BrowserService', () => {
  let browserService: BrowserService;

  beforeEach(() => {
    browserService = new BrowserService();
  });

  describe('initialization', () => {
    it('should create BrowserService', () => {
      expect(browserService).toBeDefined();
    });

    it('should create BrowserService with samplePackBank', () => {
      const service = new BrowserService(null);
      expect(service).toBeDefined();
    });
  });

  describe('sound library', () => {
    it('should get sound library', () => {
      const library = browserService.getSoundLibrary();
      expect(library).toBeDefined();
      expect(library.presets).toBeDefined();
      expect(library.samples).toBeDefined();
      expect(library.plugins).toBeDefined();
    });

    it('should search sounds', () => {
      const results = browserService.searchSounds('kick');
      expect(Array.isArray(results)).toBe(true);
    });

    it('should get sounds by category', () => {
      const sounds = browserService.getSoundsByCategory('Drums');
      expect(Array.isArray(sounds)).toBe(true);
    });
  });

  describe('sample pack bank', () => {
    it('should set sample pack bank', () => {
      expect(() => {
        browserService.setSamplePackBank(null);
      }).not.toThrow();
    });
  });
});

