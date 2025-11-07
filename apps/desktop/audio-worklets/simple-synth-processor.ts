/**
 * Simple Synthesizer AudioWorkletProcessor
 * Real-time audio synthesis in AudioWorklet context
 * 
 * Features:
 * - Oscillator (sine, square, sawtooth, triangle)
 * - ADSR envelope
 * - Low-latency voice management
 * - Denormal handling
 */

type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';
type EnvelopePhase = 'attack' | 'decay' | 'sustain' | 'release';

interface Voice {
  id: number;
  frequency: number;
  velocity: number;
  phase: number;
  envelopePhase: EnvelopePhase;
  envelopeValue: number;
  startTime: number;
  releaseTime: number | null;
  attackTime: number;
  decayTime: number;
  sustainLevel: number;
  releaseTimeParam: number;
  waveform: WaveformType;
}

interface NoteOnData {
  frequency: number;
  velocity?: number;
  voiceId?: number | null;
}

interface NoteOffData {
  voiceId: number;
}

interface SetParameterData {
  voiceId: number;
  parameter: keyof Voice;
  value: number | string;
}

interface ProcessorMessage {
  type: 'note-on' | 'note-off' | 'set-parameter' | 'stop-all';
  data?: NoteOnData | NoteOffData | SetParameterData;
}

class SimpleSynthProcessor extends AudioWorkletProcessor {
  private voices: Map<number, Voice> = new Map();
  private nextVoiceId = 0;
  private readonly denormalPrevention = 1e-20;

