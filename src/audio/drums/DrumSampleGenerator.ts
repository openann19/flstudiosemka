/**
 * DrumSampleGenerator - Professional 909-style drum sample generator
 * Generates authentic techno drum sounds using Web Audio API
 * @module audio/drums/DrumSampleGenerator
 */

/**
 * Drum sample metadata
 */
export interface DrumSampleMetadata {
  name: string;
  type: 'kick' | 'snare' | 'hihat' | 'openhat' | 'crash' | 'ride' | 'rimshot' | 'clap';
  category: string;
  velocity?: 'soft' | 'medium' | 'hard';
  description?: string;
}

/**
 * Generated drum sample with metadata
 */
export interface GeneratedDrumSample {
  metadata: DrumSampleMetadata;
  buffer: AudioBuffer;
}

/**
 * Professional 909-style drum sample generator
 */
export class DrumSampleGenerator {
  private audioContext: AudioContext;
  private sampleRate: number;

  /**
   * Create a new DrumSampleGenerator
   * @param audioContext - Web Audio API AudioContext
   */
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.sampleRate = audioContext.sampleRate;
  }

  /**
   * Generate all 909 drum samples
   * @returns Array of generated drum samples with metadata
   */
  generateAllSamples(): GeneratedDrumSample[] {
    const samples: GeneratedDrumSample[] = [];

    // Generate kicks (10+ variations)
    samples.push(...this.generateKicks());
    
    // Generate snares (10+ variations)
    samples.push(...this.generateSnares());
    
    // Generate hi-hats (8+ variations)
    samples.push(...this.generateHiHats());
    
    // Generate crashes (5+ variations)
    samples.push(...this.generateCrashes());
    
    // Generate rides (5+ variations)
    samples.push(...this.generateRides());
    
    // Generate rimshots (5+ variations)
    samples.push(...this.generateRimshots());
    
    // Generate claps (5+ variations)
    samples.push(...this.generateClaps());

    return samples;
  }

  /**
   * Generate kick drum variations
   */
  private generateKicks(): GeneratedDrumSample[] {
    const kicks: GeneratedDrumSample[] = [];

    // Deep 909 Kick
    kicks.push({
      metadata: { name: 'Deep 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 50, decay: 0.3, punch: 0.8 }),
    });

    // Punchy 909 Kick
    kicks.push({
      metadata: { name: 'Punchy 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 60, decay: 0.15, punch: 1.0 }),
    });

    // Short 909 Kick
    kicks.push({
      metadata: { name: 'Short 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 65, decay: 0.1, punch: 0.9 }),
    });

    // Long 909 Kick
    kicks.push({
      metadata: { name: 'Long 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 55, decay: 0.5, punch: 0.7 }),
    });

    // Sub 909 Kick
    kicks.push({
      metadata: { name: 'Sub 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 40, decay: 0.4, punch: 0.6 }),
    });

    // Tight 909 Kick
    kicks.push({
      metadata: { name: 'Tight 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 70, decay: 0.08, punch: 1.1 }),
    });

    // Fat 909 Kick
    kicks.push({
      metadata: { name: 'Fat 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 52, decay: 0.35, punch: 0.85 }),
    });

    // Hard 909 Kick
    kicks.push({
      metadata: { name: 'Hard 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 58, decay: 0.12, punch: 1.2 }),
    });

    // Soft 909 Kick
    kicks.push({
      metadata: { name: 'Soft 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 62, decay: 0.25, punch: 0.65 }),
    });

    // Classic 909 Kick
    kicks.push({
      metadata: { name: 'Classic 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 57, decay: 0.2, punch: 0.95 }),
    });

    // Techno 909 Kick
    kicks.push({
      metadata: { name: 'Techno 909', type: 'kick', category: 'Kicks' },
      buffer: this.generateKick({ pitch: 54, decay: 0.28, punch: 0.9 }),
    });

    return kicks;
  }

  /**
   * Generate kick drum
   */
  generateKick(params: { pitch: number; decay: number; punch: number }): AudioBuffer {
    const duration = 0.5;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    const attackTime = 0.001;
    const decayTime = params.decay;
    const sustainLevel = 0.1;
    const releaseTime = 0.1;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      let sample = 0;

      // Main sine wave with pitch envelope
      const pitchEnv = Math.exp(-t * 8);
      const freq = params.pitch * (1 + pitchEnv * 2);
      const phase = (freq * t * Math.PI * 2) % (Math.PI * 2);
      sample += Math.sin(phase) * params.punch;

      // Add harmonics for punch
      sample += Math.sin(phase * 2) * 0.3 * params.punch;
      sample += Math.sin(phase * 3) * 0.15 * params.punch;

      // Envelope
      let envelope = 1.0;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else if (t < attackTime + decayTime) {
        envelope = 1.0 - ((t - attackTime) / decayTime) * (1.0 - sustainLevel);
      } else if (t < attackTime + decayTime + releaseTime) {
        const releaseProgress = (t - attackTime - decayTime) / releaseTime;
        envelope = sustainLevel * (1.0 - releaseProgress);
      } else {
        envelope = 0;
      }

      // Slight saturation for character
      sample = Math.tanh(sample * 1.2) * envelope;
      data[i] = sample;
    }

    return buffer;
  }

  /**
   * Generate snare drum variations
   */
  private generateSnares(): GeneratedDrumSample[] {
    const snares: GeneratedDrumSample[] = [];

    // Fat 909 Snare
    snares.push({
      metadata: { name: 'Fat 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 200, noise: 0.7, decay: 0.2 }),
    });

    // Tight 909 Snare
    snares.push({
      metadata: { name: 'Tight 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 250, noise: 0.6, decay: 0.12 }),
    });

    // Crisp 909 Snare
    snares.push({
      metadata: { name: 'Crisp 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 300, noise: 0.8, decay: 0.15 }),
    });

    // Reverb 909 Snare
    snares.push({
      metadata: { name: 'Reverb 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 220, noise: 0.65, decay: 0.4 }),
    });

    // Hard 909 Snare
    snares.push({
      metadata: { name: 'Hard 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 280, noise: 0.75, decay: 0.1 }),
    });

    // Soft 909 Snare
    snares.push({
      metadata: { name: 'Soft 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 180, noise: 0.55, decay: 0.25 }),
    });

    // Classic 909 Snare
    snares.push({
      metadata: { name: 'Classic 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 210, noise: 0.68, decay: 0.18 }),
    });

    // Punchy 909 Snare
    snares.push({
      metadata: { name: 'Punchy 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 240, noise: 0.72, decay: 0.14 }),
    });

    // Long 909 Snare
    snares.push({
      metadata: { name: 'Long 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 200, noise: 0.7, decay: 0.35 }),
    });

    // Short 909 Snare
    snares.push({
      metadata: { name: 'Short 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 260, noise: 0.65, decay: 0.08 }),
    });

    // Techno 909 Snare
    snares.push({
      metadata: { name: 'Techno 909', type: 'snare', category: 'Snares' },
      buffer: this.generateSnare({ tone: 230, noise: 0.7, decay: 0.16 }),
    });

    return snares;
  }

  /**
   * Generate snare drum
   */
  generateSnare(params: { tone: number; noise: number; decay: number }): AudioBuffer {
    const duration = 0.3;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    const attackTime = 0.001;
    const decayTime = params.decay;
    const releaseTime = 0.05;

    // Random seed for noise
    let noiseSeed = Math.random() * 1000;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      let sample = 0;

      // Tone component (sine wave)
      const toneFreq = params.tone;
      const tonePhase = (toneFreq * t * Math.PI * 2) % (Math.PI * 2);
      const toneEnv = Math.exp(-t * 15);
      sample += Math.sin(tonePhase) * toneEnv * (1 - params.noise);

      // Noise component
      noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
      const noise = (noiseSeed / 233280) * 2 - 1;
      const noiseEnv = Math.exp(-t * 8);
      sample += noise * params.noise * noiseEnv;

      // Envelope
      let envelope = 1.0;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else if (t < attackTime + decayTime) {
        envelope = Math.exp(-(t - attackTime) * 8);
      } else if (t < attackTime + decayTime + releaseTime) {
        const releaseProgress = (t - attackTime - decayTime) / releaseTime;
        envelope = Math.exp(-(t - attackTime) * 8) * (1.0 - releaseProgress);
      } else {
        envelope = 0;
      }

      sample *= envelope;
      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Generate hi-hat variations
   */
  private generateHiHats(): GeneratedDrumSample[] {
    const hihats: GeneratedDrumSample[] = [];

    // Closed Hi-Hat
    hihats.push({
      metadata: { name: 'Closed HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 8000, decay: 0.05, brightness: 0.8 }),
    });

    // Open Hi-Hat
    hihats.push({
      metadata: { name: 'Open HH', type: 'openhat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 6000, decay: 0.2, brightness: 0.7 }),
    });

    // Pedal Hi-Hat
    hihats.push({
      metadata: { name: 'Pedal HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 4000, decay: 0.08, brightness: 0.5 }),
    });

    // Shaker Hi-Hat
    hihats.push({
      metadata: { name: 'Shaker HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 7000, decay: 0.12, brightness: 0.75 }),
    });

    // Bright Hi-Hat
    hihats.push({
      metadata: { name: 'Bright HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 9000, decay: 0.06, brightness: 0.9 }),
    });

    // Dark Hi-Hat
    hihats.push({
      metadata: { name: 'Dark HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 5000, decay: 0.1, brightness: 0.6 }),
    });

    // Short Hi-Hat
    hihats.push({
      metadata: { name: 'Short HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 7500, decay: 0.03, brightness: 0.85 }),
    });

    // Long Hi-Hat
    hihats.push({
      metadata: { name: 'Long HH', type: 'hihat', category: 'HiHats' },
      buffer: this.generateHiHat({ pitch: 6500, decay: 0.25, brightness: 0.7 }),
    });

    return hihats;
  }

  /**
   * Generate hi-hat
   */
  generateHiHat(params: { pitch: number; decay: number; brightness: number }): AudioBuffer {
    const duration = 0.2;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    const attackTime = 0.001;
    const decayTime = params.decay;

    // Random seed for noise
    let noiseSeed = Math.random() * 1000;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      
      // Generate noise
      noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
      let sample = (noiseSeed / 233280) * 2 - 1;

      // High-pass filter simulation (brightness)
      const cutoff = params.pitch * params.brightness;
      // Simple high-pass approximation
      if (cutoff < this.sampleRate / 2) {
        const filterEnv = Math.exp(-t * 5);
        sample *= filterEnv;
      }

      // Envelope
      let envelope = 1.0;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else {
        envelope = Math.exp(-(t - attackTime) / decayTime);
      }

      sample *= envelope * 0.6;
      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Generate crash variations
   */
  private generateCrashes(): GeneratedDrumSample[] {
    const crashes: GeneratedDrumSample[] = [];

    for (let i = 1; i <= 5; i += 1) {
      crashes.push({
        metadata: { name: `Crash ${i}`, type: 'crash', category: 'Crashes' },
        buffer: this.generateCrash({ pitch: 3000 + i * 200, decay: 0.5 + i * 0.1 }),
      });
    }

    return crashes;
  }

  /**
   * Generate crash
   */
  generateCrash(params: { pitch: number; decay: number }): AudioBuffer {
    const duration = 1.0;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    const attackTime = 0.01;
    const decayTime = params.decay;

    // Random seed for noise
    let noiseSeed = Math.random() * 1000;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      
      // Generate noise with pitch filtering
      noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
      let sample = (noiseSeed / 233280) * 2 - 1;

      // Band-pass filter simulation
      const filterEnv = Math.exp(-t * 2);
      sample *= filterEnv;

      // Envelope
      let envelope = 1.0;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else {
        envelope = Math.exp(-(t - attackTime) / decayTime);
      }

      sample *= envelope * 0.5;
      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Generate ride variations
   */
  private generateRides(): GeneratedDrumSample[] {
    const rides: GeneratedDrumSample[] = [];

    for (let i = 1; i <= 5; i += 1) {
      rides.push({
        metadata: { name: `Ride ${i}`, type: 'ride', category: 'Rides' },
        buffer: this.generateRide({ pitch: 2000 + i * 150, decay: 0.8 + i * 0.1 }),
      });
    }

    return rides;
  }

  /**
   * Generate ride
   */
  generateRide(params: { pitch: number; decay: number }): AudioBuffer {
    const duration = 1.2;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    const attackTime = 0.005;
    const decayTime = params.decay;

    // Random seed for noise
    let noiseSeed = Math.random() * 1000;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      
      // Generate noise with pitch filtering
      noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
      let sample = (noiseSeed / 233280) * 2 - 1;

      // Band-pass filter simulation
      const filterEnv = Math.exp(-t * 1.5);
      sample *= filterEnv;

      // Envelope
      let envelope = 1.0;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else {
        envelope = Math.exp(-(t - attackTime) / decayTime);
      }

      sample *= envelope * 0.4;
      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Generate rimshot variations
   */
  private generateRimshots(): GeneratedDrumSample[] {
    const rimshots: GeneratedDrumSample[] = [];

    for (let i = 1; i <= 5; i += 1) {
      rimshots.push({
        metadata: { name: `Rimshot ${i}`, type: 'rimshot', category: 'Rimshots' },
        buffer: this.generateRimshot({ tone: 800 + i * 50, decay: 0.1 + i * 0.02 }),
      });
    }

    return rimshots;
  }

  /**
   * Generate rimshot
   */
  generateRimshot(params: { tone: number; decay: number }): AudioBuffer {
    const duration = 0.15;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    const attackTime = 0.001;
    const decayTime = params.decay;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      
      // Tone component
      const toneFreq = params.tone;
      const tonePhase = (toneFreq * t * Math.PI * 2) % (Math.PI * 2);
      const toneEnv = Math.exp(-t * 20);
      let sample = Math.sin(tonePhase) * toneEnv;

      // Add noise component
      const noise = (Math.random() * 2 - 1) * 0.3;
      sample += noise * Math.exp(-t * 15);

      // Envelope
      let envelope = 1.0;
      if (t < attackTime) {
        envelope = t / attackTime;
      } else {
        envelope = Math.exp(-(t - attackTime) / decayTime);
      }

      sample *= envelope;
      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Generate clap variations
   */
  private generateClaps(): GeneratedDrumSample[] {
    const claps: GeneratedDrumSample[] = [];

    for (let i = 1; i <= 5; i += 1) {
      claps.push({
        metadata: { name: `Clap ${i}`, type: 'clap', category: 'Claps' },
        buffer: this.generateClap({ delay: 0.01 + i * 0.005, decay: 0.15 + i * 0.02 }),
      });
    }

    return claps;
  }

  /**
   * Generate clap
   */
  generateClap(params: { delay: number; decay: number }): AudioBuffer {
    const duration = 0.3;
    const length = Math.floor(this.sampleRate * duration);
    const buffer = this.audioContext.createBuffer(1, length, this.sampleRate);
    const data = buffer.getChannelData(0);

    // Random seed for noise
    let noiseSeed = Math.random() * 1000;

    for (let i = 0; i < length; i += 1) {
      const t = i / this.sampleRate;
      
      // Generate noise
      noiseSeed = (noiseSeed * 9301 + 49297) % 233280;
      let sample = (noiseSeed / 233280) * 2 - 1;

      // Multiple delay taps for clap effect
      const delay1 = Math.floor(params.delay * this.sampleRate);
      const delay2 = Math.floor(params.delay * 1.5 * this.sampleRate);
      const delay3 = Math.floor(params.delay * 2 * this.sampleRate);

      if (i >= delay1) {
        const delayedSample = data[i - delay1] || 0;
        sample += delayedSample * 0.3;
      }
      if (i >= delay2) {
        const delayedSample = data[i - delay2] || 0;
        sample += delayedSample * 0.2;
      }
      if (i >= delay3) {
        const delayedSample = data[i - delay3] || 0;
        sample += delayedSample * 0.1;
      }

      // Band-pass filter
      const filterEnv = Math.exp(-t * 5);
      sample *= filterEnv;

      // Envelope
      const envelope = Math.exp(-t / params.decay);
      sample *= envelope * 0.7;

      data[i] = Math.max(-1, Math.min(1, sample));
    }

    return buffer;
  }

  /**
   * Convert AudioBuffer to WAV format (base64)
   */
  static audioBufferToWav(buffer: AudioBuffer): string {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string): void => {
      for (let i = 0; i < string.length; i += 1) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i += 1) {
      for (let channel = 0; channel < numberOfChannels; channel += 1) {
        const channelData = buffer.getChannelData(channel);
        const sampleValue = channelData[i];
        if (sampleValue === undefined) {
          continue;
        }
        const sample = Math.max(-1, Math.min(1, sampleValue));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }

    // Convert to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      const byte = bytes[i];
      if (byte === undefined) {
        continue;
      }
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
}

