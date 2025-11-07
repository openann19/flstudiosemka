/**
 * OscillatorSection - Oscillator controls UI
 * @module components/synthesizer/OscillatorSection
 */

import { Knob } from '../ui/Knob';
import type { OscillatorConfig } from '../../types/synthesizer.types';

/**
 * Oscillator section props
 */
interface OscillatorSectionProps {
  config?: [OscillatorConfig, OscillatorConfig, OscillatorConfig, OscillatorConfig];
  onUpdate: (oscillators: [OscillatorConfig, OscillatorConfig, OscillatorConfig, OscillatorConfig]) => void;
}

/**
 * Oscillator section component
 */
export function OscillatorSection({
  config,
  onUpdate,
}: OscillatorSectionProps): JSX.Element {
  if (!config) {
    return <div>No oscillator configuration</div>;
  }

  const updateOscillator = (
    index: number,
    updates: Partial<OscillatorConfig>
  ): void => {
    const newConfig = [...config] as [
      OscillatorConfig,
      OscillatorConfig,
      OscillatorConfig,
      OscillatorConfig,
    ];
    const currentOsc = newConfig[index];
    if (currentOsc !== undefined) {
      // Merge updates, keeping only defined values
      const merged: OscillatorConfig = { ...currentOsc };
      if (updates.enabled !== undefined) merged.enabled = updates.enabled;
      if (updates.waveform !== undefined) merged.waveform = updates.waveform;
      if (updates.octave !== undefined) merged.octave = updates.octave;
      if (updates.semitone !== undefined) merged.semitone = updates.semitone;
      if (updates.detune !== undefined) merged.detune = updates.detune;
      if (updates.gain !== undefined) merged.gain = updates.gain;
      if (updates.pulseWidth !== undefined) merged.pulseWidth = updates.pulseWidth;
      if (updates.phase !== undefined) merged.phase = updates.phase;
      if (updates.sync !== undefined) merged.sync = updates.sync;
      if (updates.ringMod !== undefined) merged.ringMod = updates.ringMod;
      if (updates.wavetableIndex !== undefined) merged.wavetableIndex = updates.wavetableIndex;
      if (updates.oversampling !== undefined) merged.oversampling = updates.oversampling;
      if (updates.usePolyBLEP !== undefined) merged.usePolyBLEP = updates.usePolyBLEP;
      if (updates.useBandLimited !== undefined) merged.useBandLimited = updates.useBandLimited;
      newConfig[index] = merged;
      onUpdate(newConfig);
    }
  };

  return (
    <div className="oscillator-section">
      <h3>Oscillators</h3>
      <div className="oscillators-grid">
        {config.map((osc, index) => (
          <div key={index} className="oscillator-panel">
            <h4>OSC {index + 1}</h4>
            <label>
              <input
                type="checkbox"
                checked={osc.enabled}
                onChange={(e) =>
                  updateOscillator(index, { enabled: e.target.checked })
                }
              />
              Enabled
            </label>
            <select
              value={osc.waveform}
              onChange={(e) =>
                updateOscillator(index, {
                  waveform: e.target.value as OscillatorConfig['waveform'],
                })
              }
            >
              <option value="sine">Sine</option>
              <option value="triangle">Triangle</option>
              <option value="sawtooth">Sawtooth</option>
              <option value="square">Square</option>
              <option value="pulse">Pulse</option>
              <option value="noise">Noise</option>
            </select>
            <Knob
              label="Octave"
              value={osc.octave}
              min={-3}
              max={3}
              step={1}
              onChange={(value) => updateOscillator(index, { octave: value })}
            />
            <Knob
              label="Detune"
              value={osc.detune}
              min={-50}
              max={50}
              step={1}
              onChange={(value) => updateOscillator(index, { detune: value })}
            />
            <Knob
              label="Gain"
              value={osc.gain}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateOscillator(index, { gain: value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

