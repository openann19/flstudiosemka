/**
 * Main entry point for FL Studio Web DAW
 * Imports all converted TypeScript modules
 * @module main
 */

// Timeline utilities (must be imported first to be available on window)
import { timelineUtils } from '../timelineUtils';

// Audio modules
import { Synthesizer } from './audio/Synthesizer';
import { EnvelopeGenerator } from './audio/EnvelopeGenerator';
import { SamplePlayer, loadAudioSample, createSamplePlayer } from './audio/SamplePlayer';
import { InstrumentManager } from './audio/InstrumentManager';
import { AudioRecorder } from './audio/AudioRecorder';

// Effects modules
import { EffectChain } from './effects/EffectChain';
import { EQ } from './effects/EQ';
import { Compressor } from './effects/Compressor';

// Mixer modules
import { TrackMixer } from './mixer/TrackMixer';
import { BusManager } from './mixer/BusManager';
import { LUFSMeter } from './mixer/LUFSMeter';

// Export modules to window for browser compatibility
if (typeof window !== 'undefined') {
  // Timeline utilities (already set by timelineUtils.ts, but ensure it's available)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(window as any).timelineUtils) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).timelineUtils = timelineUtils;
  }

  // Audio
  window.Synthesizer = Synthesizer;
  window.EnvelopeGenerator = EnvelopeGenerator;
  window.SamplePlayer = SamplePlayer;
  window.loadAudioSample = loadAudioSample;
  window.createSamplePlayer = createSamplePlayer;
  window.InstrumentManager = InstrumentManager;
  window.AudioRecorder = AudioRecorder;

  // Effects
  window.EffectChain = EffectChain;
  window.EQ = EQ;
  window.Compressor = Compressor;

  // Mixer
  window.TrackMixer = TrackMixer;
  window.BusManager = BusManager;
  window.LUFSMeter = LUFSMeter;
}

// Export for module systems
export {
  Synthesizer,
  EnvelopeGenerator,
  SamplePlayer,
  loadAudioSample,
  createSamplePlayer,
  InstrumentManager,
  AudioRecorder,
  EffectChain,
  EQ,
  Compressor,
  TrackMixer,
  BusManager,
  LUFSMeter,
};

