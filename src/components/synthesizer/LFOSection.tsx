/**
 * LFOSection - LFO controls UI
 * @module components/synthesizer/LFOSection
 */

import { Knob } from '../ui/Knob';
import type { LFOConfig } from '../../types/synthesizer.types';

/**
 * LFO section props
 */
interface LFOSectionProps {
  config?: [LFOConfig, LFOConfig, LFOConfig];
  onUpdate: (lfos: [LFOConfig, LFOConfig, LFOConfig]) => void;
}

/**
 * LFO section component
 */
export function LFOSection({ config, onUpdate }: LFOSectionProps): JSX.Element {
  if (!config) {
    return <div>No LFO configuration</div>;
  }

  const updateLFO = (index: number, updates: Partial<LFOConfig>): void => {
    const newConfig = [...config] as [LFOConfig, LFOConfig, LFOConfig];
    const currentLFO = newConfig[index];
    if (currentLFO !== undefined) {
      // Merge updates, keeping only defined values
      const merged: LFOConfig = { ...currentLFO };
      if (updates.enabled !== undefined) merged.enabled = updates.enabled;
      if (updates.waveform !== undefined) merged.waveform = updates.waveform;
      if (updates.rate !== undefined) merged.rate = updates.rate;
      if (updates.tempoSync !== undefined) merged.tempoSync = updates.tempoSync;
      if (updates.syncDivision !== undefined) merged.syncDivision = updates.syncDivision;
      if (updates.depth !== undefined) merged.depth = updates.depth;
      if (updates.delay !== undefined) merged.delay = updates.delay;
      if (updates.fadeIn !== undefined) merged.fadeIn = updates.fadeIn;
      if (updates.phase !== undefined) merged.phase = updates.phase;
      newConfig[index] = merged;
      onUpdate(newConfig);
    }
  };

  return (
    <div className="lfo-section">
      <h3>LFOs</h3>
      <div className="lfos-grid">
        {config.map((lfo, index) => (
          <div key={index} className="lfo-panel">
            <h4>LFO {index + 1}</h4>
            <label>
              <input
                type="checkbox"
                checked={lfo.enabled}
                onChange={(e) =>
                  updateLFO(index, { enabled: e.target.checked })
                }
              />
              Enabled
            </label>
            <select
              value={lfo.waveform}
              onChange={(e) =>
                updateLFO(index, {
                  waveform: e.target.value as LFOConfig['waveform'],
                })
              }
            >
              <option value="sine">Sine</option>
              <option value="triangle">Triangle</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="square">Square</option>
              <option value="random">Random</option>
              <option value="samplehold">Sample & Hold</option>
            </select>
            <Knob
              label="Rate"
              value={lfo.rate}
              min={0.01}
              max={100}
              step={0.01}
              onChange={(value) => updateLFO(index, { rate: value })}
            />
            <Knob
              label="Depth"
              value={lfo.depth}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateLFO(index, { depth: value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

