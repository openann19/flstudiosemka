/**
 * DrumEditor - Real-time 909 drum sample editor plugin
 * Allows editing of drum sample parameters with live preview
 * @module components/drums/DrumEditor
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Knob } from '../ui/Knob';
import { useHintPanel } from '../ui/HintPanel';
import { Button } from '../ui/Button';
import { DrumSampleGenerator } from '../../audio/drums/DrumSampleGenerator';
import { SamplePlayer } from '../../audio/SamplePlayer';
import type { SamplePackBank } from '../../audio/drums/SamplePackBank';

/**
 * Drum editor parameters
 */
export interface DrumEditorParams {
  pitch: number;
  decay: number;
  punch: number;
  tone?: number;
  noise?: number;
  brightness?: number;
  pitchShift: number;
  volume: number;
  reverse: boolean;
}

/**
 * DrumEditor component props
 */
export interface DrumEditorProps {
  audioContext: AudioContext | null;
  samplePackBank: SamplePackBank | null;
  sampleName?: string;
  sampleCategory?: string;
  initialParams?: Partial<DrumEditorParams>;
  onParamsChange?: (params: DrumEditorParams) => void;
}

/**
 * Default parameters
 */
const DEFAULT_PARAMS: DrumEditorParams = {
  pitch: 60,
  decay: 0.2,
  punch: 0.9,
  pitchShift: 0,
  volume: 1.0,
  reverse: false,
};

/**
 * Drum editor component
 */
