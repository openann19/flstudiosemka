/**
 * useProject - Project save/load operations hook
 * Strict TypeScript implementation with comprehensive error handling
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ProjectData, Track, Arrangement } from '../types/FLStudio.types';
import { effectSlotService } from '../services/EffectSlotService';

interface UseProjectReturn {
  projectName: string;
  saveProject: (autoSave?: boolean) => void;
  loadProject: () => void;
  exportProject: () => void;
  importProject: (file: File) => Promise<void>;
  newProject: () => void;
  getProjectData: () => ProjectData;
}

const STORAGE_KEY = 'fl-studio-project';

export function useProject(
  tracks: Track[],
  arrangements: Arrangement[],
  currentArrangementId: string | null,
  bpm: number,
  currentPattern: number,
  zoomLevel: number,
  snapSetting: string,
  selectedTool: string,
  clipCounter: number,
  masterEffects: unknown,
  _trackMixers: unknown
): UseProjectReturn {
  const [projectName, setProjectName] = useState<string>('Untitled Project');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Get project data
   */
  const getProjectData = useCallback((): ProjectData => {
    // Serialize effect chains for all tracks
    const trackEffectChains: Record<number, unknown> = {};
    tracks.forEach((track) => {
      const chainData = effectSlotService.serializeChain(track.id);
      if (chainData) {
        trackEffectChains[track.id] = chainData;
      }
    });

    return {
      name: projectName,
      bpm,
      tracks,
      currentPattern,
      arrangements,
      currentArrangementId,
      zoomLevel,
      snapSetting: snapSetting as ProjectData['snapSetting'],
      selectedTool: selectedTool as ProjectData['selectedTool'],
      clipCounter,
      masterEffects: masterEffects as ProjectData['masterEffects'],
      trackEffects: trackEffectChains as ProjectData['trackEffects'],
    };
  }, [projectName, bpm, tracks, currentPattern, arrangements, currentArrangementId, zoomLevel, snapSetting, selectedTool, clipCounter, masterEffects]);

  /**
   * Save project
   */
  const saveProject = useCallback(
    (_autoSave = false) => {
      try {
        const projectData = getProjectData();
        projectData.savedAt = new Date().toISOString();

        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
      } catch (error) {
        throw new Error(`useProject: Failed to save project - ${error}`);
      }
    },
    [getProjectData]
  );

  /**
   * Load project
   */
  const loadProject = useCallback(() => {
    try {
      const savedProject = localStorage.getItem(STORAGE_KEY);
      if (!savedProject) {
        return;
      }

      const projectData = JSON.parse(savedProject) as ProjectData;

      setProjectName(projectData.name || 'Untitled Project');
    } catch (error) {
      throw new Error(`useProject: Failed to load project - ${error}`);
    }
  }, []);

  /**
   * Export project
   */
  const exportProject = useCallback(() => {
    try {
      const projectData = getProjectData();
      projectData.exportedAt = new Date().toISOString();
      projectData.version = '1.0';

      const dataStr = JSON.stringify(projectData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `${projectName.replace(/\s+/g, '_')}.flp`;
      link.style.display = 'none';
      
      // Append to body for proper download behavior
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        if (link.parentNode) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(link.href);
      }, 100);
    } catch (error) {
      throw new Error(`useProject: Failed to export project - ${error}`);
    }
  }, [getProjectData, projectName]);

  /**
   * Import project
   */
  const importProject = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const projectData = JSON.parse(text) as ProjectData;

      setProjectName(projectData.name || 'Imported Project');
    } catch (error) {
      throw new Error(`useProject: Failed to import project - ${error}`);
    }
  }, []);

  /**
   * New project
   */
  const newProject = useCallback(() => {
    setProjectName('Untitled Project');
  }, []);

  /**
   * Start auto-save
   */
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      saveProject(true);
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveProject]);

  return {
    projectName,
    saveProject,
    loadProject,
    exportProject,
    importProject,
    newProject,
    getProjectData,
  };
}

