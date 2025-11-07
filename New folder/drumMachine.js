// Premium HD Drum Machine Module
class DrumMachine {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.samples = {};
    this.isLoaded = false;
    this.masterVolume = 0.8;
    this.effects = {
      compression: { enabled: true, threshold: -20, ratio: 4, attack: 0.003, release: 0.25 },
      reverb: { enabled: true, wet: 0.15, decay: 1.5, preDelay: 0.01 },
      eq: { enabled: true, low: 1.2, mid: 1.0, high: 1.1 }
    };
    
    this.drumKits = {
      'Studio HD': this.createStudioHDKit(),
      'Electronic Pro': this.createElectronicProKit(),
      'Acoustic Premium': this.createAcousticPremiumKit(),
      '808 Vintage': this.create808VintageKit()
    };
    
    this.currentKit = 'Studio HD';
    this.init();
  }

  async init() {
    await this.loadSamples();
    this.setupEffectsChain();
    this.isLoaded = true;
    console.log('Premium Drum Machine initialized');
  }

  setupEffectsChain() {
    // Master compressor
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = this.effects.compression.threshold;
    this.compressor.ratio.value = this.effects.compression.ratio;
    this.compressor.attack.value = this.effects.compression.attack;
    this.compressor.release.value = this.effects.compression.release;
    this.compressor.knee.value = 10;

    // Master EQ
    this.lowEQ = this.audioContext.createBiquadFilter();
    this.lowEQ.type = 'lowshelf';
    this.lowEQ.frequency.value = 250;
    this.lowEQ.gain.value = this.effects.eq.low;

    this.midEQ = this.audioContext.createBiquadFilter();
    this.midEQ.type = 'peaking';
    this.midEQ.frequency.value = 1000;
    this.midEQ.Q.value = 1;
    this.midEQ.gain.value = this.effects.eq.mid;

    this.highEQ = this.audioContext.createBiquadFilter();
    this.highEQ.type = 'highshelf';
    this.highEQ.frequency.value = 4000;
    this.highEQ.gain.value = this.effects.eq.high;

    // Master reverb
    this.reverb = this.audioContext.createConvolver();
    this.createReverbImpulse();

    this.wetGain = this.audioContext.createGain();
    this.wetGain.gain.value = this.effects.reverb.wet;
    
    this.dryGain = this.audioContext.createGain();
    this.dryGain.gain.value = 1 - this.effects.reverb.wet;

    // Master volume
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this.masterVolume;

    // Connect effects chain
    this.compressor.connect(this.lowEQ);
    this.lowEQ.connect(this.midEQ);
    this.midEQ.connect(this.highEQ);
    this.highEQ.connect(this.dryGain);
    this.highEQ.connect(this.reverb);
    this.reverb.connect(this.wetGain);
    this.dryGain.connect(this.masterGain);
    this.wetGain.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
  }

  createReverbImpulse() {
    const length = this.audioContext.sampleRate * this.effects.reverb.decay;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const progress = i / length;
        // Exponential decay with some randomness
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - progress, 2) * Math.exp(-progress * 8);
      }
    }
    
    this.reverb.buffer = impulse;
  }

  createStudioHDKit() {
    return {
      // Punchy 909-style kick with modern processing
      kick: { type: 'synthetic', frequency: 45, decay: 0.5, click: 0.4, punch: 0.95, sub: 0.7, distortion: 0.3, compression: 0.8 },
      // Ultra HD snare with crisp attack and body
      snare: { type: 'synthetic', frequency: 200, noise: 0.85, tone: 0.7, decay: 0.25, snap: 0.9, body: 0.8, crisp: 0.9 },
      // Modern hi-hat with enhanced brightness and transient
      hihat: { type: 'synthetic', frequency: 12000, noise: 0.95, decay: 0.06, brightness: 0.9, transient: 0.8, air: 0.7 },
      // Layered clap with modern stereo imaging
      clap: { type: 'synthetic', frequency: 600, noise: 0.9, decay: 0.18, layers: 5, stereo: 0.8, snap: 0.9 },
      // Punchy tom with enhanced attack
      tom: { type: 'synthetic', frequency: 100, decay: 0.4, tone: 0.8, attack: 0.7, body: 0.9 },
      // Bright crash with long sustain
      crash: { type: 'synthetic', frequency: 500, noise: 0.9, decay: 3.0, brightness: 0.95, sustain: 0.8, shimmer: 0.7 },
      // Defined ride with clear ping
      ride: { type: 'synthetic', frequency: 800, noise: 0.8, decay: 2.5, ping: 0.9, definition: 0.8, metallic: 0.7 }
    };
  }

  createElectronicProKit() {
    return {
      kick: { type: 'synthetic', frequency: 50, decay: 0.6, click: 0.3, punch: 0.9, sub: 0.5 },
      snare: { type: 'synthetic', frequency: 200, noise: 0.8, tone: 0.4, decay: 0.4, snap: 0.9 },
      hihat: { type: 'synthetic', frequency: 10000, noise: 0.95, decay: 0.05, brightness: 0.8 },
      clap: { type: 'synthetic', frequency: 600, noise: 0.85, decay: 0.15, layers: 4 },
      tom: { type: 'synthetic', frequency: 100, decay: 0.6, tone: 0.7 },
      crash: { type: 'synthetic', frequency: 500, noise: 0.9, decay: 1.8, brightness: 0.95 },
      ride: { type: 'synthetic', frequency: 800, noise: 0.8, decay: 2.0, ping: 0.9 }
    };
  }

  createAcousticPremiumKit() {
    return {
      kick: { type: 'synthetic', frequency: 80, decay: 0.3, click: 0.1, punch: 0.6, body: 0.8 },
      snare: { type: 'synthetic', frequency: 150, noise: 0.6, tone: 0.8, decay: 0.25, snap: 0.7 },
      hihat: { type: 'synthetic', frequency: 6000, noise: 0.8, decay: 0.12, brightness: 0.6 },
      clap: { type: 'synthetic', frequency: 400, noise: 0.7, decay: 0.25, layers: 2 },
      tom: { type: 'synthetic', frequency: 140, decay: 0.4, tone: 0.8 },
      crash: { type: 'synthetic', frequency: 300, noise: 0.7, decay: 2.5, brightness: 0.8 },
      ride: { type: 'synthetic', frequency: 500, noise: 0.6, decay: 3.0, ping: 0.7 }
    };
  }

  create808VintageKit() {
    return {
      kick: { type: 'synthetic', frequency: 40, decay: 0.8, click: 0.4, punch: 0.3, sub: 0.9 },
      snare: { type: 'synthetic', frequency: 220, noise: 0.9, tone: 0.3, decay: 0.5, snap: 0.6 },
      hihat: { type: 'synthetic', frequency: 12000, noise: 0.85, decay: 0.15, brightness: 0.5 },
      clap: { type: 'synthetic', frequency: 700, noise: 0.9, decay: 0.3, layers: 5 },
      tom: { type: 'synthetic', frequency: 80, decay: 0.7, tone: 0.5 },
      crash: { type: 'synthetic', frequency: 600, noise: 0.6, decay: 1.2, brightness: 0.7 },
      ride: { type: 'synthetic', frequency: 900, noise: 0.7, decay: 1.8, ping: 0.6 }
    };
  }

  async loadSamples() {
    // In a real implementation, this would load actual sample files
    // For now, we'll use synthesized sounds with premium quality
    console.log('Loading premium drum samples...');
    
    // Create sample buffers for each drum type
    const sampleRate = this.audioContext.sampleRate;
    
    // Generate high-quality kick sample
    const kickBuffer = this.generateKickSample(this.drumKits[this.currentKit].kick);
    this.samples.kick = kickBuffer;
    
    // Generate premium snare sample
    const snareBuffer = this.generateSnareSample(this.drumKits[this.currentKit].snare);
    this.samples.snare = snareBuffer;
    
    // Generate crisp hi-hat sample
    const hihatBuffer = this.generateHiHatSample(this.drumKits[this.currentKit].hihat);
    this.samples.hihat = hihatBuffer;
    
    // Generate realistic clap sample
    const clapBuffer = this.generateClapSample(this.drumKits[this.currentKit].clap);
    this.samples.clap = clapBuffer;
    
    // Generate tom sample
    const tomBuffer = this.generateTomSample(this.drumKits[this.currentKit].tom);
    this.samples.tom = tomBuffer;
    
    // Generate crash sample
    const crashBuffer = this.generateCrashSample(this.drumKits[this.currentKit].crash);
    this.samples.crash = crashBuffer;
    
    // Generate ride sample
    const rideBuffer = this.generateRideSample(this.drumKits[this.currentKit].ride);
    this.samples.ride = rideBuffer;
    
    console.log('Premium drum samples loaded successfully');
  }

  generateKickSample(params) {
    const duration = params.decay * 2;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // Main kick tone with pitch envelope
        const frequency = params.frequency * Math.exp(-progress * 8);
        const tone = Math.sin(2 * Math.PI * frequency * t) * Math.exp(-progress * 6);
        
        // Click at the beginning
        const click = Math.random() * 2 - 1;
        const clickEnv = Math.exp(-t * 100) * params.click;
        
        // Sub bass component
        const sub = Math.sin(2 * Math.PI * params.frequency * 0.5 * t) * Math.exp(-progress * 4) * (params.sub || 0.3);
        
        // Combine components
        data[i] = (tone * 0.7 + click * clickEnv * 0.3 + sub * 0.4) * params.punch;
        
        // Apply final envelope
        data[i] *= Math.exp(-progress * 4);
      }
    }
    
    return buffer;
  }

  generateSnareSample(params) {
    const duration = params.decay * 2;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // Snare body tone
        const bodyFreq = params.frequency * Math.exp(-progress * 4);
        const body = Math.sin(2 * Math.PI * bodyFreq * t) * params.tone * Math.exp(-progress * 8);
        
        // Noise component for the snare rattle
        const noise = (Math.random() * 2 - 1) * params.noise;
        const noiseEnv = Math.exp(-progress * 12);
        
        // Sharp snap at the beginning
        const snap = Math.random() * 2 - 1;
        const snapEnv = Math.exp(-t * 200) * params.snap;
        
        // Combine components
        data[i] = (body * 0.6 + noise * noiseEnv * 0.4 + snap * snapEnv * 0.2);
        
        // Apply final envelope
        data[i] *= Math.exp(-progress * 6);
      }
    }
    
    return buffer;
  }

  generateHiHatSample(params) {
    const duration = params.decay;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // High-frequency noise with bandpass characteristics
        const noise = (Math.random() * 2 - 1) * params.noise;
        
        // Some tonal content for metallic character
        const tone = Math.sin(2 * Math.PI * params.frequency * t) * 0.1 * params.brightness;
        
        // Fast attack, quick decay envelope
        const env = Math.exp(-progress * 20);
        
        data[i] = (noise + tone) * env;
      }
    }
    
    return buffer;
  }

  generateClapSample(params) {
    const duration = params.decay;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // Multiple clap layers with slight timing offsets
        let clap = 0;
        for (let layer = 0; layer < params.layers; layer++) {
          const layerOffset = layer * 0.002; // Small timing offset between layers
          const layerTime = Math.max(0, t - layerOffset);
          const layerProgress = layerTime / duration;
          
          if (layerTime >= 0) {
            const layerNoise = (Math.random() * 2 - 1) * params.noise;
            const layerEnv = Math.exp(-layerProgress * 15) * (1 - layer * 0.2);
            clap += layerNoise * layerEnv;
          }
        }
        
        // Some body tone
        const body = Math.sin(2 * Math.PI * params.frequency * t) * 0.2 * Math.exp(-progress * 10);
        
        data[i] = (clap + body) / params.layers;
        data[i] *= Math.exp(-progress * 8);
      }
    }
    
    return buffer;
  }

  generateTomSample(params) {
    const duration = params.decay;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // Tom tone with pitch decay
        const frequency = params.frequency * Math.exp(-progress * 3);
        const tone = Math.sin(2 * Math.PI * frequency * t) * params.tone;
        
        // Some noise for attack
        const noise = (Math.random() * 2 - 1) * 0.1 * Math.exp(-t * 100);
        
        data[i] = (tone + noise) * Math.exp(-progress * 4);
      }
    }
    
    return buffer;
  }

  generateCrashSample(params) {
    const duration = params.decay;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // Metallic noise with strong high-frequency content
        const noise = (Math.random() * 2 - 1) * params.noise;
        
        // Some harmonic content for metallic ring
        const harmonics = Math.sin(2 * Math.PI * params.frequency * t) * 0.3 +
                         Math.sin(2 * Math.PI * params.frequency * 2 * t) * 0.2 +
                         Math.sin(2 * Math.PI * params.frequency * 3 * t) * 0.1;
        
        const env = Math.exp(-progress * 2) * params.brightness;
        
        data[i] = (noise * 0.7 + harmonics * 0.3) * env;
      }
    }
    
    return buffer;
  }

  generateRideSample(params) {
    const duration = params.decay;
    const buffer = this.audioContext.createBuffer(2, duration * this.audioContext.sampleRate, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / this.audioContext.sampleRate;
        const progress = t / duration;
        
        // Ride has more defined pitch than crash
        const fundamental = Math.sin(2 * Math.PI * params.frequency * t) * params.ping;
        const harmonics = Math.sin(2 * Math.PI * params.frequency * 2 * t) * 0.3 +
                         Math.sin(2 * Math.PI * params.frequency * 3 * t) * 0.2;
        
        // Some noise for stick definition
        const noise = (Math.random() * 2 - 1) * params.noise * 0.2 * Math.exp(-t * 50);
        
        const env = Math.exp(-progress * 1.5);
        
        data[i] = (fundamental + harmonics + noise) * env;
      }
    }
    
    return buffer;
  }

  playDrum(drumType, velocity = 1.0) {
    if (!this.isLoaded || !this.samples[drumType]) {
      console.warn(`Drum sample not loaded: ${drumType}`);
      return;
    }

    const buffer = this.samples[drumType];
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = velocity;

    // Connect to effects chain
    source.connect(gainNode);
    gainNode.connect(this.compressor);

    source.start();
    
    // Clean up after playback
    source.onended = () => {
      gainNode.disconnect();
    };
  }

  setKit(kitName) {
    if (this.drumKits[kitName]) {
      this.currentKit = kitName;
      this.loadSamples(); // Regenerate samples with new kit parameters
      console.log(`Switched to drum kit: ${kitName}`);
    }
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  setEffect(effect, value) {
    if (this.effects[effect]) {
      this.effects[effect] = { ...this.effects[effect], ...value };
      this.updateEffects();
    }
  }

  updateEffects() {
    if (this.compressor) {
      this.compressor.threshold.value = this.effects.compression.threshold;
      this.compressor.ratio.value = this.effects.compression.ratio;
      this.compressor.attack.value = this.effects.compression.attack;
      this.compressor.release.value = this.effects.compression.release;
    }

    if (this.lowEQ) this.lowEQ.gain.value = this.effects.eq.low;
    if (this.midEQ) this.midEQ.gain.value = this.effects.eq.mid;
    if (this.highEQ) this.highEQ.gain.value = this.effects.eq.high;

    if (this.wetGain) this.wetGain.gain.value = this.effects.reverb.wet;
    if (this.dryGain) this.dryGain.gain.value = 1 - this.effects.reverb.wet;
  }

  // Method to get available drum types
  getAvailableDrums() {
    return Object.keys(this.samples);
  }

  // Method to get available kits
  getAvailableKits() {
    return Object.keys(this.drumKits);
  }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DrumMachine };
}
