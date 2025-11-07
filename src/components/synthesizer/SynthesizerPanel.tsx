/**
 * SynthesizerPanel - Main synthesizer UI panel
 * Orchestrates all synthesizer sections
 * @module components/synthesizer/SynthesizerPanel
 */

import { useState } from 'react';
import { useSynthesizer } from '../../hooks/useSynthesizer';
import { OscillatorSection } from './OscillatorSection';
import { FilterSection } from './FilterSection';
import { EnvelopeSection } from './EnvelopeSection';
import { LFOSection } from './LFOSection';
import { EffectsSection } from './EffectsSection';
import { ModulationMatrixUI } from './ModulationMatrixUI';
import { PresetBrowser } from './PresetBrowser';
import type { SynthesizerVoiceConfig } from '../../types/synthesizer.types';

/**
 * Synthesizer panel props
 */
interface SynthesizerPanelProps {
  audioContext: AudioContext | null;
  initialConfig?: SynthesizerVoiceConfig;
}

/**
 * Main synthesizer panel component
 */
export function SynthesizerPanel({
  audioContext,
  initialConfig,
}: SynthesizerPanelProps): JSX.Element {
  const synthesizer = useSynthesizer(audioContext, initialConfig);
  const [activeTab, setActiveTab] = useState<
    'oscillators' | 'filter' | 'envelopes' | 'lfos' | 'effects' | 'modulation' | 'presets'
  >('oscillators');

  if (!synthesizer.isInitialized) {
    return (
      <div className="synthesizer-panel">
        <div className="synthesizer-loading">Initializing synthesizer...</div>
      </div>
    );
  }

  return (
    <div className="synthesizer-panel">
      <div className="synthesizer-header">
        <h2>Modular Synthesizer</h2>
        <div className="synthesizer-tabs">
          <button
            className={activeTab === 'oscillators' ? 'active' : ''}
            onClick={() => setActiveTab('oscillators')}
            type="button"
          >
            Oscillators
          </button>
          <button
            className={activeTab === 'filter' ? 'active' : ''}
            onClick={() => setActiveTab('filter')}
            type="button"
          >
            Filter
          </button>
          <button
            className={activeTab === 'envelopes' ? 'active' : ''}
            onClick={() => setActiveTab('envelopes')}
            type="button"
          >
            Envelopes
          </button>
          <button
            className={activeTab === 'lfos' ? 'active' : ''}
            onClick={() => setActiveTab('lfos')}
            type="button"
          >
            LFOs
          </button>
          <button
            className={activeTab === 'effects' ? 'active' : ''}
            onClick={() => setActiveTab('effects')}
            type="button"
          >
            Effects
          </button>
          <button
            className={activeTab === 'modulation' ? 'active' : ''}
            onClick={() => setActiveTab('modulation')}
            type="button"
          >
            Modulation
          </button>
          <button
            className={activeTab === 'presets' ? 'active' : ''}
            onClick={() => setActiveTab('presets')}
            type="button"
          >
            Presets
          </button>
        </div>
      </div>

      <div className="synthesizer-content">
        {activeTab === 'oscillators' && (
          <OscillatorSection
            config={synthesizer.state?.config.oscillators}
            onUpdate={(oscillators) =>
              synthesizer.updateConfig({ oscillators })
            }
          />
        )}
        {activeTab === 'filter' && (
          <FilterSection
            config={synthesizer.state?.config.filter}
            onUpdate={(filter) => synthesizer.updateConfig({ filter })}
          />
        )}
        {activeTab === 'envelopes' && (
          <EnvelopeSection
            ampEnvelope={synthesizer.state?.config.ampEnvelope}
            filterEnvelope={synthesizer.state?.config.filterEnvelope}
            onUpdate={(envelopes) => synthesizer.updateConfig(envelopes)}
          />
        )}
        {activeTab === 'lfos' && (
          <LFOSection
            config={synthesizer.state?.config.lfos}
            onUpdate={(lfos) => synthesizer.updateConfig({ lfos })}
          />
        )}
        {activeTab === 'effects' && (
          <EffectsSection
            config={synthesizer.state?.config.effects}
            onUpdate={(effects) => synthesizer.updateConfig({ effects })}
          />
        )}
        {activeTab === 'modulation' && (
          <ModulationMatrixUI
            slots={synthesizer.state?.config.modulation ?? []}
            onUpdate={(modulation) => synthesizer.updateConfig({ modulation })}
          />
        )}
        {activeTab === 'presets' && (
          <PresetBrowser
            presetManager={synthesizer.presetManager}
            onLoadPreset={synthesizer.loadPreset}
          />
        )}
      </div>
    </div>
  );
}

