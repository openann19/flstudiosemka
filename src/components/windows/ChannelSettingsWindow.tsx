/**
 * ChannelSettingsWindow - Channel settings window with 7 tabs
 * Implements FL Studio-style channel settings with Instrument, Envelope, Filter, LFO, Effects, Mixing, and Misc tabs
 * @module components/windows/ChannelSettingsWindow
 */

import { useState, useCallback } from 'react';
import { Knob } from '../ui/Knob';
import { DrumEditor } from '../drums/DrumEditor';
import type { Track, WaveformType, FilterType } from '../../types/FLStudio.types';
import type { SamplePackBank } from '../../audio/drums/SamplePackBank';

/**
 * ChannelSettingsWindow component props
 */
export interface ChannelSettingsWindowProps {
  track: Track | null;
  onUpdate: (updates: Partial<Track>) => void;
  onClose?: () => void;
  audioContext?: AudioContext | null;
  samplePackBank?: SamplePackBank | null;
}

/**
 * Tab type
 */
type TabType = 'instrument' | 'envelope' | 'filter' | 'lfo' | 'effects' | 'mixing' | 'misc';

/**
 * Channel settings window component
 */
export function ChannelSettingsWindow({ track, onUpdate, onClose, audioContext, samplePackBank }: ChannelSettingsWindowProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('instrument');
  
  // Check if this is a drum track that should show DrumEditor
  const isDrumTrack = track?.type === 'drum';

  if (!track) {
    return (
      <div style={{ padding: '16px', color: 'var(--fl-text-secondary)' }}>
        No track selected
      </div>
    );
  }

  const params = track.params || {
    volume: 0.8,
    pan: 0,
    amp: { a: 0, d: 0.1, s: 0.7, r: 0.2 },
    filter: { cutoff: 1000, resonance: 1, type: 'lowpass' as FilterType },
    detune: 0,
    waveform: 'sine' as WaveformType,
    sends: { reverb: 0, delay: 0 },
  };

  /**
   * Update parameter
   */
  const updateParam = useCallback(
    (path: string, value: unknown): void => {
      const updates: Partial<Track> = {
        params: {
          ...params,
        },
      };

      const keys = path.split('.');
      let current: Record<string, unknown> = (updates.params as unknown) as Record<string, unknown>;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (key === undefined) {
          continue;
        }
        if (!(key in current)) {
          current[key] = {};
        }
        const next = current[key];
        if (next && typeof next === 'object' && !Array.isArray(next)) {
          current = next as Record<string, unknown>;
        } else {
          break;
        }
      }

      const lastKey = keys[keys.length - 1];
      if (lastKey !== undefined) {
        current[lastKey] = value;
      }
      onUpdate(updates);
    },
    [params, onUpdate]
  );

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'instrument', label: 'INSTRUMENT' },
    { id: 'envelope', label: 'ENVELOPE' },
    { id: 'filter', label: 'FILTER' },
    { id: 'lfo', label: 'LFO' },
    { id: 'effects', label: 'EFFECTS' },
    { id: 'mixing', label: 'MIXING' },
    { id: 'misc', label: 'MISC' },
  ];

  return (
    <div
      className="channel-settings-window"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'var(--fl-text-primary)',
            fontWeight: 600,
            flex: 1,
          }}
        >
          {track.name} - Channel Settings
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--fl-text-secondary)',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0 8px',
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px',
              background: activeTab === tab.id ? 'var(--fl-bg-dark)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--fl-orange)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
              fontSize: '10px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
        }}
      >
        {activeTab === 'instrument' && isDrumTrack && audioContext && samplePackBank && (
          <DrumEditor
            audioContext={audioContext}
            samplePackBank={samplePackBank}
            sampleName={track.name}
            sampleCategory={undefined}
            onParamsChange={(drumParams) => {
              // Store drum editor params in track
              onUpdate({
                params: {
                  ...params,
                  ...drumParams,
                } as typeof params,
              });
            }}
          />
        )}

        {activeTab === 'instrument' && !isDrumTrack && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--fl-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                WAVEFORM
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['sine', 'square', 'sawtooth', 'triangle'] as WaveformType[]).map((waveform) => (
                  <button
                    key={waveform}
                    onClick={() => updateParam('waveform', waveform)}
                    style={{
                      padding: '8px 16px',
                      background: params.waveform === waveform ? 'var(--fl-orange)' : 'var(--fl-bg-darker)',
                      border: `1px solid ${params.waveform === waveform ? 'var(--fl-orange-dark)' : 'var(--fl-border)'}`,
                      color: params.waveform === waveform ? '#000' : 'var(--fl-text-primary)',
                      fontSize: '10px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {waveform}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--fl-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                TUNING
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Knob
                  value={params.detune}
                  min={-1200}
                  max={1200}
                  onChange={(value) => updateParam('detune', value)}
                  label="Pitch"
                  unit="cents"
                  size={50}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'envelope' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
                marginBottom: '8px',
              }}
            >
              ADSR ENVELOPE
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Knob
                value={params.amp.a * 1000}
                min={0}
                max={2000}
                onChange={(value) => updateParam('amp.a', value / 1000)}
                label="Attack"
                unit="ms"
                size={50}
              />
              <Knob
                value={params.amp.d * 1000}
                min={0}
                max={2000}
                onChange={(value) => updateParam('amp.d', value / 1000)}
                label="Decay"
                unit="ms"
                size={50}
              />
              <Knob
                value={params.amp.s * 100}
                min={0}
                max={100}
                onChange={(value) => updateParam('amp.s', value / 100)}
                label="Sustain"
                unit="%"
                size={50}
              />
              <Knob
                value={params.amp.r * 1000}
                min={0}
                max={3000}
                onChange={(value) => updateParam('amp.r', value / 1000)}
                label="Release"
                unit="ms"
                size={50}
              />
            </div>
          </div>
        )}

        {activeTab === 'filter' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--fl-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                FILTER TYPE
              </div>
              <select
                value={params.filter.type}
                onChange={(e) => updateParam('filter.type', e.target.value as FilterType)}
                style={{
                  background: 'var(--fl-bg-darker)',
                  border: '1px solid var(--fl-border)',
                  color: 'var(--fl-text-primary)',
                  fontSize: '10px',
                  padding: '4px 8px',
                }}
              >
                <option value="lowpass">Low Pass</option>
                <option value="highpass">High Pass</option>
                <option value="bandpass">Band Pass</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Knob
                value={params.filter.cutoff}
                min={20}
                max={20000}
                onChange={(value) => updateParam('filter.cutoff', value)}
                label="Cutoff"
                unit="Hz"
                size={50}
              />
              <Knob
                value={params.filter.resonance}
                min={0.1}
                max={20}
                onChange={(value) => updateParam('filter.resonance', value)}
                label="Resonance"
                unit="Q"
                size={50}
              />
            </div>
          </div>
        )}

        {activeTab === 'lfo' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
              }}
            >
              LFO controls coming soon
            </div>
          </div>
        )}

        {activeTab === 'effects' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
              }}
            >
              Effects controls coming soon
            </div>
          </div>
        )}

        {activeTab === 'mixing' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <Knob
                value={params.volume * 100}
                min={0}
                max={200}
                onChange={(value) => updateParam('volume', value / 100)}
                label="Volume"
                unit="%"
                size={50}
              />
              <Knob
                value={params.pan}
                min={-1}
                max={1}
                onChange={(value) => updateParam('pan', value)}
                label="Pan"
                size={50}
              />
            </div>

            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--fl-text-secondary)',
                  marginBottom: '8px',
                }}
              >
                SENDS
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Knob
                  value={params.sends.reverb * 100}
                  min={0}
                  max={100}
                  onChange={(value) => updateParam('sends.reverb', value / 100)}
                  label="Reverb"
                  unit="%"
                  size={50}
                />
                <Knob
                  value={params.sends.delay * 100}
                  min={0}
                  max={100}
                  onChange={(value) => updateParam('sends.delay', value / 100)}
                  label="Delay"
                  unit="%"
                  size={50}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'misc' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
              }}
            >
              Misc controls coming soon
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

