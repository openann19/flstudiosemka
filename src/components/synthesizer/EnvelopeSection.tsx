/**
 * EnvelopeSection - Envelope controls UI
 * @module components/synthesizer/EnvelopeSection
 */

import { Knob } from '../ui/Knob';
import type { ADSREnvelopeParams } from '../../types/synthesizer.types';

/**
 * Envelope section props
 */
interface EnvelopeSectionProps {
  ampEnvelope?: ADSREnvelopeParams;
  filterEnvelope?: ADSREnvelopeParams;
  onUpdate: (envelopes: {
    ampEnvelope?: ADSREnvelopeParams;
    filterEnvelope?: ADSREnvelopeParams;
  }) => void;
}

/**
 * Envelope section component
 */
export function EnvelopeSection({
  ampEnvelope,
  filterEnvelope,
  onUpdate,
}: EnvelopeSectionProps): JSX.Element {
  const updateAmpEnvelope = (updates: Partial<ADSREnvelopeParams>): void => {
    if (ampEnvelope) {
      onUpdate({ ampEnvelope: { ...ampEnvelope, ...updates } });
    }
  };

  const updateFilterEnvelope = (updates: Partial<ADSREnvelopeParams>): void => {
    if (filterEnvelope) {
      onUpdate({ filterEnvelope: { ...filterEnvelope, ...updates } });
    }
  };

  return (
    <div className="envelope-section">
      <h3>Envelopes</h3>
      <div className="envelopes-grid">
        <div className="envelope-panel">
          <h4>Amp Envelope</h4>
          {ampEnvelope && (
            <>
              <Knob
                label="Attack"
                value={ampEnvelope.attack}
                min={0}
                max={10}
                step={0.01}
                onChange={(value) => updateAmpEnvelope({ attack: value })}
              />
              <Knob
                label="Decay"
                value={ampEnvelope.decay}
                min={0}
                max={10}
                step={0.01}
                onChange={(value) => updateAmpEnvelope({ decay: value })}
              />
              <Knob
                label="Sustain"
                value={ampEnvelope.sustain}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => updateAmpEnvelope({ sustain: value })}
              />
              <Knob
                label="Release"
                value={ampEnvelope.release}
                min={0}
                max={10}
                step={0.01}
                onChange={(value) => updateAmpEnvelope({ release: value })}
              />
            </>
          )}
        </div>
        <div className="envelope-panel">
          <h4>Filter Envelope</h4>
          {filterEnvelope && (
            <>
              <Knob
                label="Attack"
                value={filterEnvelope.attack}
                min={0}
                max={10}
                step={0.01}
                onChange={(value) => updateFilterEnvelope({ attack: value })}
              />
              <Knob
                label="Decay"
                value={filterEnvelope.decay}
                min={0}
                max={10}
                step={0.01}
                onChange={(value) => updateFilterEnvelope({ decay: value })}
              />
              <Knob
                label="Sustain"
                value={filterEnvelope.sustain}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => updateFilterEnvelope({ sustain: value })}
              />
              <Knob
                label="Release"
                value={filterEnvelope.release}
                min={0}
                max={10}
                step={0.01}
                onChange={(value) => updateFilterEnvelope({ release: value })}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