  constructor() {
    super();
    
    // Port message handler
    this.port.onmessage = (event: MessageEvent<ProcessorMessage>) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'note-on':
          if (data) {
            this.handleNoteOn(data as NoteOnData);
          }
          break;
        case 'note-off':
          if (data) {
            this.handleNoteOff(data as NoteOffData);
          }
          break;
        case 'set-parameter':
          if (data) {
            const paramData = data as SetParameterData;
            this.setParameter(paramData.voiceId, paramData.parameter, paramData.value);
          }
          break;
        case 'stop-all':
          this.stopAll();
          break;
      }
    };
  }

  /**
   * Handle note on
   */
  private handleNoteOn(data: NoteOnData): void {
    const { frequency, velocity = 1.0, voiceId = null } = data;
    
    const id = voiceId ?? this.nextVoiceId++;
    const now = currentTime;
    
    // Create voice
    const voice: Voice = {
      id,
      frequency,
      velocity,
      phase: 0,
      envelopePhase: 'attack',
      envelopeValue: 0,
      startTime: now,
      releaseTime: null,
      attackTime: 0.01,  // 10ms attack
      decayTime: 0.1,    // 100ms decay
      sustainLevel: 0.7, // 70% sustain
      releaseTimeParam: 0.2,  // 200ms release
      waveform: 'sine',
    };
    
    this.voices.set(id, voice);
  }

  /**
   * Handle note off
   */
  private handleNoteOff(data: NoteOffData): void {
    const { voiceId } = data;
    const voice = this.voices.get(voiceId);
    
    if (voice) {
      voice.envelopePhase = 'release';
      voice.releaseTime = currentTime;
    }
  }

  /**
   * Set parameter
   */
  private setParameter(voiceId: number, parameter: keyof Voice, value: number | string): void {
    const voice = this.voices.get(voiceId);
    if (voice) {
      // Type-safe parameter setting
      if (typeof value === 'string' && parameter === 'waveform') {
        voice[parameter] = value as WaveformType;
      } else if (typeof value === 'number') {
        (voice as Record<string, number>)[parameter] = value;
      }
    }
  }

  /**
   * Stop all voices
   */
  private stopAll(): void {
    this.voices.clear();
  }

  /**
   * Generate oscillator sample
   */
  private generateOscillator(voice: Voice, sampleRate: number): number {
    const phaseIncrement = voice.frequency / sampleRate;
    let sample = 0;
    
    switch (voice.waveform) {
      case 'sine':
        sample = Math.sin(voice.phase * 2 * Math.PI);
        break;
      case 'square':
        sample = voice.phase < 0.5 ? 1 : -1;
        break;
      case 'sawtooth':
        sample = 2 * (voice.phase - Math.floor(voice.phase + 0.5));
        break;
      case 'triangle':
        sample = 4 * Math.abs(voice.phase - Math.floor(voice.phase + 0.5)) - 1;
        break;
      default:
        sample = Math.sin(voice.phase * 2 * Math.PI);
    }
    
    // Update phase
    voice.phase += phaseIncrement;
    if (voice.phase >= 1.0) {
      voice.phase -= 1.0;
    }
    
    return sample;
  }

  /**
   * Update envelope
   */
  private updateEnvelope(voice: Voice, sampleRate: number): number {
    const dt = 1.0 / sampleRate;
    const now = currentTime;
    const elapsed = now - voice.startTime;
    
    switch (voice.envelopePhase) {
      case 'attack':
        if (elapsed < voice.attackTime) {
          voice.envelopeValue = elapsed / voice.attackTime;
        } else {
          voice.envelopeValue = 1.0;
          voice.envelopePhase = 'decay';
          voice.startTime = now; // Reset for decay
        }
        break;
        
      case 'decay':
        const decayElapsed = now - voice.startTime;
        if (decayElapsed < voice.decayTime) {
          const t = decayElapsed / voice.decayTime;
          voice.envelopeValue = 1.0 - (1.0 - voice.sustainLevel) * t;
        } else {
          voice.envelopeValue = voice.sustainLevel;
          voice.envelopePhase = 'sustain';
        }
        break;
        
      case 'sustain':
        voice.envelopeValue = voice.sustainLevel;
        break;
        
      case 'release':
        if (voice.releaseTime !== null) {
          const releaseElapsed = now - voice.releaseTime;
          if (releaseElapsed < voice.releaseTimeParam) {
            const t = releaseElapsed / voice.releaseTimeParam;
            voice.envelopeValue = voice.sustainLevel * (1.0 - t);
          } else {
            voice.envelopeValue = 0;
            return 0; // Voice finished
          }
        }
        break;
    }
    
    return voice.envelopeValue;
  }

  /**
   * Process audio (called by AudioWorklet system)
   */
  process(inputs: Float32Array[][], outputs: Float32Array[][], _parameters: Record<string, Float32Array>): boolean {
    const output = outputs[0];
    if (!output || output.length === 0) {
      return true;
    }

    const channelCount = output.length;
    const frameCount = output[0]?.length ?? 0;
    const sampleRate = sampleRate ?? 44100; // Fallback if not available
    
    // Clear output
    for (let channel = 0; channel < channelCount; channel++) {
      const channelData = output[channel];
      if (channelData) {
        channelData.fill(0);
      }
    }
    
    // Process each voice
    const voicesToRemove: number[] = [];
    
    for (const [voiceId, voice] of this.voices.entries()) {
      // Update envelope
      const envelope = this.updateEnvelope(voice, sampleRate);
      
      if (envelope <= 0 && voice.envelopePhase === 'release') {
        voicesToRemove.push(voiceId);
        continue;
      }
      
      // Generate oscillator sample
      const oscSample = this.generateOscillator(voice, sampleRate);
      
      // Apply envelope and velocity
      const sample = oscSample * envelope * voice.velocity;
      
      // Denormal prevention
      const finalSample = sample + this.denormalPrevention;
      
      // Write to all output channels
      for (let channel = 0; channel < channelCount; channel++) {
        const channelData = output[channel];
        if (channelData) {
          for (let i = 0; i < frameCount; i++) {
            channelData[i] += finalSample;
          }
        }
      }
    }
    
    // Remove finished voices
    voicesToRemove.forEach(id => this.voices.delete(id));
    
    // Keep processor alive if there are voices or if we expect more
    return true;
  }
}

// Register processor
registerProcessor('simple-synth-processor', SimpleSynthProcessor);