export function DrumEditor({
  audioContext,
  samplePackBank,
  sampleName,
  sampleCategory,
  initialParams,
  onParamsChange,
}: DrumEditorProps): JSX.Element {
  const [params, setParams] = useState<DrumEditorParams>({
    ...DEFAULT_PARAMS,
    ...initialParams,
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [sampleType, setSampleType] = useState<'kick' | 'snare' | 'hihat' | 'openhat' | 'crash' | 'ride' | 'rimshot' | 'clap'>('kick');
  const hintPanel = useHintPanel();
  const generatorRef = useRef<DrumSampleGenerator | null>(null);
  const previewPlayerRef = useRef<SamplePlayer | null>(null);

  /**
   * Initialize generator
   */
  useEffect(() => {
    if (audioContext) {
      generatorRef.current = new DrumSampleGenerator(audioContext);
    }
  }, [audioContext]);

  /**
   * Detect sample type from name
   */
  useEffect(() => {
    if (sampleName) {
      const nameLower = sampleName.toLowerCase();
      if (nameLower.includes('kick')) {
        setSampleType('kick');
      } else if (nameLower.includes('snare')) {
        setSampleType('snare');
      } else if (nameLower.includes('hihat') || nameLower.includes('hh')) {
        setSampleType('hihat');
      } else if (nameLower.includes('open')) {
        setSampleType('openhat');
      } else if (nameLower.includes('crash')) {
        setSampleType('crash');
      } else if (nameLower.includes('ride')) {
        setSampleType('ride');
      } else if (nameLower.includes('rimshot')) {
        setSampleType('rimshot');
      } else if (nameLower.includes('clap')) {
        setSampleType('clap');
      }
    }
  }, [sampleName]);

  /**
   * Update parameter
   */
  const updateParam = useCallback(
    (key: keyof DrumEditorParams, value: number | boolean): void => {
      const newParams = { ...params, [key]: value };
      setParams(newParams);
      if (onParamsChange) {
        onParamsChange(newParams);
      }
    },
    [params, onParamsChange]
  );

  /**
   * Generate and preview sample
   */
  const previewSample = useCallback(async (): Promise<void> => {
    if (!audioContext || !generatorRef.current) {
      return;
    }

    try {
      setIsGenerating(true);

      let buffer: AudioBuffer;

      // Generate based on type
      const generator = generatorRef.current;
      if (!generator) return;

      switch (sampleType) {
        case 'kick':
          buffer = generator.generateKick({
            pitch: params.pitch,
            decay: params.decay,
            punch: params.punch,
          });
          break;
        case 'snare':
          buffer = generator.generateSnare({
            tone: params.tone || 200,
            noise: params.noise || 0.7,
            decay: params.decay,
          });
          break;
        case 'hihat':
        case 'openhat':
          buffer = generator.generateHiHat({
            pitch: params.pitch || 8000,
            decay: params.decay,
            brightness: params.brightness || 0.8,
          });
          break;
        case 'crash':
          buffer = generator.generateCrash({
            pitch: params.pitch || 3000,
            decay: params.decay,
          });
          break;
        case 'ride':
          buffer = generator.generateRide({
            pitch: params.pitch || 2000,
            decay: params.decay,
          });
          break;
        case 'rimshot':
          buffer = generator.generateRimshot({
            tone: params.tone || 800,
            decay: params.decay,
          });
          break;
        case 'clap':
          buffer = generator.generateClap({
            delay: params.decay * 0.1,
            decay: params.decay,
          });
          break;
        default:
          return;
      }

      // Apply reverse if enabled
      if (params.reverse) {
        const reversed = audioContext.createBuffer(
          buffer.numberOfChannels,
          buffer.length,
          buffer.sampleRate
        );
        for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
          const originalData = buffer.getChannelData(channel);
          const reversedData = reversed.getChannelData(channel);
          for (let i = 0; i < buffer.length; i += 1) {
            const sourceIndex = buffer.length - 1 - i;
            if (sourceIndex < 0 || sourceIndex >= originalData.length) {
              continue;
            }
            const sourceValue = originalData[sourceIndex];
            if (sourceValue !== undefined && i < reversedData.length) {
              reversedData[i] = sourceValue;
            }
          }
        }
        buffer = reversed;
      }

      // Create player and preview
      const player = new SamplePlayer(audioContext, buffer);
      previewPlayerRef.current = player;

      // Play with pitch shift and volume
      const playback = player.play(params.volume, params.pitchShift);
      if (playback && playback.gain) {
        playback.gain.connect(audioContext.destination);
      }
    } catch (error) {
       
      console.error('[DEBUG] DrumEditor: Failed to preview sample', error);
    } finally {
      setIsGenerating(false);
    }
  }, [audioContext, sampleType, params]);

  /**
   * Load original sample for reference
   */
  const loadOriginalSample = useCallback((): void => {
    if (!samplePackBank || !sampleName || !sampleCategory) {
      return;
    }

    const buffer = samplePackBank.getSample(sampleName, sampleCategory);
    if (buffer && audioContext) {
      const player = new SamplePlayer(audioContext, buffer);
      player.play(params.volume, params.pitchShift);
    }
  }, [samplePackBank, sampleName, sampleCategory, audioContext, params.volume, params.pitchShift]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '16px',
        gap: '16px',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fl-text-primary)',
            textTransform: 'uppercase',
          }}
        >
          909 Drum Editor
        </div>
        {sampleName && (
          <div
            style={{
              fontSize: '10px',
              color: 'var(--fl-text-secondary)',
            }}
          >
            {sampleName}
          </div>
        )}
      </div>

      {/* Sample Type Selector */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap',
        }}
      >
        {(['kick', 'snare', 'hihat', 'openhat', 'crash', 'ride', 'rimshot', 'clap'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSampleType(type)}
            style={{
              padding: '4px 8px',
              fontSize: '9px',
              background: sampleType === type ? 'var(--fl-orange)' : 'var(--fl-bg-darker)',
              border: `1px solid ${sampleType === type ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
              color: sampleType === type ? '#000' : 'var(--fl-text-primary)',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Parameters Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Pitch */}
        {(sampleType === 'kick' || sampleType === 'hihat' || sampleType === 'openhat' || sampleType === 'crash' || sampleType === 'ride') && (
          <Knob
            label="Pitch"
            value={params.pitch}
            min={sampleType === 'kick' ? 30 : sampleType === 'hihat' || sampleType === 'openhat' ? 3000 : 1000}
            max={sampleType === 'kick' ? 100 : sampleType === 'hihat' || sampleType === 'openhat' ? 12000 : 5000}
            step={1}
            onChange={(value) => updateParam('pitch', value)}
            onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
            onHintClear={() => hintPanel.hideHint()}
          />
        )}

        {/* Tone (for snares, rimshots) */}
        {(sampleType === 'snare' || sampleType === 'rimshot') && (
          <Knob
            label="Tone"
            value={params.tone || 200}
            min={100}
            max={500}
            step={1}
            onChange={(value) => updateParam('tone', value)}
            onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
            onHintClear={() => hintPanel.hideHint()}
          />
        )}

        {/* Decay */}
        <Knob
          label="Decay"
          value={params.decay}
          min={0.05}
          max={1.0}
          step={0.01}
          onChange={(value) => updateParam('decay', value)}
          onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
          onHintClear={() => hintPanel.hideHint()}
        />

        {/* Punch (for kicks) */}
        {sampleType === 'kick' && (
          <Knob
            label="Punch"
            value={params.punch}
            min={0.1}
            max={2.0}
            step={0.1}
            onChange={(value) => updateParam('punch', value)}
            onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
            onHintClear={() => hintPanel.hideHint()}
          />
        )}

        {/* Noise (for snares) */}
        {sampleType === 'snare' && (
          <Knob
            label="Noise"
            value={params.noise || 0.7}
            min={0.1}
            max={1.0}
            step={0.1}
            onChange={(value) => updateParam('noise', value)}
            onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
            onHintClear={() => hintPanel.hideHint()}
          />
        )}

        {/* Brightness (for hi-hats) */}
        {(sampleType === 'hihat' || sampleType === 'openhat') && (
          <Knob
            label="Brightness"
            value={params.brightness || 0.8}
            min={0.1}
            max={1.0}
            step={0.1}
            onChange={(value) => updateParam('brightness', value)}
            onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
            onHintClear={() => hintPanel.hideHint()}
          />
        )}

        {/* Pitch Shift */}
        <Knob
          label="Pitch Shift"
          value={params.pitchShift}
          min={-24}
          max={24}
          step={1}
          onChange={(value) => updateParam('pitchShift', value)}
          onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
          onHintClear={() => hintPanel.hideHint()}
        />

        {/* Volume */}
        <Knob
          label="Volume"
          value={params.volume}
          min={0}
          max={2.0}
          step={0.1}
          onChange={(value) => updateParam('volume', value)}
          onHint={(hint) => hintPanel.showHint(hint, 0, 0)}
          onHintClear={() => hintPanel.hideHint()}
        />
      </div>

      {/* Options */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10px',
            color: 'var(--fl-text-primary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={params.reverse}
            onChange={(e) => updateParam('reverse', e.target.checked)}
            style={{
              cursor: 'pointer',
            }}
          />
          Reverse
        </label>
      </div>

      {/* Preview Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
        }}
      >
        <Button
          onClick={previewSample}
          disabled={isGenerating || !audioContext}
          style={{
            flex: 1,
            fontSize: '10px',
            padding: '8px',
          }}
        >
          {isGenerating ? 'Generating...' : '▶ Preview Generated'}
        </Button>
        {sampleName && (
          <Button
            onClick={loadOriginalSample}
            disabled={!audioContext || !samplePackBank}
            style={{
              flex: 1,
              fontSize: '10px',
              padding: '8px',
            }}
          >
            ▶ Original
          </Button>
        )}
      </div>

      {/* Info */}
      <div
        style={{
          fontSize: '9px',
          color: 'var(--fl-text-secondary)',
          padding: '8px',
          background: 'var(--fl-bg-darker)',
          borderRadius: '4px',
        }}
      >
        <div>Edit parameters and click "Preview Generated" to hear your custom 909 sound.</div>
        <div style={{ marginTop: '4px' }}>
          Changes are applied in real-time. Use "Original" to compare with the base sample.
        </div>
      </div>
    </div>
  );
}

