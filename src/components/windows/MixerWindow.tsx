/**
 * MixerWindow - Full mixer window with channel strips, faders, effects, and routing
 * Implements FL Studio-style mixer with sends, inserts, EQ visualization, and metering
 * @module components/windows/MixerWindow
 */

import { useRef, useEffect, useState, useCallback, memo } from 'react';
import { Fader } from '../ui/Fader';
import { Knob } from '../ui/Knob';
import { useContextMenu } from '../../hooks/useContextMenu';
import { contextMenuService } from '../../services/ContextMenuService';
import { automationService } from '../../services/AutomationService';
import { EffectSlotList } from '../effects/EffectSlotList';
import { EffectLibrary } from '../effects/EffectLibrary';
import { useEffectSlots } from '../../hooks/useEffectSlots';
import type { Track } from '../../types/FLStudio.types';
import type { EffectType } from '../../types/synthesizer.types';
import type { EffectDragData } from '../../types/effectSlot.types';

/**
 * MixerWindow component props
 */
export interface MixerWindowProps {
  tracks: Track[];
  masterVolume: number;
  masterPan: number;
  onTrackVolumeChange: (trackId: number, volume: number) => void;
  onTrackPanChange: (trackId: number, pan: number) => void;
  onTrackMute: (trackId: number) => void;
  onTrackSolo: (trackId: number) => void;
  onMasterVolumeChange: (volume: number) => void;
  onMasterPanChange: (pan: number) => void;
  onTrackRename?: (trackId: number, name: string) => void;
  getTrackMixer: (trackId: number) => unknown | null;
}


// Old unused MixerChannelStrip component removed - using inline rendering instead

/**
 * Mixer track effect slots component props
 */
interface MixerTrackEffectSlotsProps {
  trackId: number;
  trackMixer: unknown | null;
  audioContext: AudioContext | null;
  selectedSlotIndex: number | null;
  onSelectSlot: (slotIndex: number) => void;
  onAddEffect: (position: number, effectType: EffectType) => void;
}

/**
 * Mixer track effect slots component
 */
function MixerTrackEffectSlots({
  trackId,
  trackMixer,
  audioContext,
  selectedSlotIndex,
  onSelectSlot,
  onAddEffect,
}: MixerTrackEffectSlotsProps): JSX.Element {
  const effectSlots = useEffectSlots(trackId, audioContext);

  // Sync effects with TrackMixer's EffectChain
  useEffect(() => {
    if (!trackMixer || typeof trackMixer !== 'object' || !('getEffectChain' in trackMixer)) {
      return;
    }

    const mixer = trackMixer as {
      getEffectChain: () => {
        addEffect: (effect: unknown, position?: number) => boolean;
        clear: () => void;
      };
    };
    const effectChain = mixer.getEffectChain();

    // Clear and rebuild chain from slots
    effectChain.clear();

    // Add all enabled effects from slots
    effectSlots.slots.forEach((slot, index) => {
      if (slot.effectInstance && slot.enabled) {
        try {
          effectChain.addEffect(slot.effectInstance, index);
        } catch (error) {
          // Ignore errors (effect might be invalid)
        }
      }
    });
  }, [effectSlots.slots, trackMixer]);

  const handleAddEffect = useCallback(
    async (position: number, effectType: EffectType): Promise<void> => {
      await effectSlots.addEffect(position, effectType);
      onAddEffect(position, effectType);
    },
    [effectSlots, onAddEffect]
  );

  const handleDropEffect = useCallback(
    (data: EffectDragData, position: number): void => {
      if (data.type === 'effect-library' && audioContext) {
        handleAddEffect(position, data.effectType);
      } else if (data.type === 'effect-slot' && data.sourceTrackId !== undefined && data.sourceSlotIndex !== undefined) {
        // Copy effect from another slot
        if (data.sourceTrackId === trackId) {
          // Reorder within same track
          effectSlots.reorderEffect(data.sourceSlotIndex, position);
        } else {
          // Copy from different track - would need to get effect instance
          // For now, just add new effect of same type
          if (audioContext) {
            handleAddEffect(position, data.effectType);
          }
        }
      }
    },
    [audioContext, trackId, effectSlots, handleAddEffect]
  );

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
        gap: 'var(--spacing-minimal)',
              width: '100%',
            }}
          >
      <EffectSlotList
        trackId={trackId}
        slots={effectSlots.slots}
        selectedSlotIndex={selectedSlotIndex}
        onAddEffect={handleAddEffect}
        onRemoveEffect={effectSlots.removeEffect}
        onToggleEnabled={effectSlots.setEffectEnabled}
        onSelectSlot={onSelectSlot}
        onReorderEffect={effectSlots.reorderEffect}
        onDropEffect={handleDropEffect}
      />
      </div>
    );
  }

