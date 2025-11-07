/**
 * EffectsSection - Effects chain controls UI
 * @module components/synthesizer/EffectsSection
 */

import { Knob } from '../ui/Knob';
import type { SynthesizerVoiceConfig } from '../../types/synthesizer.types';

/**
 * Effects section props
 */
interface EffectsSectionProps {
  config?: SynthesizerVoiceConfig['effects'];
  onUpdate: (effects: SynthesizerVoiceConfig['effects']) => void;
}

/**
 * Effects section component
 */
export function EffectsSection({
  config,
  onUpdate,
}: EffectsSectionProps): JSX.Element {
  if (!config) {
    return <div>No effects configuration</div>;
  }

  const updateEffect = <K extends keyof typeof config>(
    effectName: K,
    updates: Partial<typeof config[K]>
  ): void => {
    onUpdate({
      ...config,
      [effectName]: { ...config[effectName], ...updates },
    });
  };

  return (
    <div className="effects-section">
      <h3>Effects</h3>
      <div className="effects-grid">
        <div className="effect-panel">
          <h4>Delay</h4>
          <label>
            <input
              type="checkbox"
              checked={config.delay.enabled}
              onChange={(e) =>
                updateEffect('delay', { enabled: e.target.checked })
              }
            />
            Enabled
          </label>
          <Knob
            label="Time"
            value={config.delay.time}
            min={0}
            max={2}
            step={0.01}
            onChange={(value) => updateEffect('delay', { time: value })}
          />
          <Knob
            label="Feedback"
            value={config.delay.feedback}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateEffect('delay', { feedback: value })}
          />
        </div>
        <div className="effect-panel">
          <h4>Reverb</h4>
          <label>
            <input
              type="checkbox"
              checked={config.reverb.enabled}
              onChange={(e) =>
                updateEffect('reverb', { enabled: e.target.checked })
              }
            />
            Enabled
          </label>
          <Knob
            label="Decay"
            value={config.reverb.decay}
            min={0}
            max={10}
            step={0.1}
            onChange={(value) => updateEffect('reverb', { decay: value })}
          />
          <Knob
            label="Wet"
            value={config.reverb.wet}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateEffect('reverb', { wet: value })}
          />
        </div>
        <div className="effect-panel">
          <h4>Chorus</h4>
          <label>
            <input
              type="checkbox"
              checked={config.chorus.enabled}
              onChange={(e) =>
                updateEffect('chorus', { enabled: e.target.checked })
              }
            />
            Enabled
          </label>
          <Knob
            label="Rate"
            value={config.chorus.rate}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(value) => updateEffect('chorus', { rate: value })}
          />
          <Knob
            label="Depth"
            value={config.chorus.depth}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => updateEffect('chorus', { depth: value })}
          />
        </div>
      </div>
    </div>
  );
}

