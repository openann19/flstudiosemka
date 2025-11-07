(() => {
  'use strict';

  const NOTE_INDEX = Object.freeze(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']);

  const SCALE_PATTERNS = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    blues: [0, 3, 5, 6, 7, 10],
    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;
  const midiToFreq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const freqToMidi = (freq) => 69 + 12 * Math.log2(freq / 440);
  const wrapSemitone = (value) => ((value % 12) + 12) % 12;

  function nearestScaleFreq(frequency, key = 'C', scale = 'minor') {
    if (!frequency || frequency <= 0 || !Number.isFinite(frequency)) {
      return null;
    }

    const baseIndex = NOTE_INDEX.indexOf(key.toUpperCase());
    const pattern = SCALE_PATTERNS[scale] || SCALE_PATTERNS.minor;
    if (baseIndex === -1) {
      return frequency;
    }

    const allowed = pattern.map((step) => wrapSemitone(baseIndex + step));
    const currentMidi = freqToMidi(frequency);
    let bestMidi = Math.round(currentMidi);
    let bestDistance = Infinity;

    for (let offset = -24; offset <= 24; offset += 1) {
      const candidate = Math.round(currentMidi) + offset;
      if (allowed.includes(wrapSemitone(candidate))) {
        const distance = Math.abs(candidate - currentMidi);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestMidi = candidate;
        }
      }
    }

    return midiToFreq(bestMidi);
  }

  function yinPitch(buffer, sampleRate, enhanced = false) {
    const threshold = enhanced ? 0.05 : 0.1;
    const yinLength = Math.floor(buffer.length / 2);
    if (yinLength < 16) return null;

    const yin = new Float32Array(yinLength);
    let runningSum = 0;

    for (let tau = 1; tau < yinLength; tau += 1) {
      let sum = 0;
      for (let i = 0; i < yinLength; i += 1) {
        const delta = buffer[i] - buffer[i + tau];
        sum += delta * delta;
      }
      yin[tau] = sum;
      runningSum += sum;
      if (tau > 0) {
        yin[tau] *= tau / Math.max(runningSum, 1e-9);
        if (tau > 1 && yin[tau] < threshold) {
          while (tau + 1 < yinLength && yin[tau + 1] < yin[tau]) {
            tau += 1;
          }
          let frequency = sampleRate / tau;

          // Enhanced mode: apply additional smoothing and validation
          if (enhanced) {
            // Validate frequency range (human voice: 80-1000 Hz)
            if (frequency < 80 || frequency > 1000) {
              return null;
            }
            // Apply harmonic validation
            const harmonics = [2, 3, 4];
            let valid = true;
            for (const harmonic of harmonics) {
              const harmonicFreq = frequency * harmonic;
              if (harmonicFreq > sampleRate / 2) break;
              const harmonicTau = Math.round(sampleRate / harmonicFreq);
              if (harmonicTau < yinLength && yin[harmonicTau] > threshold * 1.5) {
                valid = false;
                break;
              }
            }
            if (!valid) return null;
          }

          return frequency;
        }
      }
    }

    return null;
  }

  async function loadPitchWorklet(ctx) {
    if (!ctx || !ctx.audioWorklet) {
      return false;
    }

    const code = `
      class GranularPitchShiftProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          const N = Math.max(1, Math.floor(sampleRate * 2));
          this.buf = new Float32Array(N);
          this.N = N;
          this.w = 0;
          this.rA = 0;
          this.rB = 1024;
          this.grain = 2048;
          this.ratio = 1.0;
          this.port.onmessage = (event) => {
            if (event.data && typeof event.data.ratio === 'number') {
              const value = event.data.ratio;
              this.ratio = Math.min(2.5, Math.max(0.4, value));
            }
          };
        }

        process(inputs, outputs) {
          const input = inputs[0];
          const output = outputs[0];
          if (!input || !input[0] || !output) {
            return true;
          }

          const inL = input[0];
          const inR = input[1] || input[0];
          const outL = output[0];
          const outR = output[1] || output[0];
          const { N, grain } = this;

          for (let i = 0; i < inL.length; i += 1) {
            this.buf[this.w] = 0.5 * (inL[i] + (inR[i] || 0));
            this.w = (this.w + 1) % N;

            const posA = Math.floor(this.rA) % N;
            const posB = Math.floor(this.rB) % N;
            const fracA = this.rA - Math.floor(this.rA);
            const fracB = this.rB - Math.floor(this.rB);

            const nextA = (posA + 1) % N;
            const nextB = (posB + 1) % N;

            const sA = this.buf[posA] + (this.buf[nextA] - this.buf[posA]) * fracA;
            const sB = this.buf[posB] + (this.buf[nextB] - this.buf[posB]) * fracB;

            const t = (i % grain) / grain;
            const wA = 0.5 * (1 - Math.cos(2 * Math.PI * t));
            const sample = sA * wA + sB * (1 - wA);

            outL[i] = sample;
            outR[i] = sample;

            const step = this.ratio;
            this.rA += step;
            this.rB += step;

            if ((i % grain) === 0) {
              this.rB = this.rA + grain / 2;
            }

            if (this.rA >= N) this.rA -= N;
            if (this.rB >= N) this.rB -= N;
          }

          return true;
        }
      }
      registerProcessor('granular-pitch-shift', GranularPitchShiftProcessor);
    `;

    const blob = new Blob([code], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    try {
      await ctx.audioWorklet.addModule(url);
      return true;
    } catch (error) {
      console.error('Failed to load pitch worklet', error);
      return false;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  class VocalStudio {
    constructor(flStudio) {
      this.flStudio = flStudio;
      this.ctx = flStudio ? flStudio.audioContext : null;
      this._audioUnlockUnsubscribe = null;

      // Premium service integration
      this.premiumService = window.premiumService || null;
      this._premiumUnsubscribe = null;

      this.mediaStream = null;
      this.mediaSrc = null;
      this.mediaRecorder = null;
      this.recChunks = [];
      this.recordedBlob = null;

      this.isRecording = false;
      this.isLiveRecording = false;
      this.liveRecordingBuffer = [];
      this.exportFormat = 'webm';
      this.monitorOn = true;
      this.pitchOn = true;
      this.doubleTrack = true;
      this.deEssOn = true;

      // Premium autotune features
      this.formantShift = 0;
      this.humanizeMode = false;
      this.humanizeAmount = 0.3;
      this.enhancedPitchDetection = false;

      this.targetKey = 'C';
      this.targetScale = 'minor';
      this.autotuneStrength = 0.8;
      this.pitchMs = 50;
      this.prevRatio = 1;
      this.externalBpm = this._sanitizeBpm(flStudio?.bpm ?? 140);

      this.reverbMixVal = 0.3;
      this.reverbDecay = 2.5;
      this.reverbPredelayMs = 20;

      this.delayBeats = 0.25;
      this.delayFb = 0.4;
      this.delayMixVal = 0.25;

      this.warmth = 0.5;
      this.air = 0.3;
      this.gateThresh = 0.02;
      this.gateHoldMs = 180;
      this._gateBelowSince = 0;

      this.doublerDepthMs = 0.008;
      this.doublerBaseMsL = 0.015;
      this.doublerBaseMsR = 0.022;

      this.inputGain = null;
      this.hpf = null;
      this.gateGain = null;
      this.comp = null;
      this.eqLow = null;
      this.eqHigh = null;
      this.pitchNode = null;
      this.coreBus = null;
      this.master = null;
      this.recDest = null;
      this.analyser = null;
      this.analyserTime = null;

      this.delay = null;
      this.delayFeedback = null;
      this.delayMix = null;
      this.reverb = null;
      this.reverbMix = null;

      this.doublerDelayL = null;
      this.doublerDelayR = null;
      this.doublerPanL = null;
      this.doublerPanR = null;
      this.doublerGain = null;
      this.doublerLFO1 = null;
      this.doublerLFO2 = null;

      this._recClockStart = 0;
      this._player = null;
      this._levelLoopId = null;
      this._pitchLoopTimer = null;
      this._pitchLoopActive = false;

      this._installStyles();
      this._installUI();
      this._buildChain();
      this._bindUI();
      this._restore();
      this._animMeters();
      this._initPremiumService();
      this.setFLStudio(flStudio);
    }

    _initPremiumService() {
      if (!this.premiumService && window.premiumService) {
        this.premiumService = window.premiumService;
      }

      if (this.premiumService) {
        this._premiumUnsubscribe = this.premiumService.onStateChange((state) => {
          this._updatePremiumUI(state.active);
        });
        this._updatePremiumUI(this.premiumService.isPremiumActive());
      }
    }

    _updatePremiumUI(isPremium) {
      const $ = (id) => document.getElementById(id);
      const toggle = $('vs-premium-toggle');
      const badge = $('vs-premium-badge');
      const toggleText = $('vs-premium-toggle-text');
      const formatSelector = $('vs-format-selector');

      if (toggle) {
        toggle.classList.toggle('active', isPremium);
        toggleText.textContent = isPremium ? 'PREMIUM ACTIVE' : 'ACTIVATE PREMIUM';
      }

      if (badge) {
        badge.style.display = isPremium ? 'inline-block' : 'none';
      }

      if (formatSelector) {
        formatSelector.style.display = isPremium ? 'flex' : 'none';
      }

      // Unlock/lock premium features
      const premiumFeatures = [
        'vs-premium-autotune',
        'vs-premium-humanize',
        'vs-premium-enhanced'
      ];

      premiumFeatures.forEach((featureId) => {
        const feature = $(featureId);
        if (feature) {
          if (isPremium) {
            feature.classList.remove('vocal-feature-locked');
            feature.style.pointerEvents = '';
            feature.style.opacity = '1';
          } else {
            feature.classList.add('vocal-feature-locked');
            feature.style.pointerEvents = 'none';
            feature.style.opacity = '0.5';
          }
        }
      });

      // Update waveform styling
      const waveform = document.getElementById('vs-wave')?.parentElement;
      if (waveform) {
        if (isPremium) {
          waveform.classList.add('vocal-waveform-premium');
        } else {
          waveform.classList.remove('vocal-waveform-premium');
        }
      }
    }

    _installStyles() {
      // Styles are now in styles.css using theme tokens
      // No need to inject styles dynamically
    }

    _installUI() {
      if (document.getElementById('vocal-studio-floating-btn')) {
        return;
      }

      const btn = document.createElement('button');
      btn.className = 'vocal-studio-btn';
      btn.id = 'vocal-studio-floating-btn';
      btn.textContent = '🎤';
      btn.title = 'Open Vocal Studio';
      document.body.appendChild(btn);

      const overlay = document.createElement('div');
      overlay.className = 'vocal-studio-overlay';
      overlay.id = 'vocal-studio-overlay';
      overlay.innerHTML = `
        <div class="vocal-studio-window" onclick="event.stopPropagation()">
          <div class="vocal-studio-header">
            <div class="vocal-studio-title">
              <span>🎤</span>
              <span>Vocal Studio Pro</span>
              <span class="vocal-premium-badge" id="vs-premium-badge" style="display:none;">PREMIUM</span>
            </div>
            <div class="vocal-header-controls">
              <button class="vocal-premium-toggle" id="vs-premium-toggle" title="Toggle Premium Features">
                <span id="vs-premium-toggle-text">ACTIVATE PREMIUM</span>
              </button>
              <button class="vocal-studio-close" id="vocal-studio-close">×</button>
            </div>
          </div>
          <div class="vocal-studio-content">
            <div class="vocal-waveform"><canvas id="vs-wave" width="800" height="150"></canvas></div>
            <button class="vocal-record-btn" id="vs-rec">
              <span class="vocal-record-icon" id="vs-rec-icon">⏺</span>
              <span id="vs-rec-text">Start Recording</span>
              <span class="vocal-record-time" id="vs-rec-time">00:00</span>
            </button>
            <div id="vs-live-rec-indicator" class="vocal-live-rec-indicator" style="display:none;">
              <span class="vocal-live-recording-indicator"></span>LIVE RECORDING ACTIVE
            </div>
            <div class="vocal-format-selector" id="vs-format-selector" style="display:none;">
              <span class="vocal-format-label">Export Format:</span>
              <button class="vocal-format-btn active" data-format="webm">WEBM</button>
              <button class="vocal-format-btn" data-format="wav">WAV</button>
              <button class="vocal-format-btn" data-format="mp3">MP3</button>
              <button class="vocal-format-btn" data-format="ogg">OGG</button>
            </div>
            <div class="vocal-control">
              <div class="vocal-label">Input Level</div>
              <div class="vocal-meter"><div class="vocal-meter-fill" id="vs-meter"></div></div>
            </div>
            <div class="vocal-playback-controls" id="vs-playback" style="display:none;">
              <button class="vocal-playback-btn" id="vs-play">▶</button>
              <button class="vocal-playback-btn" id="vs-stop">⏹</button>
              <button class="vocal-download-btn" id="vs-dl">💾 <span>Download</span></button>
            </div>
            <div class="vocal-section">
              <div class="vocal-section-title">🎛 Trap Presets</div>
              <div class="vocal-presets" id="vs-presets"></div>
            </div>
            <div class="vocal-controls-grid">
              <div class="vocal-section">
                <div class="vocal-section-title">🎵 Autotune</div>
                <div class="vocal-control"><div class="vocal-label"><span>Enable</span><div class="vocal-toggle active" id="vs-autotune"></div></div></div>
                <div class="vocal-control"><div class="vocal-label"><span>Strength</span><span class="vocal-value" id="vs-strength-val">80%</span></div><input type="range" class="vocal-slider" id="vs-strength" min="0" max="100" value="80"></div>
                <div class="vocal-control"><div class="vocal-label"><span>Speed (ms)</span><span class="vocal-value" id="vs-speed-val">50</span></div><input type="range" class="vocal-slider" id="vs-speed" min="1" max="200" value="50"></div>
                <div class="vocal-control"><div class="vocal-label">Key</div><select class="vocal-select" id="vs-key">${NOTE_INDEX.map((n) => `<option value="${n}">${n}</option>`).join('')}</select></div>
                <div class="vocal-control"><div class="vocal-label">Scale</div>
                  <select class="vocal-select" id="vs-scale">
                    <option value="minor" selected>Minor (Trap)</option>
                    <option value="major">Major</option>
                    <option value="pentatonic">Pentatonic</option>
                    <option value="blues">Blues</option>
                    <option value="chromatic">Chromatic</option>
                  </select>
                </div>
                <div class="vocal-control vocal-feature-locked" id="vs-premium-autotune">
                  <div class="vocal-label"><span>Formant Shift</span><span class="vocal-value" id="vs-formant-val">0%</span></div>
                  <input type="range" class="vocal-slider" id="vs-formant" min="-50" max="50" value="0">
                  <div class="vocal-upgrade-prompt" id="vs-formant-upgrade">🔒 Premium Feature</div>
                </div>
                <div class="vocal-control vocal-feature-locked" id="vs-premium-humanize">
                  <div class="vocal-label"><span>Humanize Mode</span><div class="vocal-toggle" id="vs-humanize"></div></div>
                  <div class="vocal-control vocal-control-spaced"><div class="vocal-label"><span>Humanize Amount</span><span class="vocal-value" id="vs-humanize-val">30%</span></div><input type="range" class="vocal-slider" id="vs-humanize-amount" min="0" max="100" value="30"></div>
                  <div class="vocal-upgrade-prompt" id="vs-humanize-upgrade">🔒 Premium Feature</div>
                </div>
                <div class="vocal-control vocal-feature-locked" id="vs-premium-enhanced">
                  <div class="vocal-label"><span>Enhanced Pitch Detection</span><div class="vocal-toggle" id="vs-enhanced"></div></div>
                  <div class="vocal-upgrade-prompt" id="vs-enhanced-upgrade">🔒 Premium Feature</div>
                </div>
              </div>
              <div class="vocal-section">
                <div class="vocal-section-title">🌊 Reverb</div>
                <div class="vocal-control"><div class="vocal-label"><span>Mix</span><span class="vocal-value" id="vs-rmix-val">30%</span></div><input type="range" class="vocal-slider" id="vs-rmix" min="0" max="100" value="30"></div>
                <div class="vocal-control"><div class="vocal-label"><span>Decay</span><span class="vocal-value" id="vs-rdecay-val">2.5s</span></div><input type="range" class="vocal-slider" id="vs-rdecay" min="0.3" max="10" step="0.1" value="2.5"></div>
                <div class="vocal-control"><div class="vocal-label"><span>Pre-Delay</span><span class="vocal-value" id="vs-rpre-val">20ms</span></div><input type="range" class="vocal-slider" id="vs-rpre" min="0" max="100" value="20"></div>
              </div>
              <div class="vocal-section">
                <div class="vocal-section-title">⏱ Delay (Tempo-Sync)</div>
                <div class="vocal-control"><div class="vocal-label"><span>Mix</span><span class="vocal-value" id="vs-dmix-val">25%</span></div><input type="range" class="vocal-slider" id="vs-dmix" min="0" max="100" value="25"></div>
                <div class="vocal-control"><div class="vocal-label"><span>Time</span><span class="vocal-value" id="vs-dtime-label">1/4</span></div>
                  <select class="vocal-select" id="vs-dtime">
                    <option value="0.125">1/8</option>
                    <option value="0.1875">1/8 Dotted</option>
                    <option value="0.25" selected>1/4</option>
                    <option value="0.375">1/4 Dotted</option>
                    <option value="0.5">1/2</option>
                  </select>
                </div>
                <div class="vocal-control"><div class="vocal-label"><span>Feedback</span><span class="vocal-value" id="vs-dfb-val">40%</span></div><input type="range" class="vocal-slider" id="vs-dfb" min="0" max="90" value="40"></div>
              </div>
              <div class="vocal-section">
                <div class="vocal-section-title">✨ Voice FX</div>
                <div class="vocal-control"><div class="vocal-label"><span>Monitor</span><div class="vocal-toggle active" id="vs-monitor"></div></div></div>
                <div class="vocal-control"><div class="vocal-label"><span>Double Track</span><div class="vocal-toggle active" id="vs-double"></div></div></div>
                <div class="vocal-control"><div class="vocal-label"><span>De-Esser</span><div class="vocal-toggle active" id="vs-deess"></div></div></div>
                <div class="vocal-control"><div class="vocal-label"><span>Gate</span><span class="vocal-value" id="vs-gate-val">2%</span></div><input type="range" class="vocal-slider" id="vs-gate" min="0" max="20" value="2"></div>
                <div class="vocal-control"><div class="vocal-label"><span>HPF (Hz)</span><span class="vocal-value" id="vs-hpf-val">80</span></div><input type="range" class="vocal-slider" id="vs-hpf" min="20" max="160" value="80"></div>
                <div class="vocal-control"><div class="vocal-label"><span>Warmth</span><span class="vocal-value" id="vs-warm-val">50%</span></div><input type="range" class="vocal-slider" id="vs-warm" min="0" max="100" value="50"></div>
                <div class="vocal-control"><div class="vocal-label"><span>Air</span><span class="vocal-value" id="vs-air-val">30%</span></div><input type="range" class="vocal-slider" id="vs-air" min="0" max="100" value="30"></div>
              </div>
            </div>
            <div class="vocal-status" id="vs-status">🎙 Ready. Click Start Recording.</div>
          </div>
        </div>`;

      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) {
          this.close();
        }
      });

      document.body.appendChild(overlay);
    }

    _buildChain() {
      try {
        this.ctx = this.flStudio ? this.flStudio.audioContext : this.ctx;
        if (!this.ctx) {
          return;
        }

        const ctx = this.ctx;

        this.inputGain = ctx.createGain();
        this.inputGain.gain.value = 1;

        this.hpf = ctx.createBiquadFilter();
        this.hpf.type = 'highpass';
        this.hpf.frequency.value = 80;

        this.gateGain = ctx.createGain();
        this.gateGain.gain.value = 1;

        this.comp = ctx.createDynamicsCompressor();
        this.comp.threshold.value = -20;
        this.comp.knee.value = 30;
        this.comp.ratio.value = 3;
        this.comp.attack.value = 0.005;
        this.comp.release.value = 0.12;

        this.eqLow = ctx.createBiquadFilter();
        this.eqLow.type = 'lowshelf';
        this.eqLow.frequency.value = 200;

        this.eqHigh = ctx.createBiquadFilter();
        this.eqHigh.type = 'highshelf';
        this.eqHigh.frequency.value = 8000;

        this.coreBus = ctx.createGain();
        this.coreBus.gain.value = 1;

        this.delay = ctx.createDelay(2);
        this.delayFeedback = ctx.createGain();
        this.delayMix = ctx.createGain();
        this.delayFeedback.gain.value = this.delayFb;
        this.delayMix.gain.value = this.delayMixVal;
        this.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delay.connect(this.delayMix);

        this.reverb = ctx.createConvolver();
        this.reverbMix = ctx.createGain();
        this.reverbMix.gain.value = this.reverbMixVal;
        this._buildReverbImpulse();

        this.doublerGain = ctx.createGain();
        this.doublerGain.gain.value = this.doubleTrack ? 0.22 : 0;
        this.doublerDelayL = ctx.createDelay(0.05);
        this.doublerDelayR = ctx.createDelay(0.05);
        this.doublerDelayL.delayTime.value = this.doublerBaseMsL;
        this.doublerDelayR.delayTime.value = this.doublerBaseMsR;
        this.doublerPanL = ctx.createStereoPanner();
        this.doublerPanR = ctx.createStereoPanner();
        this.doublerPanL.pan.value = -0.35;
        this.doublerPanR.pan.value = 0.35;

        const lfoGain1 = ctx.createGain();
        const lfoGain2 = ctx.createGain();
        lfoGain1.gain.value = this.doublerDepthMs;
        lfoGain2.gain.value = this.doublerDepthMs;

        this.doublerLFO1 = ctx.createOscillator();
        this.doublerLFO2 = ctx.createOscillator();
        this.doublerLFO1.frequency.value = 0.2;
        this.doublerLFO2.frequency.value = 0.23;
        this.doublerLFO1.connect(lfoGain1).connect(this.doublerDelayL.delayTime);
        this.doublerLFO2.connect(lfoGain2).connect(this.doublerDelayR.delayTime);
        this.doublerLFO1.start();
        this.doublerLFO2.start();

        this.master = ctx.createGain();
        this.master.gain.value = 1;

        this.recDest = ctx.createMediaStreamDestination();

        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 512;

        this.analyserTime = ctx.createAnalyser();
        this.analyserTime.fftSize = 2048;

        this.coreBus.connect(this.master);
        this.coreBus.connect(this.delay);
        this.delayMix.connect(this.master);

        this.coreBus.connect(this.reverb);
        this.reverbMix.connect(this.master);

        this.coreBus.connect(this.doublerDelayL);
        this.coreBus.connect(this.doublerDelayR);
        this.doublerDelayL.connect(this.doublerPanL).connect(this.doublerGain).connect(this.master);
        this.doublerDelayR.connect(this.doublerPanR).connect(this.doublerGain);

        this.master.connect(ctx.destination);
        this.master.connect(this.recDest);
        this.master.connect(this.analyserTime);
      } catch (error) {
        console.error('Vocal Studio chain build failed', error);
      }
    }

    async _ensurePitchNode() {
      if (!this.ctx || this.pitchNode) {
        return !!this.pitchNode;
      }

      const loaded = await loadPitchWorklet(this.ctx);
      if (!loaded) {
        return false;
      }

      this.pitchNode = new AudioWorkletNode(this.ctx, 'granular-pitch-shift', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
      return true;
    }

    _bindUI() {
      const $ = (id) => document.getElementById(id);

      $('vocal-studio-floating-btn').addEventListener('click', () => {
        this.open().catch((error) => {
          console.error('Error opening vocal studio', error);
          alert('Error opening Vocal Studio: ' + error.message);
        });
      });
      $('vocal-studio-close').addEventListener('click', () => this.close());
      $('vs-rec').addEventListener('click', () => this.toggleRec());
      $('vs-play').addEventListener('click', () => this.play());
      $('vs-stop').addEventListener('click', () => this.stopPlay());
      $('vs-dl').addEventListener('click', () => this.download());

      // Premium toggle
      $('vs-premium-toggle').addEventListener('click', () => {
        if (this.premiumService) {
          const isActive = this.premiumService.isPremiumActive();
          if (isActive) {
            this.premiumService.deactivatePremium();
          } else {
            this.premiumService.activatePremium();
          }
        }
      });

      // Format selector
      document.querySelectorAll('.vocal-format-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.vocal-format-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          this.exportFormat = btn.dataset.format;
        });
      });

      // Premium autotune controls
      this._slider('vs-formant', 'vs-formant-val', (value) => {
        this.formantShift = value / 100;
      }, '%');
      this._toggle('vs-humanize', (on) => {
        this.humanizeMode = on;
        this._status(`Humanize mode ${on ? 'enabled' : 'disabled'}`);
        this._save();
      });
      this._slider('vs-humanize-amount', 'vs-humanize-val', (value) => {
        this.humanizeAmount = value / 100;
      }, '%');
      this._toggle('vs-enhanced', (on) => {
        this.enhancedPitchDetection = on;
        this._status(`Enhanced pitch detection ${on ? 'enabled' : 'disabled'}`);
        this._save();
      });

      // Upgrade prompts
      ['vs-formant-upgrade', 'vs-humanize-upgrade', 'vs-enhanced-upgrade'].forEach((id) => {
        const el = $(id);
        if (el) {
          el.addEventListener('click', () => {
            if (this.premiumService && !this.premiumService.isPremiumActive()) {
              this.premiumService.activatePremium();
            }
          });
        }
      });

      this._toggle('vs-autotune', (on) => {
        this.pitchOn = on;
        this._status(`Autotune ${on ? 'enabled' : 'disabled'}`);
        this._save();
      });
      this._toggle('vs-double', (on) => {
        this.doubleTrack = on;
        if (this.doublerGain) {
          this.doublerGain.gain.setTargetAtTime(on ? 0.22 : 0, this.ctx?.currentTime || 0, 0.02);
        }
        this._status(`Double tracking ${on ? 'enabled' : 'disabled'}`);
        this._save();
      });
      this._toggle('vs-deess', (on) => {
        this.deEssOn = on;
        if (this.eqHigh) {
          this.eqHigh.gain.value = on ? this.air * 6 : Math.max(this.eqHigh.gain.value, 0);
        }
        this._status(`De-esser ${on ? 'enabled' : 'disabled'}`);
        this._save();
      });
      this._toggle('vs-monitor', (on) => {
        this.monitorOn = on;
        if (this.master && this.ctx) {
          this.master.disconnect();
          if (on) {
            this.master.connect(this.ctx.destination);
          }
          this.master.connect(this.recDest);
          this.master.connect(this.analyserTime);
        }
        this._save();
      });

      this._slider('vs-strength', 'vs-strength-val', (value) => {
        this.autotuneStrength = value / 100;
      }, '%');
      this._slider('vs-speed', 'vs-speed-val', (value) => {
        this.pitchMs = value;
      }, '');
      this._slider('vs-rmix', 'vs-rmix-val', (value) => {
        this.reverbMixVal = value / 100;
        if (this.reverbMix) {
          this.reverbMix.gain.value = this.reverbMixVal;
        }
      }, '%');
      this._slider('vs-rdecay', 'vs-rdecay-val', (value) => {
        this.reverbDecay = value;
        this._buildReverbImpulse();
      }, 's');
      this._slider('vs-rpre', 'vs-rpre-val', (value) => {
        this.reverbPredelayMs = value;
        this._buildReverbImpulse();
      }, 'ms');
      this._slider('vs-dmix', 'vs-dmix-val', (value) => {
        this.delayMixVal = value / 100;
        if (this.delayMix) {
          this.delayMix.gain.value = this.delayMixVal;
        }
      }, '%');
      this._slider('vs-dfb', 'vs-dfb-val', (value) => {
        this.delayFb = value / 100;
        if (this.delayFeedback) {
          this.delayFeedback.gain.value = this.delayFb;
        }
      }, '%');
      this._slider('vs-gate', 'vs-gate-val', (value) => {
        this.gateThresh = value / 100;
      }, '%');
      this._slider('vs-hpf', 'vs-hpf-val', (value) => {
        if (this.hpf) {
          this.hpf.frequency.value = value;
        }
      }, '');
      this._slider('vs-warm', 'vs-warm-val', (value) => {
        this.warmth = value / 100;
        if (this.eqLow) {
          this.eqLow.gain.value = this.warmth * 6;
        }
      }, '%');
      this._slider('vs-air', 'vs-air-val', (value) => {
        this.air = value / 100;
        if (this.eqHigh) {
          this.eqHigh.gain.value = (this.deEssOn ? 1 : 0.5) * this.air * 6;
        }
      }, '%');

      $('vs-key').addEventListener('change', (event) => {
        this.targetKey = event.target.value;
        this._status(`Key changed to ${this.targetKey}`);
        this._save();
      });
      $('vs-scale').addEventListener('change', (event) => {
        this.targetScale = event.target.value;
        this._status(`Scale changed to ${this.targetScale}`);
        this._save();
      });
      $('vs-dtime').addEventListener('change', (event) => {
        const label = event.target.options[event.target.selectedIndex].text;
        $('vs-dtime-label').textContent = label;
        this.delayBeats = parseFloat(event.target.value);
        this._applyDelayTime();
        this._save();
      });

      const presets = [
        ['trap-auto', { strength: 80, speed: 50, rmix: 30, rdec: 2.5, rpre: 20, dmix: 25, dfb: 40, warm: 50, air: 30, double: true, deess: true }],
        ['hard-tune', { strength: 100, speed: 1, rmix: 20, rdec: 1.5, rpre: 10, dmix: 15, dfb: 30, warm: 40, air: 50, double: true, deess: true }],
        ['melodic', { strength: 60, speed: 100, rmix: 45, rdec: 3.5, rpre: 25, dmix: 35, dfb: 50, warm: 60, air: 40, double: true, deess: false }],
        ['dark', { strength: 70, speed: 30, rmix: 50, rdec: 4, rpre: 28, dmix: 30, dfb: 60, warm: 70, air: 20, double: true, deess: true }],
        ['spacey', { strength: 50, speed: 150, rmix: 60, rdec: 6, rpre: 40, dmix: 45, dfb: 70, warm: 30, air: 60, double: true, deess: false }],
        ['clean', { strength: 30, speed: 80, rmix: 15, rdec: 1, rpre: 5, dmix: 10, dfb: 20, warm: 40, air: 35, double: false, deess: false }]
      ];

      const presetHost = $('vs-presets');
      presets.forEach(([name, values], index) => {
        const button = document.createElement('button');
        button.className = `vocal-preset-btn${index === 0 ? ' active' : ''}`;
        button.dataset.preset = name;
        button.textContent = name.replace('-', ' ').toUpperCase();
        button.addEventListener('click', () => {
          presetHost.querySelectorAll('.vocal-preset-btn').forEach((el) => el.classList.remove('active'));
          button.classList.add('active');
          this._applyPreset(values);
        });
        presetHost.appendChild(button);
      });
    }

    setFLStudio(flStudio) {
      if (!flStudio) {
        return;
      }

      this.flStudio = flStudio;
      this.externalBpm = this._sanitizeBpm(flStudio?.bpm ?? this.externalBpm ?? 140);

      let context = null;
      if (typeof flStudio.getAudioContext === 'function') {
        context = flStudio.getAudioContext();
      } else if (flStudio.audioContext) {
        context = flStudio.audioContext;
      }

      if (context) {
        this.attachAudioContext(context);
      } else {
        this._subscribeToAudioUnlock();
      }

      this.updateTempo(this.externalBpm);
    }

    getSharedContext() {
      if (this.ctx && this.ctx.state !== 'closed') {
        return this.ctx;
      }
      return null;
    }

    attachAudioContext(context) {
      if (!context || typeof context.resume !== 'function') {
        console.warn('VocalStudio: Invalid audio context supplied to attachAudioContext');
        return this.ctx;
      }

      if (this.ctx === context) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch((error) => {
            console.warn('VocalStudio: Failed to resume shared audio context', error);
          });
        }
        this._bridgeToFLStudio();
        return this.ctx;
      }

      this.ctx = context;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch((error) => {
          console.warn('VocalStudio: Failed to resume attached audio context', error);
        });
      }
      this._buildChain();
      this._bridgeToFLStudio();
      if (typeof this._audioUnlockUnsubscribe === 'function') {
        this._audioUnlockUnsubscribe();
        this._audioUnlockUnsubscribe = null;
      }
      return this.ctx;
    }

    updateTempo(bpm) {
      const sanitized = this._sanitizeBpm(bpm ?? this.externalBpm ?? 140);
      if (sanitized === this.externalBpm) {
        return this.externalBpm;
      }
      this.externalBpm = sanitized;
      this._applyDelayTime();
      return this.externalBpm;
    }

    _sanitizeBpm(value) {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return Math.max(60, Math.min(200, this.externalBpm ?? 140));
      }
      return Math.max(60, Math.min(200, numeric));
    }

    _bridgeToFLStudio() {
      if (!this.flStudio || !this.ctx || typeof this.flStudio.adoptAudioContext !== 'function') {
        return;
      }

      try {
        const adoption = this.flStudio.adoptAudioContext(this.ctx);
        if (adoption && typeof adoption.then === 'function') {
          adoption.catch((error) => {
            console.warn('VocalStudio: Failed to bridge audio context with FLStudio', error);
          });
        }
      } catch (error) {
        console.warn('VocalStudio: Error while bridging audio context with FLStudio', error);
      }
    }

    async open() {
      const overlay = document.getElementById('vocal-studio-overlay');
      if (!overlay) {
        throw new Error('Vocal Studio overlay missing');
      }

      if (!this.flStudio) {
        if (window.flStudio) {
          this.flStudio = window.flStudio;
        }
      }

      if (!this.ctx && this.flStudio) {
        const shared = typeof this.flStudio.getAudioContext === 'function' ? this.flStudio.getAudioContext() : this.flStudio.audioContext;
        if (shared) {
          this.attachAudioContext(shared);
        }
      }

      if (!this.ctx) {
        this.attachAudioContext(new (window.AudioContext || window.webkitAudioContext)());
      }

      overlay.classList.add('active');
      await this.ctx.resume();
      this._bridgeToFLStudio();
      this.updateTempo(this.flStudio?.bpm ?? this.externalBpm);

      try {
        if (this.flStudio && typeof this.flStudio.waitForAudioUnlock === 'function') {
          const shared = await this.flStudio.waitForAudioUnlock();
          if (shared && (!this.ctx || this.ctx.state === 'closed')) {
            this.attachAudioContext(shared);
          }
        }

        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.attachAudioContext(new AudioCtx());
        }

        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1
          }
        });
      } catch (error) {
        this._status('❌ Microphone access denied.');
        throw error;
      }

      this.mediaSrc = this.ctx.createMediaStreamSource(this.mediaStream);
      await this._ensurePitchNode();

      if (this.mediaRecorder) {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.ondataavailable = null;
      }

      this.mediaRecorder = new MediaRecorder(this.recDest.stream);

      const meterTap = this.ctx.createGain();
      meterTap.gain.value = 1;

      this.mediaSrc.connect(this.inputGain);
      this.inputGain.connect(this.hpf);
      this.hpf.connect(this.gateGain);
      this.gateGain.connect(meterTap).connect(this.analyser);
      this.gateGain.connect(this.comp);
      this.comp.connect(this.eqLow);
      this.eqLow.connect(this.eqHigh);

      if (this.pitchNode) {
        this.eqHigh.connect(this.pitchNode);
        this.pitchNode.connect(this.coreBus);
      } else {
        this.eqHigh.connect(this.coreBus);
      }

      this.eqLow.gain.value = this.warmth * 6;
      this.eqHigh.gain.value = (this.deEssOn ? 1 : 0.5) * this.air * 6;

      this.doublerDelayL.delayTime.value = this.doublerBaseMsL;
      this.doublerDelayR.delayTime.value = this.doublerBaseMsR;
      this.doublerGain.gain.value = this.doubleTrack ? 0.22 : 0;

      this._status('🎙 Microphone connected. Ready to record.');
      this._pitchLoop();
      this._applyDelayTime();
      this._startLevelMeter();
    }

    _subscribeToAudioUnlock() {
      if (!this.flStudio || typeof this.flStudio.onAudioUnlock !== 'function') {
        return;
      }

      if (this._audioUnlockUnsubscribe) {
        return;
      }

      this._audioUnlockUnsubscribe = this.flStudio.onAudioUnlock((context) => {
        this.attachAudioContext(context);
        this.updateTempo(this.flStudio?.getBpm?.() ?? this.flStudio?.bpm ?? this.externalBpm);
      }, { invokeImmediately: false });
    }

    close() {
      const overlay = document.getElementById('vocal-studio-overlay');
      overlay?.classList.remove('active');
      if (this.isRecording) {
        this._stopRec();
      }
      // Stop pitch loop to save CPU when vocal studio is closed
      this._stopPitchLoop();
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }
      this.mediaSrc = null;
    }

    toggleRec() {
      if (this.isRecording) {
        this._stopRec();
      } else {
        const isPremium = this.premiumService?.isPremiumActive() || false;
        if (isPremium && this.premiumService?.hasFeature('liveRecording')) {
          this._startLiveRec();
        } else {
          this._startRec();
        }
      }
    }

    _startRec() {
      if (!this.mediaRecorder) {
        this._status('❌ Recorder not ready.');
        return;
      }

      this.recChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recChunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        const mimeType = this._getMimeTypeForFormat(this.exportFormat);
        this.recordedBlob = new Blob(this.recChunks, { type: mimeType });
        document.getElementById('vs-playback').style.display = 'flex';
        this._status('✅ Recording complete. Click ▶ to listen.');
      };

      this.mediaRecorder.start();
      this.isRecording = true;
      this.isLiveRecording = false;
      this._recClockStart = Date.now();
      this._tickRecClock();

      const button = document.getElementById('vs-rec');
      button.classList.add('recording');
      document.getElementById('vs-rec-text').textContent = 'Recording...';
      document.getElementById('vs-rec-icon').textContent = '⏹';
      document.getElementById('vs-live-rec-indicator').style.display = 'none';
      this._status('🔴 Recording in progress...');
    }

    _startLiveRec() {
      if (!this.mediaRecorder || !this.ctx) {
        this._status('❌ Recorder not ready.');
        return;
      }

      this.recChunks = [];
      this.liveRecordingBuffer = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recChunks.push(event.data);
          this.liveRecordingBuffer.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        const mimeType = this._getMimeTypeForFormat(this.exportFormat);
        this.recordedBlob = new Blob(this.recChunks, { type: mimeType });
        document.getElementById('vs-playback').style.display = 'flex';
        document.getElementById('vs-live-rec-indicator').style.display = 'none';
        this._status('✅ Live recording complete. Click ▶ to listen.');
      };

      // Use timeslice for real-time processing
      this.mediaRecorder.start(100);
      this.isRecording = true;
      this.isLiveRecording = true;
      this._recClockStart = Date.now();
      this._tickRecClock();

      const button = document.getElementById('vs-rec');
      button.classList.add('recording');
      document.getElementById('vs-rec-text').textContent = 'Live Recording...';
      document.getElementById('vs-rec-icon').textContent = '⏹';
      document.getElementById('vs-live-rec-indicator').style.display = 'block';
      this._status('🔴 LIVE Recording with autotune in progress...');
    }

    _stopRec() {
      if (this.mediaRecorder && this.isRecording) {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
      this.isLiveRecording = false;
      const button = document.getElementById('vs-rec');
      button.classList.remove('recording');
      document.getElementById('vs-rec-text').textContent = 'Start Recording';
      document.getElementById('vs-rec-icon').textContent = '⏺';
      document.getElementById('vs-live-rec-indicator').style.display = 'none';
    }

    _tickRecClock() {
      if (!this.isRecording) {
        return;
      }
      const elapsed = Math.floor((Date.now() - this._recClockStart) / 1000);
      const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const seconds = String(elapsed % 60).padStart(2, '0');
      document.getElementById('vs-rec-time').textContent = `${minutes}:${seconds}`;
      requestAnimationFrame(() => this._tickRecClock());
    }

    play() {
      if (!this.recordedBlob) {
        return;
      }
      const url = URL.createObjectURL(this.recordedBlob);
      if (this._player) {
        this._player.pause();
      }
      this._player = new Audio(url);
      this._player.onended = () => URL.revokeObjectURL(url);
      this._player.play();
      this._status('▶ Playing...');
    }

    stopPlay() {
      if (this._player) {
        this._player.pause();
        this._player = null;
        this._status('⏹ Playback stopped');
      }
    }

    download() {
      if (!this.recordedBlob) {
        return;
      }
      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      const extension = this.exportFormat || 'webm';
      a.download = `vocal-${Date.now()}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      this._status(`💾 Recording downloaded as ${extension.toUpperCase()}!`);
    }

    _getMimeTypeForFormat(format) {
      const mimeTypes = {
        webm: 'audio/webm',
        wav: 'audio/wav',
        mp3: 'audio/mpeg',
        ogg: 'audio/ogg'
      };
      return mimeTypes[format] || 'audio/webm';
    }

    _applyDelayTime() {
      if (!this.delay) {
        return;
      }
      const dawBpm = (this.flStudio && typeof this.flStudio.getBpm === 'function')
        ? this.flStudio.getBpm()
        : this.flStudio?.bpm;
      const bpm = this._sanitizeBpm(dawBpm ?? this.externalBpm ?? 140);
      this.externalBpm = bpm;
      const seconds = (60 / bpm) * (4 * this.delayBeats);
      this.delay.delayTime.value = clamp(seconds, 0.01, 2);
    }

    _buildReverbImpulse() {
      if (!this.ctx || !this.reverb) {
        return;
      }
      const rate = this.ctx.sampleRate;
      const length = Math.max(1, Math.floor(rate * this.reverbDecay));
      const buffer = this.ctx.createBuffer(2, length, rate);
      const preDelaySamples = Math.floor(rate * (this.reverbPredelayMs / 1000));

      for (let channel = 0; channel < 2; channel += 1) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < length; i += 1) {
          const t = Math.max(0, i - preDelaySamples);
          const env = Math.pow(1 - t / Math.max(length - preDelaySamples, 1), 2);
          data[i] = (Math.random() * 2 - 1) * env;
        }
      }
      this.reverb.buffer = buffer;
    }

    _pitchLoop() {
      if (!this.mediaSrc || !this.ctx) {
        return;
      }

      // Stop any existing loop
      this._stopPitchLoop();

      // Throttle to minimum 50ms to reduce CPU load
      const dt = Math.max(50, clamp(this.pitchMs, 50, 120));
      this._pitchLoopActive = true;

      const process = () => {
        // Check if loop should continue
        if (!this._pitchLoopActive || !this.mediaSrc || !this.ctx) {
          this._pitchLoopActive = false;
          return;
        }

        const level = this._levelNow();
        const now = performance.now();
        if (level < this.gateThresh) {
          if (this._gateBelowSince === 0) {
            this._gateBelowSince = now;
          }
          if (now - this._gateBelowSince > this.gateHoldMs) {
            this.gateGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
          }
        } else {
          this._gateBelowSince = 0;
          this.gateGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.01);
        }

        const buffer = new Float32Array(this.analyserTime.fftSize);
        this.analyserTime.getFloatTimeDomainData(buffer);
        
        // Use enhanced pitch detection if premium
        const useEnhanced = this.enhancedPitchDetection && 
          this.premiumService?.hasFeature('advancedAutotune');
        const frequency = yinPitch(buffer, this.ctx.sampleRate, useEnhanced);
        
        let ratio = 1;
        if (this.pitchOn && frequency) {
          const targetFreq = nearestScaleFreq(frequency, this.targetKey, this.targetScale) || frequency;
          ratio = targetFreq / frequency;
          
          // Apply humanize mode (premium feature)
          if (this.humanizeMode && this.premiumService?.hasFeature('advancedAutotune')) {
            const humanizeVariation = (Math.random() - 0.5) * this.humanizeAmount * 0.1;
            ratio = ratio * (1 + humanizeVariation);
          }
          
          ratio = lerp(1, ratio, this.autotuneStrength);
        }
        
        const alpha = clamp(1 - Math.exp(-dt / Math.max(this.pitchMs, 1)), 0, 1);
        this.prevRatio += alpha * (ratio - this.prevRatio);
        
        // Apply formant shift (premium feature)
        let finalRatio = this.prevRatio;
        if (this.formantShift !== 0 && this.premiumService?.hasFeature('advancedAutotune')) {
          // Formant shifting affects the pitch ratio slightly
          const formantFactor = 1 + (this.formantShift * 0.05);
          finalRatio = finalRatio * formantFactor;
        }
        
        if (this.pitchNode) {
          this.pitchNode.port.postMessage({ ratio: finalRatio });
        }

        this.doublerGain.gain.value = (this.doubleTrack ? 0.22 : 0) * this.gateGain.gain.value;
        this._applyDelayTime();

        // Schedule next iteration only if still active
        if (this._pitchLoopActive) {
          this._pitchLoopTimer = setTimeout(process, dt);
        }
      };
      
      // Start the loop
      this._pitchLoopTimer = setTimeout(process, dt);
    }

    _stopPitchLoop() {
      this._pitchLoopActive = false;
      if (this._pitchLoopTimer !== null) {
        clearTimeout(this._pitchLoopTimer);
        this._pitchLoopTimer = null;
      }
    }

    _startLevelMeter() {
      if (this._levelLoopId) {
        cancelAnimationFrame(this._levelLoopId);
      }
      const update = () => {
        const meter = document.getElementById('vs-meter');
        if (meter) {
          const level = this._levelNow();
          meter.style.width = `${Math.round(level * 100)}%`;
        }
        this._levelLoopId = requestAnimationFrame(update);
      };
      update();
    }

    _levelNow() {
      if (!this.analyser) {
        return 0;
      }
      const bins = this.analyser.frequencyBinCount;
      const data = new Uint8Array(bins);
      this.analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < bins; i += 1) {
        sum += data[i];
      }
      return sum / (bins * 255);
    }

    _animMeters() {
      const canvas = document.getElementById('vs-wave');
      if (!canvas || !canvas.getContext) {
        return;
      }
      const ctx2d = canvas.getContext('2d');
      const isPremium = this.premiumService?.isPremiumActive() || false;
      
      const draw = () => {
        const buffer = new Float32Array(this.analyserTime?.fftSize || 0);
        if (this.analyserTime && buffer.length) {
          this.analyserTime.getFloatTimeDomainData(buffer);
        }
        
        // Premium waveform styling
        if (isPremium) {
          ctx2d.fillStyle = '#000';
          ctx2d.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add gradient background
          const gradient = ctx2d.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, '#1a0a1a');
          gradient.addColorStop(1, '#000');
          ctx2d.fillStyle = gradient;
          ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          ctx2d.fillStyle = '#0a0a0a';
          ctx2d.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        if (buffer.length) {
          // Enhanced waveform for premium
          if (isPremium && this.isLiveRecording) {
            ctx2d.strokeStyle = '#FFD700';
            ctx2d.lineWidth = 3;
            ctx2d.shadowBlur = 10;
            ctx2d.shadowColor = '#FFD700';
          } else {
            ctx2d.strokeStyle = '#FF0080';
            ctx2d.lineWidth = 2;
            ctx2d.shadowBlur = 0;
          }
          
          ctx2d.beginPath();
          for (let x = 0; x < canvas.width; x += 1) {
            const index = Math.floor((x / canvas.width) * buffer.length);
            const y = (0.5 - buffer[index] * 0.45) * canvas.height;
            if (x === 0) {
              ctx2d.moveTo(x, y);
            } else {
              ctx2d.lineTo(x, y);
            }
          }
          ctx2d.stroke();
          
          // Premium: Add frequency spectrum overlay
          if (isPremium && this.analyser) {
            const fftSize = this.analyser.fftSize;
            const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.analyser.getByteFrequencyData(dataArray);
            
            ctx2d.fillStyle = 'rgba(255, 215, 0, 0.1)';
            const barWidth = canvas.width / dataArray.length;
            for (let i = 0; i < dataArray.length; i += 1) {
              const barHeight = (dataArray[i] / 255) * canvas.height * 0.3;
              ctx2d.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
            }
          }
        }
        requestAnimationFrame(draw);
      };
      draw();
    }

    _toggle(id, callback) {
      const element = document.getElementById(id);
      element.addEventListener('click', () => {
        element.classList.toggle('active');
        callback(element.classList.contains('active'));
      });
    }

    _slider(id, valueLabelId, callback, unit) {
      const element = document.getElementById(id);
      const valueElement = document.getElementById(valueLabelId);
      element.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        if (unit === '%' || unit === '') {
          valueElement.textContent = `${Math.round(value)}${unit}`;
        } else {
          valueElement.textContent = `${value}${unit}`;
        }
        callback(value);
      });
    }

    _applyPreset(preset) {
      const set = (id, value, labelId, formatter) => {
        const element = document.getElementById(id);
        element.value = String(value);
        element.dispatchEvent(new Event('input'));
        if (labelId) {
          document.getElementById(labelId).textContent = formatter(value);
        }
      };

      set('vs-strength', preset.strength, 'vs-strength-val', (v) => `${v}%`);
      set('vs-speed', preset.speed, 'vs-speed-val', (v) => `${v}`);
      set('vs-rmix', preset.rmix, 'vs-rmix-val', (v) => `${v}%`);
      set('vs-rdecay', preset.rdec, 'vs-rdecay-val', (v) => `${v}s`);
      set('vs-rpre', preset.rpre, 'vs-rpre-val', (v) => `${v}ms`);
      set('vs-dmix', preset.dmix, 'vs-dmix-val', (v) => `${v}%`);
      set('vs-dfb', preset.dfb, 'vs-dfb-val', (v) => `${v}%`);
      set('vs-warm', preset.warm, 'vs-warm-val', (v) => `${v}%`);
      set('vs-air', preset.air, 'vs-air-val', (v) => `${v}%`);

      const doubleToggle = document.getElementById('vs-double');
      const deessToggle = document.getElementById('vs-deess');
      doubleToggle.classList.toggle('active', !!preset.double);
      deessToggle.classList.toggle('active', !!preset.deess);
      this.doubleTrack = !!preset.double;
      this.deEssOn = !!preset.deess;
      this.doublerGain.gain.value = this.doubleTrack ? 0.22 : 0;
      this._save();
    }

    _status(message) {
      const statusEl = document.getElementById('vs-status');
      if (statusEl) {
        statusEl.textContent = message;
      }
    }

    _save() {
      try {
        const state = {
          key: this.targetKey,
          scale: this.targetScale,
          strength: this.autotuneStrength,
          speed: this.pitchMs,
          rmix: this.reverbMixVal,
          rdec: this.reverbDecay,
          rpre: this.reverbPredelayMs,
          dmix: this.delayMixVal,
          dfb: this.delayFb,
          dtime: this.delayBeats,
          warm: this.warmth,
          air: this.air,
          gate: this.gateThresh,
          hpf: this.hpf?.frequency.value || 80,
          pitchOn: this.pitchOn,
          double: this.doubleTrack,
          deess: this.deEssOn,
          monitor: this.monitorOn,
          formantShift: this.formantShift,
          humanizeMode: this.humanizeMode,
          humanizeAmount: this.humanizeAmount,
          enhancedPitchDetection: this.enhancedPitchDetection,
          exportFormat: this.exportFormat
        };
        localStorage.setItem('vs_premium', JSON.stringify(state));
      } catch (error) {
        console.warn('Failed to persist vocal studio state', error);
      }
    }

    _restore() {
      try {
        const raw = localStorage.getItem('vs_premium');
        if (!raw) {
          return;
        }
        const state = JSON.parse(raw);
        document.getElementById('vs-key').value = state.key || 'C';
        document.getElementById('vs-scale').value = state.scale || 'minor';

        const setValue = (id, value) => {
          const element = document.getElementById(id);
          if (element) {
            element.value = String(value);
            element.dispatchEvent(new Event('input'));
          }
        };

        setValue('vs-strength', Math.round((state.strength ?? 0.8) * 100));
        setValue('vs-speed', state.speed ?? 50);
        setValue('vs-rmix', Math.round((state.rmix ?? 0.3) * 100));
        setValue('vs-rdecay', state.rdec ?? 2.5);
        setValue('vs-rpre', state.rpre ?? 20);
        setValue('vs-dmix', Math.round((state.dmix ?? 0.25) * 100));
        setValue('vs-dfb', Math.round((state.dfb ?? 0.4) * 100));
        setValue('vs-dtime', state.dtime ?? 0.25);
        document.getElementById('vs-dtime').dispatchEvent(new Event('change'));
        setValue('vs-warm', Math.round((state.warm ?? 0.5) * 100));
        setValue('vs-air', Math.round((state.air ?? 0.3) * 100));
        setValue('vs-gate', Math.round((state.gate ?? 0.02) * 100));
        setValue('vs-hpf', state.hpf ?? 80);

        const toggleState = (id, enabled) => {
          const element = document.getElementById(id);
          if (element) {
            element.classList.toggle('active', !!enabled);
          }
        };

        this.pitchOn = state.pitchOn !== false;
        this.doubleTrack = !!state.double;
        this.deEssOn = state.deess !== false;
        this.monitorOn = state.monitor !== false;
        toggleState('vs-autotune', this.pitchOn);
        toggleState('vs-double', this.doubleTrack);
        toggleState('vs-deess', this.deEssOn);
        toggleState('vs-monitor', this.monitorOn);

        // Restore premium settings
        if (state.formantShift !== undefined) {
          setValue('vs-formant', Math.round((state.formantShift || 0) * 100));
        }
        if (state.humanizeMode !== undefined) {
          this.humanizeMode = !!state.humanizeMode;
          toggleState('vs-humanize', this.humanizeMode);
        }
        if (state.humanizeAmount !== undefined) {
          setValue('vs-humanize-amount', Math.round((state.humanizeAmount || 0.3) * 100));
        }
        if (state.enhancedPitchDetection !== undefined) {
          this.enhancedPitchDetection = !!state.enhancedPitchDetection;
          toggleState('vs-enhanced', this.enhancedPitchDetection);
        }
        if (state.exportFormat) {
          this.exportFormat = state.exportFormat;
          document.querySelectorAll('.vocal-format-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.format === state.exportFormat);
          });
        }
      } catch (error) {
        console.warn('Failed to restore vocal studio state', error);
      }
    }
  }

  function runSmokeChecks() {
    setTimeout(() => {
      const btn = document.getElementById('vocal-studio-floating-btn');
      const overlay = document.getElementById('vocal-studio-overlay');
      if (!btn || !overlay) {
        console.warn('VocalStudio: UI smoke check failed');
        return;
      }

      setTimeout(() => {
        if (!document.getElementById('vocal-studio-floating-btn')) {
          console.warn('VocalStudio: Floating button missing after init');
          return;
        }
        if (!document.getElementById('vocal-studio-overlay')) {
          console.warn('VocalStudio: Overlay missing after init');
          return;
        }
        console.log('%cVocalStudio: UI smoke tests passed', 'color:#39d353');
      }, 200);
    }, 100);
  }

  function bootstrapVocalStudio() {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.vocalStudio instanceof VocalStudio) {
      window.vocalStudio.setFLStudio?.(window.flStudio || null);
      return;
    }

    window.vocalStudio = new VocalStudio(window.flStudio || null);
    console.log('🎤✨ Vocal Studio Pro ready');
    runSmokeChecks();
  }

  if (typeof window !== 'undefined') {
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapVocalStudio, { once: true });
      } else {
        bootstrapVocalStudio();
      }
    } else {
      bootstrapVocalStudio();
    }
  }

  })();
