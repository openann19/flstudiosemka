/**
 * Tests for MouseInteractionService
 * @module tests/services/MouseInteractionService
 */

import { MouseInteractionService } from '../../src/services/MouseInteractionService';

describe('MouseInteractionService', () => {
  let service: MouseInteractionService;

  beforeEach(() => {
    service = new MouseInteractionService();
  });

  describe('initialization', () => {
    it('should create service', () => {
      expect(service).toBeDefined();
    });

    it('should be enabled by default', () => {
      expect(service.getEnabled()).toBe(true);
    });
  });

  describe('enable/disable', () => {
    it('should set enabled state', () => {
      service.setEnabled(false);
      expect(service.getEnabled()).toBe(false);

      service.setEnabled(true);
      expect(service.getEnabled()).toBe(true);
    });
  });

  describe('scroll registration', () => {
    it('should register scroll zoom', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerScrollZoom(element, handler);
      }).not.toThrow();
    });

    it('should register scroll parameter', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerScrollParameter(element, handler);
      }).not.toThrow();
    });

    it('should register scroll timeline', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerScrollTimeline(element, handler);
      }).not.toThrow();
    });
  });

  describe('pan registration', () => {
    it('should register middle mouse pan', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerMiddleMousePan(element, handler);
      }).not.toThrow();
    });
  });

  describe('drag and drop', () => {
    it('should register drag start', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerDragStart(element, handler);
      }).not.toThrow();
    });

    it('should register drop', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerDrop(element, handler);
      }).not.toThrow();
    });

    it('should register drag', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      expect(() => {
        service.registerDrag(element, handler);
      }).not.toThrow();
    });
  });

  describe('unregister', () => {
    it('should unregister element', () => {
      const element = document.createElement('div');
      const handler = jest.fn();

      service.registerScrollZoom(element, handler);
      expect(() => {
        service.unregister(element);
      }).not.toThrow();
    });
  });
});

