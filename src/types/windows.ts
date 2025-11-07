/**
 * Type definitions for window management system
 * @module types/windows
 */

/**
 * Window type identifier
 */
export type WindowType =
  | 'channel-rack'
  | 'piano-roll'
  | 'playlist'
  | 'mixer'
  | 'browser'
  | 'effects'
  | 'channel-settings'
  | 'synthesizer';

/**
 * Window state
 */
export interface WindowState {
  id: string;
  type: WindowType;
  x: number;
  y: number;
  width: number;
  height: number;
  isVisible: boolean;
  isFloating: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  docked?: boolean;
  dockPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  tabGroupId?: string;
  title?: string;
}

/**
 * Window layout (collection of window states)
 */
export interface WindowLayout {
  id: string;
  name: string;
  windows: WindowState[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Docking zone
 */
export interface DockingZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
}

/**
 * Tab group
 */
export interface TabGroup {
  id: string;
  windowIds: string[];
  activeWindowId: string;
}

/**
 * Global Window interface extensions
 * Declares all classes and functions exported to the window object for browser compatibility
 */
declare global {
  interface Window {
    Synthesizer?: unknown;
    EnvelopeGenerator?: unknown;
    SamplePlayer?: unknown;
    loadAudioSample?: (
      audioContext: AudioContext,
      source: string | File | ArrayBuffer
    ) => Promise<AudioBuffer>;
    createSamplePlayer?: (
      audioContext: AudioContext,
      source: string | File | ArrayBuffer
    ) => Promise<unknown>;
    InstrumentManager?: unknown;
    AudioRecorder?: unknown;
    EffectChain?: unknown;
    EQ?: unknown;
    Compressor?: unknown;
    TrackMixer?: unknown;
    BusManager?: unknown;
    LUFSMeter?: unknown;
    timelineUtils?: unknown;
  }
}

export {};