/**
 * Mixer window component (optimized with memoization)
 */
export const MixerWindow = memo<MixerWindowProps>(function MixerWindow({
  tracks,
  masterVolume,
  masterPan,
  onTrackVolumeChange,
  onTrackPanChange,
  onTrackMute,
  onTrackSolo,
  onMasterVolumeChange,
  onMasterPanChange,
  onTrackRename,
  getTrackMixer,
}: MixerWindowProps): JSX.Element {
  const mixerRef = useRef<HTMLDivElement>(null);
  const contextMenu = useContextMenu();
  const audioContextRef = useRef<AudioContext | null>(null);

  const [meteringData, setMeteringData] = useState<Map<number, { peak: number; rms: number }>>(new Map());
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [showEffectLibrary, setShowEffectLibrary] = useState<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastMeterUpdateRef = useRef<number>(0);
  const METERING_THROTTLE_MS = 33; // ~30fps (33ms per frame)

  // Get audio context from first track mixer
  useEffect(() => {
    const firstTrack = tracks[0];
    if (firstTrack !== undefined) {
      const mixer = getTrackMixer(firstTrack.id);
      if (mixer && typeof mixer === 'object' && 'audioContext' in mixer) {
        audioContextRef.current = (mixer as { audioContext: AudioContext }).audioContext;
      }
    }
  }, [tracks, getTrackMixer]);

  /**
   * Update metering data (throttled to ~30fps to reduce CPU load)
   */
  const updateMetering = useCallback(() => {
    const now = performance.now();
    const timeSinceLastUpdate = now - lastMeterUpdateRef.current;

    // Throttle to ~30fps (33ms minimum between updates)
    if (timeSinceLastUpdate >= METERING_THROTTLE_MS) {
      const newMetering = new Map<number, { peak: number; rms: number }>();

      tracks.forEach((track) => {
        const mixer = getTrackMixer(track.id);
        if (mixer && typeof mixer === 'object' && 'getMetering' in mixer) {
          const metering = (mixer as { getMetering: () => { peak: number; rms: number } }).getMetering();
          if (metering) {
            newMetering.set(track.id, metering);
          }
        } else {
          // Fallback: generate random metering for demo
          newMetering.set(track.id, {
            peak: Math.random() * 0.8,
            rms: Math.random() * 0.6,
          });
        }
      });

      setMeteringData(newMetering);
      lastMeterUpdateRef.current = now;
    }

    // Always schedule next frame, but actual update is throttled
    animationFrameRef.current = requestAnimationFrame(updateMetering);
  }, [tracks, getTrackMixer]);

  /**
   * Start metering animation
   */
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateMetering);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateMetering]);

  /**
   * Setup track context menu
   */
  useEffect(() => {
    const trackElements = mixerRef.current?.querySelectorAll('.mixer-channel');
    trackElements?.forEach((el) => {
      const trackId = parseInt(el.getAttribute('data-track-id') || '0', 10);
      const track = tracks.find((t) => t.id === trackId);
      if (!track) {
        return;
      }

      const menuItems = contextMenuService.getMixerTrackMenu({
        onRename: () => {
          if (onTrackRename) {
            const newName = window.prompt('Enter new track name:', track.name);
            if (newName !== null && newName.trim() !== '') {
              onTrackRename(trackId, newName.trim());
            }
          }
        },
        onMute: () => {
          onTrackMute(trackId);
        },
        onSolo: () => {
          onTrackSolo(trackId);
        },
        onAddEffect: () => {
          setSelectedTrackId(trackId);
          setShowEffectLibrary(true);
        },
        onCreateAutomation: () => {
          if (audioContextRef.current) {
            automationService.createAutomationClip(
              {
                type: 'mixer',
                id: `track-${trackId}`,
                parameter: 'volume',
                name: `${track.name} Volume`,
                min: 0,
                max: 1,
                defaultValue: 0.8,
              },
              4
            );
            // Note: This would typically create an automation clip in the playlist
            // For now, we'll just create the automation target
          }
        },
        onRouting: () => {
          // Show routing dialog/modal
          // This would allow selecting bus routing, send levels, etc.
          // For now, we'll just log
          // In a full implementation, this would open a routing panel
        },
      });

      contextMenu.attach(el as HTMLElement, menuItems);
    });

    return () => {
      trackElements?.forEach((el) => {
        contextMenu.detach(el as HTMLElement);
      });
    };
  }, [tracks, contextMenu, onTrackMute, onTrackSolo, onTrackRename, audioContextRef]);

  /**
   * Get track volume from mixer
   */
  const getTrackVolume = useCallback(
    (trackId: number): number => {
      const mixer = getTrackMixer(trackId);
      if (mixer && typeof mixer === 'object' && 'getVolume' in mixer) {
        return (mixer as { getVolume: () => number }).getVolume() * 100;
      }
      return 80;
    },
    [getTrackMixer]
  );

  /**
   * Get track pan from mixer
   */
  const getTrackPan = useCallback(
    (trackId: number): number => {
      const mixer = getTrackMixer(trackId);
      if (mixer && typeof mixer === 'object' && 'getPan' in mixer) {
        return (mixer as { getPan: () => number }).getPan();
      }
      return 0;
    },
    [getTrackMixer]
  );

  /**
   * Get metering for track
   */
  const getMetering = useCallback(
    (trackId: number): { peak: number; rms: number } => {
      return meteringData.get(trackId) || { peak: 0, rms: 0 };
    },
    [meteringData]
  );

  return (
    <div
      ref={mixerRef}
      className="mixer-window"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Mixer Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
          fontSize: '10px',
          color: 'var(--fl-text-secondary)',
          fontWeight: 600,
        }}
      >
        MIXER
      </div>

      {/* Mixer Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'auto',
          padding: '8px',
          gap: '8px',
        }}
      >
        {/* Master Channel */}
        <div
          className="mixer-channel master-channel"
          data-track-id="master"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            minWidth: '80px',
            background: 'var(--fl-bg-darker)',
            border: '1px solid var(--fl-border-dark)',
            borderRadius: '4px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--fl-text-primary)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            MASTER
          </div>

          <Fader
            value={masterVolume}
            min={0}
            max={100}
            onChange={(value) => onMasterVolumeChange(value / 100)}
            label="Volume"
            unit="%"
            width={24}
            height={200}
          />

          <Knob
            value={masterPan}
            min={-1}
            max={1}
            onChange={onMasterPanChange}
            label="Pan"
            size={40}
          />

          <div
            style={{
              width: '100%',
              height: '4px',
              background: 'var(--fl-bg-darkest)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: '4px',
            }}
          >
            <div
              style={{
                width: '50%',
                height: '100%',
                background: 'linear-gradient(90deg, var(--fl-green) 0%, var(--fl-yellow) 50%, var(--fl-red) 100%)',
              }}
            />
          </div>
        </div>

        {/* Track Channels */}
        {tracks.map((track) => {
          const volume = getTrackVolume(track.id);
          const pan = getTrackPan(track.id);
          const metering = getMetering(track.id);
          const peakPercent = Math.min(100, (metering.peak * 100) / 0.8);
          const rmsPercent = Math.min(100, (metering.rms * 100) / 0.6);

          return (
            <div
              key={track.id}
              className="mixer-channel"
              data-track-id={track.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                minWidth: '80px',
                background: 'var(--fl-bg-darker)',
                border: '1px solid var(--fl-border-dark)',
                borderRadius: '4px',
              }}
            >
              {/* Track Name */}
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--fl-text-primary)',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
                title={track.name}
              >
                {track.name}
              </div>

              {/* Effect Slots */}
              <MixerTrackEffectSlots
                trackId={track.id}
                trackMixer={getTrackMixer(track.id)}
                audioContext={audioContextRef.current}
                selectedSlotIndex={selectedTrackId === track.id ? selectedSlotIndex : null}
                onSelectSlot={(slotIndex) => {
                  setSelectedTrackId(track.id);
                  setSelectedSlotIndex(slotIndex);
                }}
                onAddEffect={(_position, _effectType) => {
                  setSelectedTrackId(track.id);
                  setShowEffectLibrary(true);
                }}
              />

              {/* Send Controls */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    fontSize: '8px',
                    color: 'var(--fl-text-secondary)',
                    textAlign: 'center',
                  }}
                >
                  SENDS
                </div>
                {['Reverb', 'Delay'].map((sendName) => (
                  <Knob
                    key={sendName}
                    value={0}
                    min={0}
                    max={100}
                    onChange={() => {
                      // TODO: Implement send
                    }}
                    label={sendName}
                    size={30}
                  />
                ))}
              </div>

              {/* EQ Section */}
              <div
                style={{
                  width: '100%',
                  height: '60px',
                  background: 'var(--fl-bg-darkest)',
                  border: '1px solid var(--fl-border-dark)',
                  borderRadius: '2px',
                  position: 'relative',
                  marginTop: '4px',
                }}
                title="EQ"
              >
                {/* EQ Visualization Placeholder */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(to top, rgba(255, 153, 0, 0.3) 0%, transparent 100%)',
                  }}
                />
              </div>

              {/* Fader */}
              <Fader
                value={volume}
                min={0}
                max={100}
                onChange={(value) => onTrackVolumeChange(track.id, value / 100)}
                label="Volume"
                unit="%"
                width={24}
                height={200}
              />

              {/* Pan Knob */}
              <Knob
                value={pan}
                min={-1}
                max={1}
                onChange={(value) => onTrackPanChange(track.id, value)}
                label="Pan"
                size={40}
              />

              {/* Metering */}
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: 'var(--fl-bg-darkest)',
                  borderRadius: '2px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: `${rmsPercent}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, var(--fl-green) 0%, var(--fl-yellow) 50%, var(--fl-red) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${peakPercent}%`,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    background: '#FF0000',
                  }}
                />
              </div>

              {/* Channel Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  width: '100%',
                }}
              >
                <button
                  onClick={() => onTrackMute(track.id)}
                  style={{
                    flex: 1,
                    height: '20px',
                    background: track.muted
                      ? 'linear-gradient(180deg, #FF6B6B 0%, #E84C3D 100%)'
                      : 'var(--fl-bg-dark)',
                    border: `1px solid ${track.muted ? '#C0392B' : 'var(--fl-border)'}`,
                    color: track.muted ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
                    fontSize: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                  title="Mute"
                >
                  M
                </button>
                <button
                  onClick={() => onTrackSolo(track.id)}
                  style={{
                    flex: 1,
                    height: '20px',
                    background: track.solo
                      ? 'linear-gradient(180deg, #5BCC5B 0%, #3FB53F 100%)'
                      : 'var(--fl-bg-dark)',
                    border: `1px solid ${track.solo ? '#2E8B2E' : 'var(--fl-border)'}`,
                    color: track.solo ? 'var(--fl-text-inverted)' : 'var(--fl-text-secondary)',
                    fontSize: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    borderRadius: '2px',
                  }}
                  title="Solo"
                >
                  S
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Effect Library Panel */}
      {showEffectLibrary && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '300px',
            background: 'var(--fl-bg-dark)',
            borderLeft: '1px solid var(--fl-border-dark)',
            zIndex: 1000,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div
            style={{
              padding: 'var(--spacing-medium)',
              borderBottom: '1px solid var(--fl-border-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--fl-bg-darker)',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
                fontWeight: 600,
              }}
            >
              EFFECT LIBRARY
            </div>
            <button
              onClick={() => setShowEffectLibrary(false)}
              style={{
                width: '20px',
                height: '20px',
                background: 'var(--fl-bg-dark)',
                border: '1px solid var(--fl-border-dark)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--fl-text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
          <EffectLibrary
            onEffectSelect={(effectType) => {
              if (selectedTrackId !== null && selectedSlotIndex !== null && audioContextRef.current) {
                // Add effect to selected slot
                const effectSlots = useEffectSlots(selectedTrackId, audioContextRef.current);
                effectSlots.addEffect(selectedSlotIndex, effectType);
              }
            }}
          />
        </div>
      )}
    </div>
  );
});

