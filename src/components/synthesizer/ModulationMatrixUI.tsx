/**
 * ModulationMatrixUI - Modulation matrix controls UI
 * @module components/synthesizer/ModulationMatrixUI
 */

import type { ModulationSlot } from '../../types/synthesizer.types';

/**
 * Modulation matrix UI props
 */
interface ModulationMatrixUIProps {
  slots?: ModulationSlot[];
  onUpdate: (modulation: ModulationSlot[]) => void;
}

/**
 * Modulation matrix UI component
 */
export function ModulationMatrixUI({
  slots = [],
  onUpdate,
}: ModulationMatrixUIProps): JSX.Element {
  const updateSlot = (index: number, updates: Partial<ModulationSlot>): void => {
    const newSlots = [...slots];
    if (!newSlots[index]) {
      newSlots[index] = {
        enabled: false,
        source: 'lfo1',
        destination: 'osc1Pitch',
        depth: 0,
        bipolar: true,
      };
    }
    newSlots[index] = { ...newSlots[index], ...updates };
    onUpdate(newSlots);
  };

  return (
    <div className="modulation-matrix">
      <h3>Modulation Matrix</h3>
      <div className="modulation-slots">
        {Array.from({ length: 16 }, (_, index) => {
          const slot = slots[index];
          return (
            <div key={index} className="modulation-slot">
              <label>
                <input
                  type="checkbox"
                  checked={slot?.enabled ?? false}
                  onChange={(e) =>
                    updateSlot(index, { enabled: e.target.checked })
                  }
                />
                Slot {index + 1}
              </label>
              {slot && (
                <>
                  <select
                    value={slot.source}
                    onChange={(e) =>
                      updateSlot(index, {
                        source: e.target.value as ModulationSlot['source'],
                      })
                    }
                  >
                    <option value="lfo1">LFO 1</option>
                    <option value="lfo2">LFO 2</option>
                    <option value="lfo3">LFO 3</option>
                    <option value="env1">Env 1</option>
                    <option value="env2">Env 2</option>
                  </select>
                  <select
                    value={slot.destination}
                    onChange={(e) =>
                      updateSlot(index, {
                        destination: e.target.value as ModulationSlot['destination'],
                      })
                    }
                  >
                    <option value="osc1Pitch">OSC 1 Pitch</option>
                    <option value="osc2Pitch">OSC 2 Pitch</option>
                    <option value="filterCutoff">Filter Cutoff</option>
                    <option value="filterResonance">Filter Resonance</option>
                    <option value="ampGain">Amp Gain</option>
                  </select>
                  <input
                    type="range"
                    min={-1}
                    max={1}
                    step={0.01}
                    value={slot.depth}
                    onChange={(e) =>
                      updateSlot(index, { depth: parseFloat(e.target.value) })
                    }
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

