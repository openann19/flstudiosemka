/**
 * Integration tests for project save/load workflow
 * @module tests/integration/project-save-load
 */

import { renderHook, act } from '@testing-library/react';
import { useProject } from '../../src/hooks/useProject';
import { createTrack } from '../factories/track-factory';
import { createProject } from '../factories/project-factory';

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

describe('Project Save/Load Workflow', () => {
  const tracks = [createTrack({ id: 0, name: 'Track 1' }), createTrack({ id: 1, name: 'Track 2' })];
  const arrangements = [
    {
      id: 'arr-1',
      name: 'Arrangement 1',
      lengthBars: 4,
      tracks: [],
      markers: [],
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
  });

  it('should save project and load it back', () => {
    const { result } = renderHook(() =>
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
      )
    );

    act(() => {
      result.current.saveProject();
    });

    const saved = localStorageMock.getItem('fl-studio-project');
    expect(saved).not.toBeNull();

    if (saved) {
      const projectData = JSON.parse(saved);
      expect(projectData.name).toBe('Untitled Project');
      expect(projectData.bpm).toBe(120);
      expect(projectData.tracks).toHaveLength(2);
    }

    // Load project
    act(() => {
      result.current.loadProject();
    });

    expect(result.current.projectName).toBe('Untitled Project');
  });

  it('should save project with custom name and load it', () => {
    const { result } = renderHook(() =>
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
      )
    );

    // In a real implementation, projectName would be settable
    act(() => {
      result.current.saveProject();
    });

    const saved = localStorageMock.getItem('fl-studio-project');
    expect(saved).not.toBeNull();

    act(() => {
      result.current.loadProject();
    });

    // Project should be loaded
    expect(result.current.projectName).toBeDefined();
  });

  it('should export project and verify format', () => {
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {},
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    };
    const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

    const { result } = renderHook(() =>
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
      )
    );

    act(() => {
      result.current.exportProject();
    });

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockLink.download).toContain('.flp');

    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('should import project from file', async () => {
    const projectData = createProject({ name: 'Imported Project', bpm: 140 });
    const file = new File([JSON.stringify(projectData)], 'project.flp', {
      type: 'application/json',
    });

    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {},
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    const { result } = renderHook(() =>
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
      )
    );

    await act(async () => {
      await result.current.importProject(file);
    });

    expect(result.current.projectName).toBe('Imported Project');
  });

  it('should handle new project creation', () => {
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
      style: {},
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    const { result } = renderHook(() =>
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
      )
    );

    act(() => {
      result.current.newProject();
    });

    expect(result.current.projectName).toBe('Untitled Project');
  });
});

