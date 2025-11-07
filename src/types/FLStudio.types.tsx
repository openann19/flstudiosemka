/**
 * TypeScript type definitions for FL Studio Web DAW
 * Strict typing for all application data structures
 * @module types/FLStudio.types
 */

export type TrackType = 'drum' | 'synth' | 'sample' | 'effect' | 'plugin';
export type ClipType = 'pattern' | 'audio' | 'automation';
export type SnapSetting = 'bar' | 'beat' | 'step' | 'none';
export type ToolType = 'draw' | 'paint' | 'select' | 'slip' | 'delete' | 'mute' | 'slice';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass';
export type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type AudioUnlockState = 'pending' | 'unlocking' | 'resolved';

export interface TrackParams {
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
    type: FilterType;
  };
  detune: number;
  waveform: WaveformType;
  sends: {
    reverb: number;
    delay: number;
  };
}

export interface Track {
  id: number;
  name: string;
  type: TrackType;
  steps: boolean[];
  muted: boolean;
  solo: boolean;
  color?: string;
  mixerLevel?: number;
  params?: TrackParams;
  sampleBuffer?: AudioBuffer;
  samplePlayer?: unknown;
  recordedBuffer?: AudioBuffer;
  clips?: Clip[];
  mode?: string;
  mixerChannel?: string;
  notes?: string;
}

export interface Clip {
  id: string;
  type: ClipType;
  start: number;
  length: number;
  name: string;
  muted?: boolean;
  patternId?: number;
  audioId?: string;
  automationTarget?: string;
  [key: string]: unknown;
}

export interface TimelineMarker {
  beat: number;
  label: string;
}

export interface ArrangementTrack {
  id: string;
  name: string;
  mode: string;
  mixerChannel: string;
  color: string;
  clips: Clip[];
}

export interface Arrangement {
  id: string;
  name: string;
  lengthBars: number;
  tracks: ArrangementTrack[];
  markers: TimelineMarker[];
}

export interface MasterEffects {
  reverb: {
    enabled: boolean;
    wet: number;
    decay: number;
  };
  delay: {
    enabled: boolean;
    wet: number;
    time: number;
    feedback: number;
  };
  distortion: {
    enabled: boolean;
    amount: number;
  };
  filter: {
    enabled: boolean;
    frequency: number;
    type: FilterType;
  };
}

export interface SoundItem {
  name: string;
  type: TrackType;
  icon: string;
}

export interface SoundLibrary {
  presets: {
    [folder: string]: SoundItem[];
  };
  samples: {
    [folder: string]: SoundItem[];
  };
  plugins: SoundItem[];
}

export interface ProjectData {
  name: string;
  bpm: number;
  tracks: Track[];
  currentPattern: number;
  savedAt?: string;
  arrangements: Arrangement[];
  currentArrangementId: string | null;
  zoomLevel: number;
  snapSetting: SnapSetting;
  selectedTool: ToolType;
  clipCounter: number;
  drumMachineState?: unknown;
  masterEffects?: MasterEffects;
  trackEffects?: unknown;
  duration?: number;
  exportedAt?: string;
  version?: string;
}

export interface PointerState {
  isPointerDown: boolean;
  originBeat: number;
  currentBeat: number;
  trackId: string | null;
  clipId: string | null;
  laneElement: HTMLElement | null;
  clipElement: HTMLElement | null;
  lastPaintBeat: number | null;
}

export interface AudioUnlockCallbacks {
  callbacks: Set<(context: AudioContext) => void>;
  promise: Promise<AudioContext> | null;
  resolve: ((context: AudioContext) => void) | null;
  handler: (() => void) | null;
}

export interface TimelineUtils {
  barsToBeats: (bars: number, beatsPerBar: number) => number;
  formatBeatPosition: (beat: number, beatsPerBar: number, stepsPerBeat: number) => string;
  formatClockTime: (beat: number, bpm: number) => string;
  generateDefaultMarkers: (bars: number, beatsPerBar: number) => TimelineMarker[];
  buildRulerTicks: (options: {
    totalBeats: number;
    beatsPerBar: number;
  }) => Array<{
    beat: number;
    label: string;
    isMajor: boolean;
  }>;
  buildGridLines: (options: {
    totalBeats: number;
    beatsPerBar: number;
    stepsPerBeat: number;
    snapSetting: SnapSetting;
  }) => Array<{
    beat: number;
    type: 'bar' | 'beat' | 'step';
  }>;
}

export interface MIDIEvent {
  note: number;
  velocity: number;
}

export interface ActiveVoice {
  voiceId: number;
  trackId: number;
}

export interface ExportOptions {
  format: 'wav' | 'mp3' | 'ogg';
  bitDepth?: 16 | 24 | 32;
}

export interface PatternClipboard {
  steps: boolean[];
  name: string;
}

