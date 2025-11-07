/**
 * FLStudioApp - Main application component
 * Composes all hooks and manages global state
 * Strict TypeScript implementation with comprehensive error handling
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { usePlayback } from '../hooks/usePlayback';
import { useTracks } from '../hooks/useTracks';
import { usePlaylist } from '../hooks/usePlaylist';
import { useMixer } from '../hooks/useMixer';
import { useProject } from '../hooks/useProject';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useWindowManager } from '../hooks/useWindowManager';
import { useTools } from '../hooks/useTools';
import { useDrumKits } from '../hooks/useDrumKits';
import { useHintPanel, HintPanel } from '../components/ui/HintPanel';
import { Window } from '../components/windows/Window';
import { useContextMenu } from '../hooks/useContextMenu';
import { useMouseInteractions } from '../hooks/useMouseInteractions';
import { TrackRow } from '../components/TrackRow';
import { Toolbar } from '../components/Toolbar';
import { StatusBar } from '../components/StatusBar';
import { ViewTabs } from '../components/ViewTabs';
import { useChannelRackInteractions } from '../hooks/useChannelRackInteractions';
import { AudioService } from '../services/AudioService';
import { BrowserService } from '../services/BrowserService';
import { themeService } from '../services/ThemeService';
import { userPreferencesService } from '../services/UserPreferencesService';
import { BrowserWindow } from './windows/BrowserWindow';
import { MixerWindow } from './windows/MixerWindow';
import { PlaylistWindow } from './windows/PlaylistWindow';
import { PianoRollWindow } from './windows/PianoRollWindow';
import { ChannelSettingsWindow } from './windows/ChannelSettingsWindow';
import { EffectsWindow } from './windows/EffectsWindow';
import { SynthesizerWindow } from './windows/SynthesizerWindow';
import { PatternSelector } from './PatternSelector';
import { Transport } from './Transport';
import { ErrorBoundary } from './ErrorBoundary';
import { usePatterns } from '../hooks/usePatterns';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { loopService } from '../services/LoopService';
import type { TrackType } from '../types/FLStudio.types';

const BEATS_PER_BAR = 4;
const STEPS_PER_BEAT = 4;
const BEATS_PER_STEP = 1 / STEPS_PER_BEAT;
const BASE_PIXELS_PER_BEAT = 60;

export function FLStudioApp(): JSX.Element {
  const audioEngine = useAudioEngine();
  const mixer = useMixer();
  const tracks = useTracks([]);
  const playlist = usePlaylist({
    beatsPerBar: BEATS_PER_BAR,
    stepsPerBeat: STEPS_PER_BEAT,
    basePixelsPerBeat: BASE_PIXELS_PER_BEAT,
    timelineUtils:
      typeof window !== 'undefined' && window.timelineUtils
        ? window.timelineUtils
        : null,
  });

  const [bpm, setBpm] = React.useState<number>(140);
  const [currentPattern, setCurrentPattern] = React.useState<number>(1);
  const [selectedTrackId, setSelectedTrackId] = React.useState<number | null>(null);
  const [activeView, setActiveView] = React.useState<'browser' | 'mixer' | 'channel-rack' | 'playlist' | 'piano-roll' | 'effects'>('channel-rack');
  const [cpuUsage, setCpuUsage] = React.useState<number>(0);
  const [memoryUsage, setMemoryUsage] = React.useState<number>(0);
  const [isRecording, setIsRecording] = React.useState<boolean>(false);
  const [loopEnabled, setLoopEnabled] = React.useState<boolean>(false);
  const [metronomeEnabled, setMetronomeEnabled] = React.useState<boolean>(false);
  const [metronomeVolume, setMetronomeVolume] = React.useState<number>(0.5);
  const [timeSignature, setTimeSignature] = React.useState<{ numerator: number; denominator: number }>({ numerator: 4, denominator: 4 });
  const [channelSettingsTrack, setChannelSettingsTrack] = React.useState<number | null>(null);
  const [masterVolume, setMasterVolume] = React.useState<number>(80);
  const [masterPan, setMasterPan] = React.useState<number>(0);
  const audioServiceRef = useRef<AudioService | null>(null);
  const browserServiceRef = useRef<BrowserService | null>(null);
  const performanceMonitorRef = useRef<number | null>(null);
  const lastPerformanceUpdateRef = useRef<number>(0);
  const PERFORMANCE_THROTTLE_MS = 100; // 10fps for performance monitoring (less critical)

  // Initialize drum kits
  const drumKits = useDrumKits(audioEngine.audioContext, null);

  // Pattern management
  const patterns = usePatterns({ defaultSteps: 16 });

  // Undo/Redo (ready for future use)
   
  const _undoRedo = useUndoRedo(100);
  void _undoRedo; // Mark as intentionally unused

  // New workflow systems
  const keyboardShortcuts = useKeyboardShortcuts({ context: 'global' });
  const windowManager = useWindowManager();
  const tools = useTools();
  const hintPanel = useHintPanel();
  // Context menu and mouse interactions are available for use in components
   
  const contextMenu = useContextMenu();
  void contextMenu; // Mark as intentionally unused
   
  const mouseInteractions = useMouseInteractions({ enabled: true });
  void mouseInteractions; // Mark as intentionally unused
  
  // Channel rack mouse interactions
  const channelRackInteractions = useChannelRackInteractions({
    onScroll: (delta) => {
      // Handle vertical scrolling
      const panel = document.getElementById('channel-rack-panel');
      if (panel) {
        panel.scrollTop += delta;
      }
    },
    enabled: true,
  });

  /**
   * Play current step
   */
  const playCurrentStep = useCallback(
    (currentStep: number) => {
      if (!audioEngine.audioContext || audioEngine.audioContext.state !== 'running') {
        return;
      }

      tracks.tracks.forEach(async (track) => {
        if (track.steps[currentStep] && !track.muted) {
          try {
            if (audioEngine.audioContext && audioEngine.audioContext.state === 'suspended') {
              await audioEngine.audioContext.resume();
            }

            if (audioEngine.audioContext && audioEngine.audioContext.state === 'running') {
              if (track.samplePlayer && typeof (window as { SamplePlayer?: unknown }).SamplePlayer !== 'undefined') {
                const trackMixer = mixer.getTrackMixer(track.id);
                if (trackMixer) {
                  const playback = (track.samplePlayer as { play: (vol: number, start: number, end: number | null, offset: number) => { gain?: GainNode } }).play(1.0, 0, null, 0);
                  if (playback && playback.gain) {
                    playback.gain.disconnect();
                    const input = (trackMixer as { getInput: () => AudioNode }).getInput();
                    playback.gain.connect(input);
                  }
                } else {
                  (track.samplePlayer as { play: (vol: number, start: number, end: number | null, offset: number) => void }).play(1.0, 0, null, 0);
                }
              } else if (audioServiceRef.current) {
                audioServiceRef.current.playSound(
                  track.type,
                  track.name.toLowerCase(),
                  track.id,
                  mixer.getTrackMixer(track.id),
                  mixer.masterEffects
                );
              }
            }
          } catch {
            // Silent error handling
          }
        }
      });
    },
    [audioEngine.audioContext, tracks, mixer]
  );

  const playback = usePlayback({
    audioContext: audioEngine.audioContext,
    tracks: tracks.tracks,
    bpm,
    beatsPerStep: BEATS_PER_STEP,
    playCurrentStep,
    getTrackMixer: mixer.getTrackMixer,
    busManager: null,
  });

  const project = useProject(
    tracks.tracks,
    playlist.arrangements,
    playlist.currentArrangementId,
    bpm,
    currentPattern,
    playlist.zoomLevel,
    playlist.snapSetting,
    playlist.selectedTool,
    playlist.clipCounter,
    mixer.masterEffects,
    mixer.trackMixers
  );

  /**
   * Initialize services
   */
  useEffect(() => {
    if (audioEngine.audioContext) {
      audioServiceRef.current = new AudioService(audioEngine.audioContext);
    }
    browserServiceRef.current = new BrowserService();

    // Initialize theme from preferences
    const savedTheme = userPreferencesService.getTheme();
    if (savedTheme) {
      themeService.setTheme(savedTheme);
    }

    // Apply theme on mount
    themeService.getCurrentTheme();
  }, [audioEngine.audioContext]);

  /**
   * Update BrowserService when drum kits are initialized
   */
  useEffect(() => {
    if (drumKits.samplePackBank && drumKits.isInitialized && browserServiceRef.current) {
      browserServiceRef.current.setSamplePackBank(drumKits.samplePackBank);
    }
  }, [drumKits.samplePackBank, drumKits.isInitialized]);

  /**
   * Initialize audio on unlock
   */
  useEffect(() => {
    audioEngine.onAudioUnlock(
      () => {
        if (audioEngine.audioContext) {
          audioEngine.loadAudioWorkletProcessor();
        }
      },
      { invokeImmediately: false }
    );
  }, [audioEngine]);

  /**
   * Initialize default arrangement
   */
  useEffect(() => {
    if (playlist.arrangements.length === 0) {
      playlist.initializeDefaultArrangement();
    }
  }, [playlist.arrangements.length, playlist.initializeDefaultArrangement]);

  /**
   * Performance monitoring
   */
  useEffect(() => {
    const updatePerformance = (): void => {
      // CPU usage estimation based on audio context state and active tracks
      if (audioEngine.audioContext && audioEngine.audioContext.state === 'running') {
        const activeTracks = tracks.tracks.filter((t) => !t.muted).length;
        const estimatedCpu = Math.min(100, (activeTracks / tracks.tracks.length) * 50 + (playback.isPlaying ? 20 : 0));
        setCpuUsage(estimatedCpu);
      } else {
        setCpuUsage(0);
      }

      // Memory usage estimation
      if ('memory' in performance && performance.memory) {
        const memory = performance.memory as { usedJSHeapSize: number };
        const memoryMB = memory.usedJSHeapSize / 1024 / 1024;
        setMemoryUsage(memoryMB);
      } else {
        // Fallback estimation
        const estimatedMemory = tracks.tracks.length * 0.5 + playlist.arrangements.length * 2;
        setMemoryUsage(estimatedMemory);
      }

      performanceMonitorRef.current = requestAnimationFrame(updatePerformance);
    };

    performanceMonitorRef.current = requestAnimationFrame(updatePerformance);

    return () => {
      if (performanceMonitorRef.current !== null) {
        cancelAnimationFrame(performanceMonitorRef.current);
      }
    };
  }, [audioEngine.audioContext, tracks.tracks, playback.isPlaying, playlist.arrangements.length]);

  /**
   * Load project on mount
   */
  useEffect(() => {
    project.loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Create initial tracks if none exist
   */
  useEffect(() => {
    if (tracks.tracks.length === 0) {
      const starterTracks: Array<{ name: string; type: TrackType }> = [
        { name: 'Kick', type: 'drum' },
        { name: 'Snare', type: 'drum' },
        { name: 'Hi-Hat', type: 'drum' },
        { name: 'Bass Synth', type: 'synth' },
        { name: 'Lead Synth', type: 'synth' },
      ];
      starterTracks.forEach(({ name, type }) => {
        tracks.addTrack(name, type);
      });
    }
  }, [tracks]);

  /**
   * Initialize track mixers
   */
  useEffect(() => {
    if (audioEngine.audioContext) {
      tracks.tracks.forEach((track) => {
        mixer.initializeTrackMixer(track.id, audioEngine.audioContext!);
      });
    }
  }, [audioEngine.audioContext, tracks.tracks, mixer]);

  /**
   * Register keyboard shortcuts
   */
  useEffect(() => {
    // Navigation shortcuts (F5-F10)
    keyboardShortcuts.registerShortcut(
      'toggle-playlist',
      'Toggle Playlist',
      'Show/hide Playlist window',
      { key: 'F7' },
      () => {
        windowManager.toggleWindowByType('playlist');
        setActiveView('playlist');
      }
    );

    keyboardShortcuts.registerShortcut(
      'toggle-channel-rack',
      'Toggle Channel Rack',
      'Show/hide Channel Rack window',
      { key: 'F6' },
      () => {
        windowManager.toggleWindowByType('channel-rack');
        setActiveView('channel-rack');
      }
    );

    keyboardShortcuts.registerShortcut(
      'toggle-piano-roll',
      'Toggle Piano Roll',
      'Show/hide Piano Roll window',
      { key: 'F9' },
      () => {
        windowManager.toggleWindowByType('piano-roll');
        setActiveView('piano-roll');
      }
    );

    keyboardShortcuts.registerShortcut(
      'toggle-mixer',
      'Toggle Mixer',
      'Show/hide Mixer window',
      { key: 'F8' },
      () => {
        windowManager.toggleWindowByType('mixer');
        setActiveView('mixer');
      }
    );

    keyboardShortcuts.registerShortcut(
      'toggle-browser',
      'Toggle Browser',
      'Show/hide Browser window',
      { key: 'F5' },
      () => {
        windowManager.toggleWindowByType('browser');
        setActiveView('browser');
      }
    );

    keyboardShortcuts.registerShortcut(
      'toggle-effects',
      'Toggle Effects',
      'Show/hide Effects window',
      { key: 'F10' },
      () => {
        windowManager.toggleWindowByType('effects');
        setActiveView('effects');
      }
    );

    keyboardShortcuts.registerShortcut(
      'toggle-synthesizer',
      'Toggle Synthesizer',
      'Show/hide Synthesizer window',
      { key: 'F11' },
      () => {
        windowManager.toggleWindowByType('synthesizer');
      }
    );

    // Pattern/Song mode toggle (L key)
    keyboardShortcuts.registerShortcut(
      'toggle-playback-mode',
      'Toggle Pattern/Song Mode',
      'Switch between Pattern and Song playback mode',
      { key: 'KeyL' },
      () => {
        playback.togglePlaybackMode();
      }
    );

    // Tool shortcuts (1-7)
    keyboardShortcuts.registerShortcut(
      'tool-draw',
      'Select Draw Tool',
      'Switch to draw tool',
      { key: 'Digit1' },
      () => {
        tools.setTool('draw');
      }
    );

    keyboardShortcuts.registerShortcut(
      'tool-paint',
      'Select Paint Tool',
      'Switch to paint tool',
      { key: 'Digit2' },
      () => {
        tools.setTool('paint');
      }
    );

    keyboardShortcuts.registerShortcut(
      'tool-select',
      'Select Select Tool',
      'Switch to select tool',
      { key: 'Digit3' },
      () => {
        tools.setTool('select');
      }
    );

    // Spacebar: Play/Pause (resets to start when pausing)
    keyboardShortcuts.registerShortcut(
      'play-pause',
      'Play/Pause',
      'Start or pause playback (resets to start when pausing)',
      { key: 'Space' },
      () => {
        playback.togglePlay();
      }
    );
  }, [keyboardShortcuts, windowManager, playback, tools]);

  return (
    <ErrorBoundary
      onError={() => {
        // Error logging can be added here
      }}
    >
      <div className="app">
      <header className="header">
        <div className="brand">FL STUDIO 21</div>
        <div className="file-menu">
          <button className="menu-btn" onClick={() => project.saveProject()}>
            Save
          </button>
          <button className="menu-btn" onClick={() => project.exportProject()}>
            Export Project
          </button>
          <button className="menu-btn" onClick={() => project.newProject()}>
            New Project
          </button>
        </div>
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
      </header>
      <Transport
        isPlaying={playback.isPlaying}
        isRecording={isRecording}
        playbackMode={playback.playbackMode}
        bpm={bpm}
        timeSignature={timeSignature}
        currentTime={playback.songPositionBeats * (60 / bpm)}
        totalTime={
          playlist.arrangements.find((a) => a.id === playlist.currentArrangementId)?.lengthBars
            ? playlist.arrangements.find((a) => a.id === playlist.currentArrangementId)!.lengthBars * BEATS_PER_BAR * (60 / bpm)
            : 0
        }
        loopEnabled={loopEnabled}
        loopStart={0}
        loopEnd={
          playlist.arrangements.find((a) => a.id === playlist.currentArrangementId)?.lengthBars
            ? playlist.arrangements.find((a) => a.id === playlist.currentArrangementId)!.lengthBars * BEATS_PER_BAR
            : 0
        }
        metronomeEnabled={metronomeEnabled}
        metronomeVolume={metronomeVolume}
        onPlay={playback.togglePlay}
        onStop={playback.stop}
        onRecord={() => setIsRecording(!isRecording)}
        onTogglePlaybackMode={playback.togglePlaybackMode}
        onBPMChange={(newBpm: number) => {
          const sanitized = playback.sanitizeBpm(newBpm);
          setBpm(sanitized);
          playback.syncExternalTempo(sanitized);
        }}
        onTimeSignatureChange={setTimeSignature}
        onLoopToggle={() => {
          setLoopEnabled(!loopEnabled);
          if (!loopEnabled) {
            loopService.enableLoop();
          } else {
            loopService.disableLoop();
          }
        }}
        onLoopSet={(start: number, end: number) => {
          try {
            loopService.setLoopRegion(start, end);
            setLoopEnabled(true);
          } catch (error) {
            // Handle error silently or show user notification
          }
        }}
        onMetronomeToggle={() => setMetronomeEnabled(!metronomeEnabled)}
        onMetronomeVolumeChange={setMetronomeVolume}
      />
      <Toolbar />
      <main className="main-content" style={{ display: 'flex', height: '100%' }}>
        {/* Pattern Selector */}
        <PatternSelector
          patterns={patterns.patterns}
          currentPattern={currentPattern}
          onPatternSelect={(patternId: number) => {
            setCurrentPattern(patternId);
            patterns.setCurrentPattern(patternId);
          }}
          onPatternRename={(patternId: number, name: string) => {
            patterns.updatePattern(patternId, { name });
          }}
          onPatternDuplicate={patterns.duplicatePattern}
          onPatternDelete={patterns.deletePattern}
          onPatternClear={patterns.clearPattern}
          onCreatePattern={() => {
            const newPattern = patterns.createPattern();
            setCurrentPattern(newPattern.id);
          }}
        />
        <div
          ref={channelRackInteractions.containerRef}
          className="panel channel-rack-panel"
          id="channel-rack-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--fl-bg-dark)',
            overflow: 'auto',
          }}
        >
          <div className="channel-rack" style={{ display: 'flex', flexDirection: 'column' }}>
            {tracks.tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                currentStep={playback.currentStep}
                isPlaying={playback.isPlaying}
                onToggleStep={(stepIndex) => tracks.toggleStep(track.id, stepIndex)}
                onToggleMute={() => tracks.toggleMute(track.id)}
                onToggleSolo={() => tracks.toggleSolo(track.id)}
                onRename={(name) => tracks.updateTrackName(track.id, name)}
                onDelete={() => tracks.deleteTrack(track.id)}
                onDuplicate={() => tracks.duplicateTrack(track.id)}
                onOpenPianoRoll={() => {
                  setSelectedTrackId(track.id);
                  windowManager.toggleWindowByType('piano-roll');
                }}
                onOpenChannelSettings={() => {
                  setChannelSettingsTrack(track.id);
                  const existingWindows = windowManager.service.getWindowsByType('channel-settings');
                  const firstWindow = existingWindows[0];
                  if (firstWindow !== undefined) {
                    windowManager.showWindow(firstWindow.id);
                  } else {
                    windowManager.createWindow('channel-settings', { width: 600, height: 500 });
                  }
                }}
                getTrackColor={tracks.getTrackColor}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Floating windows */}
      {windowManager.windows.map((window) => {
        // Render appropriate window content based on type
        let windowContent: React.ReactNode = null;

        switch (window.type) {
          case 'browser':
            windowContent = (
              <BrowserWindow
                soundLibrary={browserServiceRef.current?.getSoundLibrary()}
                onLoadSound={() => {
                  // Handle sound loading
                }}
                samplePackBank={drumKits.samplePackBank}
                audioContext={audioEngine.audioContext}
              />
            );
            break;
          case 'mixer':
            windowContent = (
              <MixerWindow
                tracks={tracks.tracks}
                masterVolume={masterVolume}
                masterPan={masterPan}
                onTrackVolumeChange={(trackId: number, volume: number) => {
                  const trackMixer = mixer.getTrackMixer(trackId);
                  if (trackMixer && typeof trackMixer === 'object' && 'setVolume' in trackMixer) {
                    (trackMixer as { setVolume: (vol: number) => void }).setVolume(volume);
                  }
                }}
                onTrackPanChange={(trackId: number, pan: number) => {
                  const trackMixer = mixer.getTrackMixer(trackId);
                  if (trackMixer && typeof trackMixer === 'object' && 'setPan' in trackMixer) {
                    (trackMixer as { setPan: (pan: number) => void }).setPan(pan);
                  }
                }}
                onTrackMute={(trackId: number) => tracks.toggleMute(trackId)}
                onTrackSolo={(trackId: number) => tracks.toggleSolo(trackId)}
                onMasterVolumeChange={(volume: number) => {
                  setMasterVolume(volume);
                  // Update master mixer volume if available
                  const masterMixer = mixer.getTrackMixer(0);
                  if (masterMixer && typeof masterMixer === 'object' && 'setVolume' in masterMixer) {
                    (masterMixer as { setVolume: (vol: number) => void }).setVolume(volume / 100);
                  }
                }}
                onMasterPanChange={(pan: number) => {
                  setMasterPan(pan);
                  // Update master mixer pan if available
                  const masterMixer = mixer.getTrackMixer(0);
                  if (masterMixer && typeof masterMixer === 'object' && 'setPan' in masterMixer) {
                    (masterMixer as { setPan: (panVal: number) => void }).setPan(pan);
                  }
                }}
                onTrackRename={(trackId: number, name: string) => {
                  tracks.updateTrackName(trackId, name);
                }}
                getTrackMixer={mixer.getTrackMixer}
              />
            );
            break;
          case 'playlist':
            windowContent = (
              <PlaylistWindow
                arrangement={playlist.arrangements.find((a) => a.id === playlist.currentArrangementId) || null}
                beatsPerBar={BEATS_PER_BAR}
                stepsPerBeat={STEPS_PER_BEAT}
                basePixelsPerBeat={BASE_PIXELS_PER_BEAT}
                zoomLevel={playlist.zoomLevel}
                snapSetting={playlist.snapSetting}
                songPositionBeats={playback.currentStep * BEATS_PER_STEP}
                isPlaying={playback.isPlaying}
                timelineUtils={
                  typeof window !== 'undefined' && (window as { timelineUtils?: unknown }).timelineUtils
                    ? (window as unknown as { timelineUtils: unknown }).timelineUtils as (typeof window extends { timelineUtils: infer T } ? T : null)
                    : null
                }
                onAddClip={playlist.addClipToTrack}
                onRemoveClip={playlist.removeClip}
                onUpdateClip={playlist.updateClipTiming}
                onDuplicateClip={playlist.duplicateClip}
                onSetSnap={playlist.setSnapSetting}
                onAdjustZoom={playlist.adjustZoom}
                onTrackMute={(trackId) => {
                  // Handle playlist track mute
                  const arrangement = playlist.arrangements.find((a) => a.id === playlist.currentArrangementId);
                  if (arrangement) {
                    const track = arrangement.tracks.find((t) => t.id === trackId);
                    if (track) {
                      // Toggle mute state for playlist track
                      // This would typically update the arrangement's track state
                      // For now, we'll use the channel rack mute as a proxy
                      const channelTrack = tracks.tracks.find((t) => t.id === parseInt(trackId, 10));
                      if (channelTrack) {
                        tracks.toggleMute(channelTrack.id);
                      }
                    }
                  }
                }}
                onTrackSolo={(trackId) => {
                  // Handle playlist track solo
                  const arrangement = playlist.arrangements.find((a) => a.id === playlist.currentArrangementId);
                  if (arrangement) {
                    const track = arrangement.tracks.find((t) => t.id === trackId);
                    if (track) {
                      // Toggle solo state for playlist track
                      // This would typically update the arrangement's track state
                      // For now, we'll use the channel rack solo as a proxy
                      const channelTrack = tracks.tracks.find((t) => t.id === parseInt(trackId, 10));
                      if (channelTrack) {
                        tracks.toggleSolo(channelTrack.id);
                      }
                    }
                  }
                }}
              />
            );
            break;
          case 'piano-roll':
            windowContent = (
              <PianoRollWindow
                track={selectedTrackId !== null ? tracks.tracks.find((t) => t.id === selectedTrackId) || null : null}
                audioContext={audioEngine.audioContext}
                beatsPerBar={BEATS_PER_BAR}
                stepsPerBeat={STEPS_PER_BEAT}
                bpm={bpm}
                currentBeat={playback.songPositionBeats}
                isPlaying={playback.isPlaying}
                onNotesChange={() => {
                  // Handle notes change
                }}
              />
            );
            break;
          case 'channel-settings':
            windowContent = channelSettingsTrack !== null ? (
              <ChannelSettingsWindow
                track={tracks.tracks.find((t) => t.id === channelSettingsTrack) || null}
                onUpdate={(updates: Partial<typeof tracks.tracks[0]>) => {
                  // Update track with new settings
                  const track = tracks.tracks.find((t) => t.id === channelSettingsTrack);
                  if (track) {
                    if (updates.name) {
                      tracks.updateTrackName(channelSettingsTrack, updates.name);
                    }
                    // Update track params if provided
                    if (updates.params) {
                      // Update track parameters in audio engine
                      const trackMixer = mixer.getTrackMixer(channelSettingsTrack);
                      if (trackMixer && typeof trackMixer === 'object') {
                        // Update volume if provided
                        if (updates.params.volume !== undefined && 'setVolume' in trackMixer) {
                          (trackMixer as { setVolume: (vol: number) => void }).setVolume(updates.params.volume / 100);
                        }
                        // Update pan if provided
                        if (updates.params.pan !== undefined && 'setPan' in trackMixer) {
                          (trackMixer as { setPan: (pan: number) => void }).setPan(updates.params.pan);
                        }
                      }
                    }
                  }
                }}
                onClose={() => setChannelSettingsTrack(null)}
                audioContext={audioEngine.audioContext}
                samplePackBank={drumKits.samplePackBank}
              />
            ) : null;
            break;
          case 'effects':
            windowContent = (
              <EffectsWindow
                masterEffects={[]}
                onAddEffect={() => {
                  // Handle add effect
                }}
                onRemoveEffect={() => {
                  // Handle remove effect
                }}
                onToggleEffect={() => {
                  // Handle toggle effect
                }}
                onUpdateParameter={() => {
                  // Handle parameter update
                }}
              />
            );
            break;
          case 'synthesizer':
            windowContent = <SynthesizerWindow />;
            break;
          default:
            windowContent = <div style={{ padding: '8px' }}>{window.type} Window Content</div>;
        }

        return (
          <Window
            key={window.id}
            window={window}
            onUpdate={windowManager.updateWindow}
            onClose={windowManager.closeWindow}
            onMinimize={windowManager.minimizeWindow}
            onMaximize={windowManager.maximizeWindow}
            onBringToFront={windowManager.bringToFront}
            title={window.type}
          >
            {windowContent}
          </Window>
        );
      })}

      {/* Status bar */}
      <StatusBar
        audioEngineStatus={audioEngine.audioContext?.state === 'running' ? 'running' : 'suspended'}
        cpuUsage={cpuUsage}
        memoryUsage={memoryUsage}
        projectStatus="saved"
      />

      {/* Hint panel */}
      <HintPanel
        data={hintPanel.hintData}
        x={hintPanel.hintPosition.x}
        y={hintPanel.hintPosition.y}
      />
      </div>
    </ErrorBoundary>
  );
}

