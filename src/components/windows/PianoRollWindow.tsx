/**
 * PianoRollWindow - Full piano roll editor with note editing, velocity, and quantization
 * Implements FL Studio-style piano roll with piano keys, note grid, and editing tools
 * @module components/windows/PianoRollWindow
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useContextMenu } from '../../hooks/useContextMenu';
import { useHintPanel } from '../ui/HintPanel';
import { contextMenuService } from '../../services/ContextMenuService';
import { PianoRollEditor } from '../../pianoRoll/PianoRollEditor';
import { clipboardService } from '../../services/ClipboardService';
import { Quantizer } from '../../pianoRoll/Quantizer';
import type { Track } from '../../types/FLStudio.types';
import type { ClipboardNote } from '../../services/ClipboardService';

/**
 * PianoRollWindow component props
 */
export interface PianoRollWindowProps {
  track: Track | null;
  audioContext: AudioContext | null;
  beatsPerBar: number;
  stepsPerBeat: number;
  bpm: number;
  currentBeat: number;
  isPlaying: boolean;
  onNotesChange?: (notes: unknown[]) => void;
}

/**
 * Piano roll window component
 */
export function PianoRollWindow({
  track,
  audioContext,
  beatsPerBar,
  stepsPerBeat,
  bpm: _bpm,
  currentBeat,
  isPlaying: _isPlaying,
  onNotesChange,
}: PianoRollWindowProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pianoKeysRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<PianoRollEditor | null>(null);
  const contextMenu = useContextMenu();
  useHintPanel(); // Initialize hint panel

  const [selectedTool, setSelectedTool] = useState<'draw' | 'select' | 'erase'>('draw');
  const [quantizeEnabled, setQuantizeEnabled] = useState<boolean>(true);
  const [quantizeGrid, setQuantizeGrid] = useState<number>(0.25);
  const [scaleHighlight, setScaleHighlight] = useState<{ key: string; scale: string } | null>(null);
  const [showVelocityEditor, setShowVelocityEditor] = useState<boolean>(false);
  const quantizerRef = useRef<Quantizer | null>(null);

  /**
   * Initialize piano roll editor and quantizer
   */
  useEffect(() => {
    if (!canvasRef.current || !audioContext) {
      return;
    }

    try {
      editorRef.current = new PianoRollEditor(canvasRef.current, audioContext);
      quantizerRef.current = new Quantizer();
      quantizerRef.current.setGridSize(quantizeGrid);
    } catch {
      // Error initializing editor
    }

    return () => {
      // Cleanup if needed
    };
  }, [audioContext, quantizeGrid]);

  /**
   * Update editor tool
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.tool = selectedTool;
    }
  }, [selectedTool]);

  /**
   * Update quantization
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.quantizeEnabled = quantizeEnabled;
      editorRef.current.quantizeGrid = quantizeGrid;
    }
  }, [quantizeEnabled, quantizeGrid]);

  /**
   * Update scale highlight
   */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.scaleHighlight = scaleHighlight;
    }
  }, [scaleHighlight]);

  /**
   * Handle quantize
   */
  const handleQuantize = useCallback((): void => {
    if (!editorRef.current || !quantizerRef.current) {
      return;
    }

    const selectedNotes = editorRef.current.getSelectedNotes();
    if (selectedNotes.length === 0) {
      return;
    }

    quantizerRef.current.setGridSize(quantizeGrid);
    const quantizedNotes = quantizerRef.current.quantizeNotes(
      selectedNotes.map((note) => ({
        start: note.start,
        duration: note.duration,
        pitch: note.pitch,
        velocity: note.velocity,
      }))
    );

    // Update notes with quantized positions
    selectedNotes.forEach((note, index) => {
      if (quantizedNotes[index]) {
        note.start = quantizedNotes[index].start;
      }
    });

    editorRef.current.quantizeSelected();
    if (onNotesChange) {
      onNotesChange(editorRef.current.getNotes());
    }
  }, [quantizeGrid, onNotesChange]);

  /**
   * Handle copy
   */
  const handleCopy = useCallback((): void => {
    if (!editorRef.current) {
      return;
    }

    const selectedNotes = editorRef.current.getSelectedNotes();
    if (selectedNotes.length === 0) {
      return;
    }

    const notesToCopy: ClipboardNote[] = selectedNotes.map((note) => ({
      start: note.start,
      duration: note.duration,
      pitch: note.pitch,
      velocity: note.velocity,
    }));

    clipboardService.copyNotes(notesToCopy, {
      trackId: track?.id,
      beatsPerBar,
      stepsPerBeat,
    });
  }, [track, beatsPerBar, stepsPerBeat]);

  /**
   * Handle paste
   */
  const handlePaste = useCallback((): void => {
    if (!editorRef.current) {
      return;
    }

    const pastedNotes = clipboardService.pasteNotes(currentBeat);
    if (!pastedNotes || pastedNotes.length === 0) {
      return;
    }

    const notesToAdd = pastedNotes.map((note) => ({
      start: note.start,
      duration: note.duration,
      pitch: note.pitch,
      velocity: note.velocity,
      selected: false,
    }));

    editorRef.current.addNotes(notesToAdd);
    if (onNotesChange) {
      onNotesChange(editorRef.current.getNotes());
    }
  }, [currentBeat, onNotesChange]);

  /**
   * Handle cut
   */
  const handleCut = useCallback((): void => {
    if (!editorRef.current) {
      return;
    }

    const selectedNotes = editorRef.current.getSelectedNotes();
    if (selectedNotes.length === 0) {
      return;
    }

    const notesToCut: ClipboardNote[] = selectedNotes.map((note) => ({
      start: note.start,
      duration: note.duration,
      pitch: note.pitch,
      velocity: note.velocity,
    }));

    clipboardService.cutNotes(notesToCut, {
      trackId: track?.id,
      beatsPerBar,
      stepsPerBeat,
    });

    editorRef.current.removeNotes(selectedNotes);
    if (onNotesChange) {
      onNotesChange(editorRef.current.getNotes());
    }
  }, [track, beatsPerBar, stepsPerBeat, onNotesChange]);

  /**
   * Handle delete
   */
  const handleDelete = useCallback((): void => {
    if (!editorRef.current) {
      return;
    }

    const selectedNotes = editorRef.current.getSelectedNotes();
    if (selectedNotes.length === 0) {
      return;
    }

    editorRef.current.removeNotes(selectedNotes);
    if (onNotesChange) {
      onNotesChange(editorRef.current.getNotes());
    }
  }, [onNotesChange]);

  /**
   * Handle select all
   */
  const handleSelectAll = useCallback((): void => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.selectAll();
  }, []);

  /**
   * Handle velocity editing
   */
  const handleVelocity = useCallback((): void => {
    setShowVelocityEditor(true);
  }, []);

  /**
   * Setup context menu
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const menuItems = contextMenuService.getPianoRollMenu({
      onQuantize: handleQuantize,
      onCopy: handleCopy,
      onPaste: handlePaste,
      onCut: handleCut,
      onDelete: handleDelete,
      onSelectAll: handleSelectAll,
      onVelocity: handleVelocity,
    });

    contextMenu.attach(canvas, menuItems);

    return () => {
      contextMenu.detach(canvas);
    };
  }, [contextMenu, handleQuantize, handleCopy, handlePaste, handleCut, handleDelete, handleSelectAll, handleVelocity]);

  /**
   * Generate piano keys
   */
  const generatePianoKeys = useCallback((): Array<{ note: number; name: string; isBlack: boolean }> => {
    const keys: Array<{ note: number; name: string; isBlack: boolean }> = [];
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Generate 5 octaves (C2 to C7)
    for (let octave = 2; octave < 7; octave++) {
      for (let note = 0; note < 12; note++) {
        const noteNumber = octave * 12 + note;
        const noteName = noteNames[note];
        if (!noteName) {
          continue;
        }
        const isBlack = ['C#', 'D#', 'F#', 'G#', 'A#'].includes(noteName);

        keys.push({
          note: noteNumber,
          name: `${noteName}${octave}`,
          isBlack,
        });
      }
    }

    return keys.reverse(); // Reverse to show highest notes at top
  }, []);

  const pianoKeys = generatePianoKeys();

  if (!track) {
    return (
      <div style={{ padding: '16px', color: 'var(--fl-text-secondary)' }}>
        No track selected. Open piano roll from a track in the Channel Rack.
      </div>
    );
  }

  return (
    <div
      className="piano-roll-window"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 8px',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        {/* Tools */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['draw', 'select', 'erase'] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => setSelectedTool(tool)}
              style={{
                padding: '4px 8px',
                background: selectedTool === tool ? 'var(--fl-orange)' : 'var(--fl-bg-dark)',
                border: `1px solid ${selectedTool === tool ? 'var(--fl-orange-dark)' : 'var(--fl-border)'}`,
                color: selectedTool === tool ? '#000' : 'var(--fl-text-primary)',
                fontSize: '10px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tool}
            </button>
          ))}
        </div>

        {/* Quantization */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
          <label style={{ fontSize: '10px', color: 'var(--fl-text-secondary)' }}>
            <input
              type="checkbox"
              checked={quantizeEnabled}
              onChange={(e) => setQuantizeEnabled(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            Quantize
          </label>
          <select
            value={quantizeGrid}
            onChange={(e) => setQuantizeGrid(parseFloat(e.target.value))}
            disabled={!quantizeEnabled}
            style={{
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              padding: '2px 4px',
            }}
          >
            <option value={1}>Whole Note</option>
            <option value={0.5}>Half Note</option>
            <option value={0.25}>Quarter Note</option>
            <option value={0.125}>Eighth Note</option>
            <option value={0.0625}>Sixteenth Note</option>
          </select>
        </div>

        {/* Scale Highlight */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '16px' }}>
          <label style={{ fontSize: '10px', color: 'var(--fl-text-secondary)' }}>
            Scale:
          </label>
          <select
            value={scaleHighlight ? `${scaleHighlight.key} ${scaleHighlight.scale}` : 'none'}
            onChange={(e) => {
              if (e.target.value === 'none') {
                setScaleHighlight(null);
              } else {
                const parts = e.target.value.split(' ');
                const key = parts[0];
                const scale = parts[1];
                if (key && scale) {
                  setScaleHighlight({ key, scale });
                }
              }
            }}
            style={{
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              padding: '2px 4px',
            }}
          >
            <option value="none">None</option>
            <option value="C major">C Major</option>
            <option value="C minor">C Minor</option>
            <option value="A major">A Major</option>
            <option value="A minor">A Minor</option>
            <option value="G major">G Major</option>
            <option value="G minor">G Minor</option>
          </select>
        </div>
      </div>

      {/* Piano Roll Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Piano Keys */}
        <div
          ref={pianoKeysRef}
          style={{
            width: '60px',
            borderRight: '1px solid var(--fl-border-dark)',
            background: 'var(--fl-bg-darker)',
            overflow: 'auto',
          }}
        >
          {pianoKeys.map((key) => (
            <div
              key={key.note}
              style={{
                height: '20px',
                background: key.isBlack ? '#1a1a1a' : '#2a2a2a',
                borderBottom: '1px solid var(--fl-border-dark)',
                borderLeft: key.isBlack ? '1px solid var(--fl-border-dark)' : 'none',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: key.isBlack ? '4px' : '8px',
                fontSize: '8px',
                color: key.isBlack ? 'var(--fl-text-secondary)' : 'var(--fl-text-primary)',
                position: key.isBlack ? 'absolute' : 'relative',
                width: key.isBlack ? '40px' : '100%',
                marginLeft: key.isBlack ? '20px' : '0',
                zIndex: key.isBlack ? 2 : 1,
              }}
              title={key.name}
            >
              {!key.isBlack && key.name}
            </div>
          ))}
        </div>

        {/* Note Grid */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'auto',
            background: 'var(--fl-bg-dark)',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
            }}
            width={800}
            height={600}
          />
        </div>
      </div>

      {/* Velocity Editor (Bottom) */}
      {showVelocityEditor && (
        <div
          style={{
            height: '120px',
            borderTop: '1px solid var(--fl-border-dark)',
            background: 'var(--fl-bg-darker)',
            padding: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
              }}
            >
              VELOCITY EDITOR
            </div>
            <button
              onClick={() => setShowVelocityEditor(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--fl-border)',
                color: 'var(--fl-text-primary)',
                fontSize: '10px',
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
          <div
            style={{
              height: '80px',
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border-dark)',
              borderRadius: '2px',
              position: 'relative',
              padding: '4px',
            }}
          >
            {editorRef.current?.getSelectedNotes().map((note, index) => (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${(index * 100) / Math.max(1, editorRef.current?.getSelectedNotes().length || 1)}%`,
                  bottom: `${note.velocity * 100}%`,
                  width: `${80 / Math.max(1, editorRef.current?.getSelectedNotes().length || 1)}%`,
                  height: `${note.velocity * 100}%`,
                  background: 'var(--fl-orange)',
                  border: '1px solid var(--fl-orange-dark)',
                  cursor: 'ns-resize',
                }}
                title={`Velocity: ${Math.round(note.velocity * 100)}%`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const startY = e.clientY;
                  const startVelocity = note.velocity;
                  const handleMouseMove = (moveEvent: MouseEvent): void => {
                    const deltaY = startY - moveEvent.clientY;
                    const newVelocity = Math.max(
                      0,
                      Math.min(1, startVelocity + deltaY / 100)
                    );
                    if (editorRef.current) {
                      editorRef.current.updateNoteVelocity(note, newVelocity);
                      if (onNotesChange) {
                        onNotesChange(editorRef.current.getNotes());
                      }
                    }
                  };
                  const handleMouseUp = (): void => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                  };
                  window.addEventListener('mousemove', handleMouseMove);
                  window.addEventListener('mouseup', handleMouseUp);
                }}
              />
            ))}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '1px',
                background: 'var(--fl-border)',
              }}
            />
          </div>
        </div>
      )}
      {!showVelocityEditor && (
        <div
          style={{
            height: '40px',
            borderTop: '1px solid var(--fl-border-dark)',
            background: 'var(--fl-bg-darker)',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setShowVelocityEditor(true)}
            style={{
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              padding: '4px 12px',
              cursor: 'pointer',
            }}
          >
            Show Velocity Editor
          </button>
        </div>
      )}
    </div>
  );
}

