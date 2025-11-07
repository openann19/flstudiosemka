/**
 * Transport - Enhanced transport controls with record, loop, metronome, and time signature
 * Implements FL Studio-style transport with advanced playback controls
 * @module components/Transport
 */

import { useState, useCallback } from 'react';
import { Button } from './ui/Button';
import { useHintPanel } from './ui/HintPanel';

/**
 * Transport component props
 */
export interface TransportProps {
  isPlaying: boolean;
  isRecording: boolean;
  playbackMode: 'pattern' | 'song';
  bpm: number;
  timeSignature: { numerator: number; denominator: number };
  currentTime: number;
  totalTime: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  metronomeEnabled: boolean;
  metronomeVolume: number;
  onPlay: () => void;
  onStop: () => void;
  onRecord: () => void;
  onTogglePlaybackMode: () => void;
  onBPMChange: (bpm: number) => void;
  onTimeSignatureChange: (signature: { numerator: number; denominator: number }) => void;
  onLoopToggle: () => void;
  onLoopSet: (start: number, end: number) => void;
  onMetronomeToggle: () => void;
  onMetronomeVolumeChange: (volume: number) => void;
  onTapTempo?: () => void;
}

/**
 * Transport component
 */
export function Transport({
  isPlaying,
  isRecording,
  playbackMode,
  bpm,
  timeSignature,
  currentTime,
  totalTime,
  loopEnabled,
  loopStart: _loopStart,
  loopEnd: _loopEnd,
  metronomeEnabled,
  metronomeVolume,
  onPlay,
  onStop,
  onRecord,
  onTogglePlaybackMode,
  onBPMChange,
  onTimeSignatureChange,
  onLoopToggle,
  onLoopSet: _onLoopSet,
  onMetronomeToggle,
  onMetronomeVolumeChange,
  onTapTempo,
}: TransportProps): JSX.Element {
  const hintPanel = useHintPanel();
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  /**
   * Format time
   */
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }, []);

  /**
   * Handle tap tempo
   */
  const handleTapTempo = useCallback((): void => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4); // Keep last 4 taps
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < newTapTimes.length; i += 1) {
        const current = newTapTimes[i];
        const previous = newTapTimes[i - 1];
        if (current !== undefined && previous !== undefined) {
          intervals.push(current - previous);
        }
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBPM = Math.round(60000 / avgInterval);
      const clampedBPM = Math.max(60, Math.min(200, calculatedBPM));
      onBPMChange(clampedBPM);
    }

    if (onTapTempo) {
      onTapTempo();
    }
  }, [tapTimes, onBPMChange, onTapTempo]);

  return (
    <div
      className="transport fl-panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px',
        background: 'var(--fl-bg-darker)',
        borderBottom: '1px solid var(--fl-border-dark)',
      }}
    >
      {/* Transport Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <Button
          variant="default"
          size="small"
          onClick={onStop}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Stop',
                description: 'Stop playback and return to start',
                shortcut: 'Space',
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
          title="Stop"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </Button>

        <Button
          variant={isPlaying ? 'primary' : 'default'}
          size="small"
          active={isPlaying}
          onClick={onPlay}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Play/Pause',
                description: 'Start or pause playback',
                shortcut: 'Space',
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
          title="Play"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,6 18,12 8,18" />
          </svg>
        </Button>

        <Button
          variant={isRecording ? 'primary' : 'default'}
          size="small"
          active={isRecording}
          onClick={onRecord}
          onMouseEnter={(e) =>
            hintPanel.showHint(
              {
                name: 'Record',
                description: 'Record audio/MIDI input',
                shortcut: 'R',
              },
              e.clientX + 10,
              e.clientY + 10
            )
          }
          onMouseLeave={() => hintPanel.hideHint()}
          title="Record"
          style={{
            background: isRecording ? '#FF0000' : undefined,
            color: isRecording ? '#FFF' : undefined,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="6" />
          </svg>
        </Button>
      </div>

      {/* BPM Control */}
      <div
        className="bpm-control"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '16px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
            fontWeight: 600,
          }}
        >
          TEMPO
        </span>
        <button
          className="spinner-btn"
          onClick={() => onBPMChange(Math.max(60, bpm - 1))}
          style={{
            width: '20px',
            height: '20px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          −
        </button>
        <input
          type="number"
          value={bpm}
          min="60"
          max="200"
          onChange={(e) => {
            const newBpm = parseInt(e.target.value, 10);
            if (!Number.isNaN(newBpm)) {
              onBPMChange(Math.max(60, Math.min(200, newBpm)));
            }
          }}
          style={{
            width: '50px',
            padding: '2px 4px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '11px',
            textAlign: 'center',
          }}
        />
        <button
          className="spinner-btn"
          onClick={() => onBPMChange(Math.min(200, bpm + 1))}
          style={{
            width: '20px',
            height: '20px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          +
        </button>
        {onTapTempo && (
          <button
            onClick={handleTapTempo}
            style={{
              padding: '2px 8px',
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
            title="Tap Tempo"
          >
            TAP
          </button>
        )}
      </div>

      {/* Time Signature */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '16px',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
          }}
        >
          TIME:
        </span>
        <input
          type="number"
          value={timeSignature.numerator}
          min="1"
          max="16"
          aria-label="Time signature numerator"
          onChange={(e) => {
            const num = parseInt(e.target.value, 10);
            if (!Number.isNaN(num)) {
              onTimeSignatureChange({ ...timeSignature, numerator: num });
            }
          }}
          style={{
            width: '30px',
            padding: '2px 4px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            textAlign: 'center',
          }}
        />
        <span
          style={{
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
          }}
        >
          /
        </span>
        <input
          type="number"
          value={timeSignature.denominator}
          min="2"
          max="32"
          step="2"
          aria-label="Time signature denominator"
          onChange={(e) => {
            const den = parseInt(e.target.value, 10);
            if (!Number.isNaN(den) && [2, 4, 8, 16, 32].includes(den)) {
              onTimeSignatureChange({ ...timeSignature, denominator: den });
            }
          }}
          style={{
            width: '30px',
            padding: '2px 4px',
            background: 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: 'var(--fl-text-primary)',
            fontSize: '10px',
            textAlign: 'center',
          }}
        />
      </div>

      {/* Playback Mode */}
      <Button
        variant={playbackMode === 'song' ? 'primary' : 'default'}
        size="small"
        active={playbackMode === 'song'}
        onClick={onTogglePlaybackMode}
        onMouseEnter={(e) =>
          hintPanel.showHint(
            {
              name: 'Playback Mode',
              description: 'Switch between Pattern and Song mode',
              value: playbackMode === 'pattern' ? 'Pattern' : 'Song',
              shortcut: 'L',
            },
            e.clientX + 10,
            e.clientY + 10
          )
        }
        onMouseLeave={() => hintPanel.hideHint()}
        title={`Mode: ${playbackMode === 'pattern' ? 'Pattern' : 'Song'}`}
        style={{ marginLeft: '8px' }}
      >
        {playbackMode === 'pattern' ? 'PAT' : 'SONG'}
      </Button>

      {/* Time Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '16px',
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
        }}
      >
        <span>{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(totalTime)}</span>
      </div>

      {/* Loop Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '16px',
        }}
      >
        <button
          onClick={onLoopToggle}
          style={{
            padding: '2px 8px',
            background: loopEnabled ? 'var(--fl-orange)' : 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: loopEnabled ? '#000' : 'var(--fl-text-primary)',
            fontSize: '10px',
            cursor: 'pointer',
          }}
          title="Loop"
        >
          LOOP
        </button>
      </div>

      {/* Metronome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '16px',
        }}
      >
        <button
          onClick={onMetronomeToggle}
          aria-label="Metronome"
          style={{
            padding: '2px 8px',
            background: metronomeEnabled ? 'var(--fl-orange)' : 'var(--fl-bg-dark)',
            border: '1px solid var(--fl-border)',
            color: metronomeEnabled ? '#000' : 'var(--fl-text-primary)',
            fontSize: '10px',
            cursor: 'pointer',
          }}
          title="Metronome"
        >
          MET
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={metronomeVolume * 100}
          onChange={(e) => onMetronomeVolumeChange(parseInt(e.target.value, 10) / 100)}
          disabled={!metronomeEnabled}
          style={{
            width: '60px',
          }}
        />
      </div>
    </div>
  );
}

