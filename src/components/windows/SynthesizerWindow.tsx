/**
 * SynthesizerWindow - Synthesizer window component
 * @module components/windows/SynthesizerWindow
 */

import { SynthesizerPanel } from '../synthesizer/SynthesizerPanel';
import { useAudioEngine } from '../../hooks/useAudioEngine';

/**
 * Synthesizer window component
 */
export function SynthesizerWindow(): JSX.Element {
  const audioEngine = useAudioEngine();

  return (
    <div className="synthesizer-window">
      <SynthesizerPanel audioContext={audioEngine.audioContext} />
    </div>
  );
}

