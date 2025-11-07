/**
 * PresetBrowser - Preset browser and management UI
 * @module components/synthesizer/PresetBrowser
 */

import { useState, useEffect } from 'react';
import { PresetManager } from '../../audio/synthesizer/presets/PresetManager';
import type { SynthesizerPreset } from '../../types/synthesizer.types';

/**
 * Preset browser props
 */
interface PresetBrowserProps {
  presetManager: PresetManager;
  onLoadPreset: (presetId: string) => boolean;
}

/**
 * Preset browser component
 */
export function PresetBrowser({
  presetManager,
  onLoadPreset,
}: PresetBrowserProps): JSX.Element {
  const [presets, setPresets] = useState<SynthesizerPreset[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const allPresets = presetManager.getAllPresets();
    setPresets(allPresets);
  }, [presetManager]);

  const categories = ['All', ...Array.from(new Set(presets.map((p) => p.category)))];

  const filteredPresets =
    selectedCategory === 'All'
      ? presets
      : presets.filter((p) => p.category === selectedCategory);

  return (
    <div className="preset-browser">
      <h3>Presets</h3>
      <div className="preset-categories">
        {categories.map((category) => (
          <button
            key={category}
            className={selectedCategory === category ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>
      <div className="preset-list">
        {filteredPresets.map((preset) => (
          <div key={preset.id} className="preset-item">
            <h4>{preset.name}</h4>
            {preset.description && <p>{preset.description}</p>}
            <button
              onClick={() => onLoadPreset(preset.id)}
              type="button"
              className="load-preset-btn"
            >
              Load
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

