# API Documentation

Comprehensive API reference for FL Studio Web DAW.

## Table of Contents

- [Audio Engine](#audio-engine)
- [Services](#services)
- [Hooks](#hooks)
- [Components](#components)
- [Types](#types)
- [Utilities](#utilities)

---

## Audio Engine

### AudioEngine

Core audio processing engine using Web Audio API.

```typescript
class AudioEngine {
  constructor(audioContext?: AudioContext);
  
  // Properties
  audioContext: AudioContext;
  masterGain: GainNode;
  
  // Methods
  init(): Promise<void>;
  suspend(): Promise<void>;
  resume(): Promise<void>;
  setMasterVolume(volume: number): void;
}
```

**Usage:**
```typescript
const engine = new AudioEngine();
await engine.init();
engine.setMasterVolume(0.8);
```

### Synthesizer

Multi-oscillator synthesizer with ADSR envelope.

```typescript
class Synthesizer {
  constructor(audioContext: AudioContext);
  
  playNote(
    frequency: number,
    velocity: number,
    duration?: number
  ): void;
  
  stopNote(frequency: number): void;
  stopAllNotes(): void;
  
  updateSettings(settings: Partial<SynthSettings>): void;
}
```

**Settings:**
```typescript
interface SynthSettings {
  waveform: 'sine' | 'square' | 'sawtooth' | 'triangle';
  attack: number;    // 0-1 seconds
  decay: number;     // 0-1 seconds
  sustain: number;   // 0-1 level
  release: number;   // 0-1 seconds
  cutoff: number;    // 20-20000 Hz
  resonance: number; // 0-30 dB
}
```

### SamplePlayer

Audio sample playback engine.

```typescript
class SamplePlayer {
  constructor(audioContext: AudioContext);
  
  loadSample(url: string): Promise<AudioBuffer>;
  playSample(buffer: AudioBuffer, time?: number): void;
  stopAllSamples(): void;
}
```

---

## Services

### BrowserService

Sound browser and library management.

```typescript
class BrowserService {
  // Search sounds
  searchSounds(
    query: string,
    category: string | null,
    folder: string | null
  ): Sound[];
  
  // Get sounds by category
  getSoundsByCategory(
    category: string,
    folder: string | null
  ): Sound[];
  
  // Get all categories
  getCategories(): string[];
  
  // Load sound
  loadSound(soundId: string): Promise<AudioBuffer>;
}
```

**Types:**
```typescript
interface Sound {
  id: string;
  name: string;
  category: string;
  folder?: string;
  url: string;
  tags?: string[];
}
```

### WindowManagerService

Window management system.

```typescript
class WindowManagerService {
  // Create window
  createWindow(
    type: WindowType,
    options?: WindowOptions
  ): string; // returns window ID
  
  // Close window
  closeWindow(id: string): void;
  
  // Update window
  updateWindow(id: string, updates: Partial<WindowState>): void;
  
  // Focus window
  focusWindow(id: string): void;
  
  // Get window
  getWindow(id: string): WindowState | undefined;
  
  // Get all windows
  getAllWindows(): Map<string, WindowState>;
}
```

**Types:**
```typescript
type WindowType = 
  | 'mixer'
  | 'playlist'
  | 'piano-roll'
  | 'browser'
  | 'effects'
  | 'channel-settings';

interface WindowOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isFloating?: boolean;
  dockPosition?: DockPosition;
}

interface WindowState {
  id: string;
  type: WindowType;
  isOpen: boolean;
  isFocused: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isFloating: boolean;
  dockPosition?: DockPosition;
  zIndex: number;
}
```

### UndoRedoService

Undo/redo functionality.

```typescript
class UndoRedoService {
  // Add action
  addAction(action: UndoableAction): void;
  
  // Undo/Redo
  undo(): boolean;
  redo(): boolean;
  
  // Query state
  canUndo(): boolean;
  canRedo(): boolean;
  
  // Clear history
  clear(): void;
}
```

**Action Interface:**
```typescript
interface UndoableAction {
  type: string;
  description: string;
  undo: () => void;
  redo: () => void;
}
```

### EffectSlotService

Audio effects management.

```typescript
class EffectSlotService {
  // Add effect
  addEffect(
    trackId: string,
    effectType: EffectType,
    slotIndex?: number
  ): EffectSlot;
  
  // Remove effect
  removeEffect(trackId: string, slotIndex: number): void;
  
  // Update effect
  updateEffect(
    trackId: string,
    slotIndex: number,
    parameters: Partial<EffectParameters>
  ): void;
  
  // Get effects
  getEffects(trackId: string): EffectSlot[];
}
```

**Types:**
```typescript
type EffectType = 
  | 'reverb'
  | 'delay'
  | 'distortion'
  | 'filter'
  | 'compressor'
  | 'eq';

interface EffectSlot {
  id: string;
  type: EffectType;
  enabled: boolean;
  parameters: EffectParameters;
  wet: number; // 0-1
}
```

---

## Hooks

### useProject

Project state management.

```typescript
function useProject() {
  return {
    project: ProjectData;
    
    // Project operations
    createProject(name: string): void;
    loadProject(data: ProjectData): void;
    saveProject(): void;
    exportProject(): void;
    importProject(file: File): Promise<void>;
    
    // Project properties
    updateProject(updates: Partial<ProjectData>): void;
    setBPM(bpm: number): void;
    setName(name: string): void;
  };
}
```

### useTracks

Track management.

```typescript
function useTracks() {
  return {
    tracks: Track[];
    
    // Track operations
    addTrack(name?: string): Track;
    removeTrack(id: string): void;
    updateTrack(id: string, updates: Partial<Track>): void;
    
    // Track properties
    setTrackVolume(id: string, volume: number): void;
    setTrackPan(id: string, pan: number): void;
    setTrackMute(id: string, muted: boolean): void;
    setTrackSolo(id: string, solo: boolean): void;
    
    // Pattern assignment
    assignPattern(trackId: string, patternId: string): void;
  };
}
```

### usePatterns

Pattern management.

```typescript
function usePatterns() {
  return {
    patterns: Pattern[];
    selectedPattern: Pattern | null;
    
    // Pattern operations
    createPattern(name?: string): Pattern;
    deletePattern(id: string): void;
    duplicatePattern(id: string): Pattern;
    selectPattern(id: string): void;
    
    // Note operations
    addNote(patternId: string, note: Note): void;
    removeNote(patternId: string, noteId: string): void;
    updateNote(
      patternId: string,
      noteId: string,
      updates: Partial<Note>
    ): void;
  };
}
```

### usePlayback

Playback control.

```typescript
function usePlayback() {
  return {
    isPlaying: boolean;
    currentTime: number;
    
    // Playback control
    play(): void;
    pause(): void;
    stop(): void;
    seek(time: number): void;
    
    // Transport
    setLoop(enabled: boolean): void;
    setLoopRegion(start: number, end: number): void;
  };
}
```

### useWindowManager

Window management hook.

```typescript
function useWindowManager() {
  return {
    windows: Map<string, WindowState>;
    
    createWindow(type: WindowType, options?: WindowOptions): string;
    closeWindow(id: string): void;
    toggleWindow(type: WindowType): void;
    focusWindow(id: string): void;
    minimizeWindow(id: string): void;
    maximizeWindow(id: string): void;
  };
}
```

---

## Components

### Transport

Playback transport controls.

```typescript
interface TransportProps {
  isPlaying: boolean;
  bpm: number;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onBPMChange: (bpm: number) => void;
}

<Transport {...props} />
```

### TrackRow

Individual track component.

```typescript
interface TrackRowProps {
  track: Track;
  onVolumeChange: (volume: number) => void;
  onPanChange: (pan: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onRemove: () => void;
}

<TrackRow {...props} />
```

### PatternEditor

Pattern editing interface.

```typescript
interface PatternEditorProps {
  pattern: Pattern;
  onNoteAdd: (note: Note) => void;
  onNoteRemove: (noteId: string) => void;
  onNoteUpdate: (noteId: string, updates: Partial<Note>) => void;
}

<PatternEditor {...props} />
```

---

## Types

### Core Types

```typescript
// Project
interface ProjectData {
  id: string;
  name: string;
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  tracks: Track[];
  patterns: Pattern[];
  createdAt: number;
  updatedAt: number;
}

// Track
interface Track {
  id: string;
  name: string;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  patternId: string | null;
  effects: EffectSlot[];
}

// Pattern
interface Pattern {
  id: string;
  name: string;
  notes: Note[];
  length: number; // in beats
  color?: string;
}

// Note
interface Note {
  id: string;
  pitch: number; // MIDI note number
  start: number; // in beats
  duration: number; // in beats
  velocity: number; // 0-127
}

// Audio
interface AudioBuffer {
  sampleRate: number;
  length: number;
  duration: number;
  numberOfChannels: number;
  getChannelData(channel: number): Float32Array;
}
```

---

## Utilities

### Time Conversion

```typescript
// Beats to seconds
function beatsToSeconds(beats: number, bpm: number): number;

// Seconds to beats
function secondsToBeats(seconds: number, bpm: number): number;

// MIDI note to frequency
function midiToFreq(note: number): number;

// Frequency to MIDI note
function freqToMidi(freq: number): number;
```

### Audio Utilities

```typescript
// Normalize audio buffer
function normalizeBuffer(buffer: AudioBuffer): AudioBuffer;

// Mix audio buffers
function mixBuffers(
  buffers: AudioBuffer[],
  gains?: number[]
): AudioBuffer;

// Apply fade
function applyFade(
  buffer: AudioBuffer,
  fadeIn: number,
  fadeOut: number
): AudioBuffer;
```

### File Utilities

```typescript
// Export as WAV
function exportWAV(
  buffer: AudioBuffer,
  filename: string
): void;

// Export as MP3
function exportMP3(
  buffer: AudioBuffer,
  filename: string,
  bitrate?: number
): void;

// Load audio file
function loadAudioFile(file: File): Promise<AudioBuffer>;
```

---

## Events

### Custom Events

The application emits custom events that you can listen to:

```typescript
// Track events
window.addEventListener('track:created', (e: CustomEvent<Track>) => {});
window.addEventListener('track:updated', (e: CustomEvent<Track>) => {});
window.addEventListener('track:removed', (e: CustomEvent<string>) => {});

// Pattern events
window.addEventListener('pattern:created', (e: CustomEvent<Pattern>) => {});
window.addEventListener('pattern:updated', (e: CustomEvent<Pattern>) => {});
window.addEventListener('pattern:selected', (e: CustomEvent<string>) => {});

// Playback events
window.addEventListener('playback:started', () => {});
window.addEventListener('playback:paused', () => {});
window.addEventListener('playback:stopped', () => {});
window.addEventListener('playback:timeupdate', (e: CustomEvent<number>) => {});
```

---

## Error Handling

### Custom Errors

```typescript
class AudioContextError extends Error {
  constructor(message: string, context?: any);
}

class FileLoadError extends Error {
  constructor(message: string, file?: string);
}

class InvalidParameterError extends Error {
  constructor(parameter: string, value: any);
}
```

### Error Events

```typescript
window.addEventListener('error:audio', (e: CustomEvent<Error>) => {
  console.error('Audio error:', e.detail);
});

window.addEventListener('error:file', (e: CustomEvent<Error>) => {
  console.error('File error:', e.detail);
});
```

---

## Configuration

### Audio Configuration

```typescript
interface AudioConfig {
  sampleRate: number;      // default: 44100
  bufferSize: number;      // default: 256
  latencyHint: 'interactive' | 'balanced' | 'playback';
}
```

### UI Configuration

```typescript
interface UIConfig {
  theme: 'dark' | 'light';
  gridSize: number;
  snapToGrid: boolean;
  showWaveforms: boolean;
}
```

---

## Best Practices

1. **Always initialize audio context on user interaction**
   ```typescript
   button.addEventListener('click', async () => {
     await audioEngine.init();
   });
   ```

2. **Handle audio context state**
   ```typescript
   if (audioContext.state === 'suspended') {
     await audioContext.resume();
   }
   ```

3. **Clean up audio nodes**
   ```typescript
   useEffect(() => {
     const node = audioContext.createGain();
     return () => {
       node.disconnect();
     };
   }, []);
   ```

4. **Use proper error handling**
   ```typescript
   try {
     await loadSound(url);
   } catch (error) {
     console.error('Failed to load sound:', error);
   }
   ```

---

## Examples

See the `examples/` directory for complete usage examples.

For more information, see the [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).
