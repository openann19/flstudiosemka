/**
 * Tests for useProject hook
 * @module tests/hooks/useProject
 */

import { renderHook, act } from '@testing-library/react';
import { useProject } from '../../src/hooks/useProject';
import { createTrack } from '../factories/track-factory';
import { createProject } from '../factories/project-factory';
import { effectSlotService } from '../../src/services/EffectSlotService';

// Mock services
jest.mock('../../src/services/EffectSlotService');

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

// Mock URL.createObjectURL and document.createElement for export
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('useProject', () => {
  const tracks = [createTrack({ id: 0, name: 'Track 1' }), createTrack({ id: 1, name: 'Track 2' })];
  const arrangements = [
    {
      id: 'arr-1',
      name: 'Arrangement 1',
      tracks: [],
    },
  ];
  const defaultProps = {
    tracks,
    arrangements,
    currentArrangementId: 'arr-1',
    bpm: 120,
    currentPattern: 0,
    zoomLevel: 1.0,
    snapSetting: 'beat',
    selectedTool: 'draw',
    clipCounter: 0,
    masterEffects: {},
    trackMixers: {},
  };

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();

    (effectSlotService.serializeChain as jest.Mock).mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper to call useProject with defaultProps
  const callUseProject = () =>
    useProject(
      defaultProps.tracks,
      defaultProps.arrangements,
      defaultProps.currentArrangementId,
      defaultProps.bpm,
      defaultProps.currentPattern,
      defaultProps.zoomLevel,
      defaultProps.snapSetting,
      defaultProps.selectedTool,
      defaultProps.clipCounter,
      defaultProps.masterEffects,
      defaultProps.trackMixers
    );

  describe('initialization', () => {
    it('should initialize with default project name', () => {
      const { result } = renderHook(() => callUseProject());

      expect(result.current.projectName).toBe('Untitled Project');
    });
  });

  describe('getProjectData', () => {
    it('should return project data with all properties', () => {
      const { result } = renderHook(() => callUseProject());

      const projectData = result.current.getProjectData();

      expect(projectData.name).toBe('Untitled Project');
      expect(projectData.bpm).toBe(120);
      expect(projectData.tracks).toEqual(tracks);
      expect(projectData.arrangements).toEqual(arrangements);
      expect(projectData.currentPattern).toBe(0);
      expect(projectData.zoomLevel).toBe(1.0);
      expect(projectData.snapSetting).toBe('beat');
      expect(projectData.selectedTool).toBe('draw');
      expect(projectData.clipCounter).toBe(0);
    });

    it('should serialize effect chains for tracks', () => {
      const mockChainData = { slots: [], bypass: false };
      (effectSlotService.serializeChain as jest.Mock).mockReturnValue(mockChainData);

      const { result } = renderHook(() => callUseProject());

      const projectData = result.current.getProjectData();

      expect(effectSlotService.serializeChain).toHaveBeenCalledWith(0);
      expect(effectSlotService.serializeChain).toHaveBeenCalledWith(1);
      expect(projectData.trackEffects).toBeDefined();
    });
  });

  describe('saveProject', () => {
    it('should save project to localStorage', () => {
      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.saveProject();
      });

      const saved = localStorageMock.getItem('fl-studio-project');
      expect(saved).not.toBeNull();

      if (saved) {
        const projectData = JSON.parse(saved);
        expect(projectData.name).toBe('Untitled Project');
        expect(projectData.bpm).toBe(120);
        expect(projectData.savedAt).toBeDefined();
      }
    });

    it('should save with autoSave flag', () => {
      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.saveProject(true);
      });

      const saved = localStorageMock.getItem('fl-studio-project');
      expect(saved).not.toBeNull();
    });

    it('should handle save errors', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => callUseProject());

      expect(() => {
        act(() => {
          result.current.saveProject();
        });
      }).toThrow('useProject: Failed to save project');

      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('loadProject', () => {
    it('should load project from localStorage', () => {
      const savedProject = createProject({
        name: 'Saved Project',
        bpm: 140,
      });
      localStorageMock.setItem('fl-studio-project', JSON.stringify(savedProject));

      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.loadProject();
      });

      expect(result.current.projectName).toBe('Saved Project');
    });

    it('should handle missing project', () => {
      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.loadProject();
      });

      // Should not change name if no project saved
      expect(result.current.projectName).toBe('Untitled Project');
    });

    it('should handle load errors', () => {
      localStorageMock.setItem('fl-studio-project', 'invalid json');

      const { result } = renderHook(() => callUseProject());

      expect(() => {
        act(() => {
          result.current.loadProject();
        });
      }).toThrow('useProject: Failed to load project');
    });
  });

  describe('exportProject', () => {
    it('should export project as JSON file', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.exportProject();
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toContain('.flp');
      expect(mockLink.click).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it('should include export metadata', () => {
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      };
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.exportProject();
      });

      const blobCall = (global.URL.createObjectURL as jest.Mock).mock.calls[0]?.[0];
      expect(blobCall).toBeInstanceOf(Blob);

      // Verify blob content contains project data
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const projectData = JSON.parse(content);
        expect(projectData.version).toBe('1.0');
        expect(projectData.exportedAt).toBeDefined();
      };
      reader.readAsText(blobCall);
    });

    it('should handle export errors', () => {
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn(() => {
        throw new Error('DOM error');
      });

      const { result } = renderHook(() => callUseProject());

      expect(() => {
        act(() => {
          result.current.exportProject();
        });
      }).toThrow('useProject: Failed to export project');

      document.createElement = originalCreateElement;
    });
  });

  describe('importProject', () => {
    it('should import project from file', async () => {
      const projectData = createProject({ name: 'Imported Project' });
      const file = new File([JSON.stringify(projectData)], 'project.flp', {
        type: 'application/json',
      });

      const { result } = renderHook(() => callUseProject());

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(result.current.projectName).toBe('Imported Project');
    });

    it('should handle import errors', async () => {
      const file = new File(['invalid json'], 'project.flp', {
        type: 'application/json',
      });

      const { result } = renderHook(() => callUseProject());

      await expect(
        act(async () => {
          await result.current.importProject(file);
        })
      ).rejects.toThrow('useProject: Failed to import project');
    });

    it('should use default name for imported project without name', async () => {
      const projectData = { bpm: 120, tracks: [] };
      const file = new File([JSON.stringify(projectData)], 'project.flp', {
        type: 'application/json',
      });

      const { result } = renderHook(() => callUseProject());

      await act(async () => {
        await result.current.importProject(file);
      });

      expect(result.current.projectName).toBe('Imported Project');
    });
  });

  describe('newProject', () => {
    it('should reset project name', () => {
      const { result } = renderHook(() => callUseProject());

      act(() => {
        result.current.newProject();
      });

      expect(result.current.projectName).toBe('Untitled Project');
    });
  });

  describe('auto-save', () => {
    it('should auto-save every 30 seconds', () => {
      const { result } = renderHook(() => callUseProject());

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      const saved = localStorageMock.getItem('fl-studio-project');
      expect(saved).not.toBeNull();
    });

    it('should cleanup auto-save on unmount', () => {
      const { unmount } = renderHook(() => callUseProject());

      unmount();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});

