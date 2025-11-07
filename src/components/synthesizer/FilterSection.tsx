/**
 * FilterSection - Filter controls UI
 * @module components/synthesizer/FilterSection
 */

import { Knob } from '../ui/Knob';
import type { FilterConfig } from '../../types/synthesizer.types';

/**
 * Filter section props
 */
interface FilterSectionProps {
  config?: FilterConfig;
  onUpdate: (filter: FilterConfig) => void;
}

/**
 * Filter section component
 */
export function FilterSection({ config, onUpdate }: FilterSectionProps): JSX.Element {
  if (!config) {
    return <div>No filter configuration</div>;
  }

  const updateFilter = (updates: Partial<FilterConfig>): void => {
    onUpdate({ ...config, ...updates });
  };

  return (
    <div className="filter-section">
      <h3>Filter</h3>
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => updateFilter({ enabled: e.target.checked })}
        />
        Enabled
      </label>
      <select
        value={config.mode}
        onChange={(e) =>
          updateFilter({ mode: e.target.value as FilterConfig['mode'] })
        }
      >
        <option value="lowpass">Lowpass</option>
        <option value="highpass">Highpass</option>
        <option value="bandpass">Bandpass</option>
        <option value="notch">Notch</option>
        <option value="allpass">Allpass</option>
      </select>
      <Knob
        label="Cutoff"
        value={config.cutoff}
        min={20}
        max={20000}
        step={1}
        onChange={(value) => updateFilter({ cutoff: value })}
      />
      <Knob
        label="Resonance"
        value={config.resonance}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => updateFilter({ resonance: value })}
      />
      <Knob
        label="Drive"
        value={config.drive}
        min={0}
        max={1}
        step={0.01}
        onChange={(value) => updateFilter({ drive: value })}
      />
      <Knob
        label="Keytracking"
        value={config.keytracking}
        min={-1}
        max={1}
        step={0.01}
        onChange={(value) => updateFilter({ keytracking: value })}
      />
    </div>
  );
}

