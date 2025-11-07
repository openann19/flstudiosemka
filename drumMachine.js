/* Drum Machine Ultra Compact - restored module */
(function () {
  const STORAGE_KEY = 'flstudio.drumMachine.state';
  const STEP_COUNT = 16;
  const PAD_LAYOUT = [
    { type: 'kick', name: 'Kick', color: '#FF6B6B', key: 'Q' },
    { type: 'snare', name: 'Snare', color: '#4A90E2', key: 'W' },
    { type: 'hihat', name: 'Hi-Hat', color: '#F5A623', key: 'E' },
    { type: 'clap', name: 'Clap', color: '#BB8FCE', key: 'R' },
    { type: 'tom', name: 'Tom', color: '#48C9B0', key: 'A' },
    { type: 'crash', name: 'Crash', color: '#E84C3D', key: 'S' },
    { type: 'ride', name: 'Ride', color: '#3498DB', key: 'D' },
    { type: 'perc', name: 'Perc', color: '#F39C12', key: 'F' }
  ];
  const PROB_LEVELS = [0, 0.25, 0.5, 0.75, 1];

  const KEY_TO_DRUM = PAD_LAYOUT.reduce((acc, pad) => {
    acc[pad.key.toLowerCase()] = pad.type;
    return acc;
  }, {});

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  class SafeFL {
    constructor() {
      this.bpm = 140;
      this.audioContext = null;
    }

    async initAudio() {
      if (!this.audioContext && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx({ latencyHint: 'interactive' });
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      return this.audioContext;
    }
  }

  class DrumMachine {
    constructor(ctx) {
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(ctx.destination);
      this.kit = 'Studio HD';
    }

    setMasterVolume(value) {
      this.master.gain.value = clamp(value, 0, 1);
    }

    setKit(kit) {
      this.kit = kit;
    }

    playDrum(type, velocity = 1) {
      const now = this.ctx.currentTime + 0.002;
      const gain = this.ctx.createGain();
      gain.gain.value = clamp(velocity, 0.05, 1.2);
      gain.connect(this.master);

      switch (type) {
        case 'kick': {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(48, now + 0.18);
          const env = this._createEnvelope(now, 0.001, 0.08, 0.08, 0.22, 2 * velocity);
          osc.connect(env).connect(gain);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case 'snare': {
          const noise = this._createNoiseBuffer();
          const band = this._createFilter('bandpass', 1800, 0.7);
          const high = this._createFilter('highpass', 600, 0.7);
          const env = this._createEnvelope(now, 0.001, 0.12, 0.06, 0.18, 1.6 * velocity);
          noise.connect(band.input);
          band.output.connect(high.input);
          high.output.connect(env).connect(gain);
          noise.start(now);
          noise.stop(now + 0.22);
          break;
        }
        case 'hihat': {
          const noise = this._createNoiseBuffer();
          const high = this._createFilter('highpass', 7000, 0.8);
          const env = this._createEnvelope(now, 0.001, 0.025, 0.03, 0.08, 1.1 * velocity);
          noise.connect(high.input);
          high.output.connect(env).connect(gain);
          noise.start(now);
          noise.stop(now + 0.1);
          break;
        }
        case 'clap': {
          const noise = this._createNoiseBuffer();
          const band = this._createFilter('bandpass', 1800, 0.9);
          const env = this._createEnvelope(now, 0.001, 0.08, 0.12, 0.25, 1.8 * velocity);
          noise.connect(band.input);
          band.output.connect(env).connect(gain);
          noise.start(now);
          noise.stop(now + 0.25);
          break;
        }
        case 'tom': {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);
          const env = this._createEnvelope(now, 0.001, 0.12, 0.1, 0.25, 1.8 * velocity);
          osc.connect(env).connect(gain);
          osc.start(now);
          osc.stop(now + 0.3);
          break;
        }
        case 'crash': {
          const noise = this._createNoiseBuffer();
          const high = this._createFilter('highpass', 5000, 0.6);
          const env = this._createEnvelope(now, 0.002, 0.45, 0.35, 1.1, 1.2 * velocity);
          noise.connect(high.input);
          high.output.connect(env).connect(gain);
          noise.start(now);
          noise.stop(now + 1.2);
          break;
        }
        case 'ride': {
          const noise = this._createNoiseBuffer();
          const high = this._createFilter('highpass', 4500, 0.8);
          const env = this._createEnvelope(now, 0.002, 0.35, 0.25, 0.85, 1.1 * velocity);
          noise.connect(high.input);
          high.output.connect(env).connect(gain);
          noise.start(now);
          noise.stop(now + 0.9);
          break;
        }
        default: {
          const osc = this.ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
          const env = this._createEnvelope(now, 0.001, 0.05, 0.05, 0.15, 1.4 * velocity);
          osc.connect(env).connect(gain);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }
      }
    }

    _createEnvelope(start, attack, decay, release, sustainTime, peak) {
      const gain = this.ctx.createGain();
      const sustainLevel = 0;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + attack);
      gain.gain.linearRampToValueAtTime(sustainLevel, start + attack + decay + sustainTime);
      gain.gain.linearRampToValueAtTime(0.0001, start + attack + decay + sustainTime + release);
      return gain;
    }

    _createNoiseBuffer() {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      return source;
    }

    _createFilter(type, frequency, q) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      filter.Q.value = q;
      const gain = this.ctx.createGain();
      filter.connect(gain);
      return { input: filter, output: gain };
    }
  }

  class DrumScheduler {
    constructor({ ctx, getBpm, onStep, steps = STEP_COUNT, swing = 0 }) {
      this.ctx = ctx;
      this.getBpm = getBpm;
      this.onStep = onStep;
      this.steps = steps;
      this.swing = swing;
      this.lookahead = 0.025;
      this.scheduleAhead = 0.1;
      this.isRunning = false;
      this.nextStepTime = 0;
      this.currentStep = 0;
      this._timer = null;
    }

    start() {
      if (this.isRunning) return;

      this.isRunning = true;
      this.currentStep = 0;
      this.nextStepTime = this.ctx.currentTime + 0.05;

      const tick = () => {
        if (!this.isRunning) return;

        while (this.nextStepTime < this.ctx.currentTime + this.scheduleAhead) {
          this.onStep(this.currentStep, this.nextStepTime);
          this.nextStepTime += this._stepDuration();
          this.currentStep = (this.currentStep + 1) % this.steps;
        }

        this._timer = setTimeout(tick, this.lookahead * 1000);
      };

      tick();
    }

    stop() {
      this.isRunning = false;
      if (this._timer) {
        clearTimeout(this._timer);
        this._timer = null;
      }
    }

    setSwing(value) {
      this.swing = clamp(value, 0, 0.3);
    }

    _stepDuration() {
      const bpm = clamp(this.getBpm(), 20, 300);
      const base = 60 / bpm / 4;
      const odd = this.currentStep % 2 === 1;
      return odd ? base * (1 + this.swing) : base * (1 - this.swing);
    }
  }

  class DrumMachineUIUltra {
    constructor(flStudio) {
      this.flStudio = flStudio || new SafeFL();
      this.panel = null;
      this.statusLabel = null;
      this.playButton = null;
      this.stopButton = null;
      this.saveButton = null;
      this.exportButton = null;
      this.clearButton = null;
      this.kitSelect = null;
      this.masterSlider = null;
      this.swingSlider = null;
      this.globalProbSlider = null;
      this.kitMeta = null;
      this.stepGrid = null;
      this.scheduler = null;
      this.drumMachine = null;
      this.isVisible = false;
      this.isPlaying = false;
      this.currentKit = 'Studio HD';
      this.currentStep = 0;
      this.globalProbability = 1;
      this.swing = 0.08;
      this.masterVolume = 0.8;
      this.pattern = this._newPattern(false);
      this.cellProbability = this._newPattern(1);
      this.mounted = false;
      this._keyHandler = (event) => this._handleKeyDown(event);
      this._stepElementsCache = null;
      this.onStateChange = null;
      this._audioUnlockUnsubscribe = null;
      this.kitPresets = {
        'Studio HD': { color: '#FF9900', description: 'Professional studio-quality drums' },
        'Electronic Pro': { color: '#4A90E2', description: 'Modern electronic drum sounds' },
        'Acoustic Premium': { color: '#3FB53F', description: 'Rich acoustic drum kit' },
        '808 Vintage': { color: '#BB8FCE', description: 'Classic 808 drum machine tones' }
      };
    }

    async mount(host) {
      if (this.mounted || typeof document === 'undefined') return;

      const targetHost = host || document.getElementById('drum-machine-container') || document.body;
      this._createUI(targetHost);
      this._cacheDomReferences();
      this._wire();
      this._registerKeyBindings();
      await this._ensureAudioReady({ waitForUnlock: false });
      this._loadPersisted();
      this._applyPatternToUI();
      if (this.drumMachine && this.scheduler) {
        this.updateStatus('Ready');
      } else {
        this.updateStatus('Awaiting audio unlock');
      }
      this.mounted = true;
    }

    destroy() {
      if (!this.mounted) return;
      this.stopSequencer();
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', this._keyHandler);
      }
      if (this.panel && this.panel.parentNode) {
        this.panel.parentNode.removeChild(this.panel);
      }
      this.panel = null;
      this.mounted = false;
      if (typeof this._audioUnlockUnsubscribe === 'function') {
        this._audioUnlockUnsubscribe();
        this._audioUnlockUnsubscribe = null;
      }
    }

    async show() {
      if (!this.mounted) {
        await this.mount();
      }
      if (!this.panel) return;
      this.panel.style.display = 'block';
      this.isVisible = true;
      await this._ensureAudioReady();
      this.updateStatus('Visible');
    }

    hide() {
      if (!this.panel) return;
      this.panel.style.display = 'none';
      this.isVisible = false;
      this.stopSequencer();
      this.updateStatus('Hidden');
    }

    toggleVisibility() {
      if (!this.panel || this.panel.style.display === 'none') {
        this.show();
      } else {
        this.hide();
      }
    }

    setStateListener(listener) {
      this.onStateChange = typeof listener === 'function' ? listener : null;
    }

    async toggleSequencer() {
      if (this.isPlaying) {
        this.stopSequencer();
      } else {
        await this.startSequencer();
      }
    }

    async startSequencer() {
      if (this.isPlaying) {
        return;
      }

      const context = await this._ensureAudioReady();
      if (!context) {
        this.updateStatus('Waiting for audio unlock');
        return;
      }
      if (!this.drumMachine || !this.scheduler) {
        this.updateStatus('Audio unavailable');
        return;
      }

      this.scheduler.start();
      this.isPlaying = true;
      this.updateStatus('Sequencer running');
      this._updateTransportButtons();
    }

    stopSequencer() {
      if (this.scheduler) {
        this.scheduler.stop();
      }
      this.isPlaying = false;
      this.currentStep = 0;
      this._clearActiveStep();
      this._updateTransportButtons();
      if (this.playButton) {
        this.playButton.dataset.state = 'stopped';
      }
      this.updateStatus('Sequencer stopped');
    }

    clearSequencer() {
      Object.keys(this.pattern).forEach((drum) => {
        this.pattern[drum].fill(false);
        this.cellProbability[drum].fill(1);
      });
      this._applyPatternToUI();
      this._persist();
      this.updateStatus('Pattern cleared');
    }

    setKit(kitName) {
      if (!this.kitPresets[kitName]) return;
      this.currentKit = kitName;
      if (this.drumMachine) {
        this.drumMachine.setKit(kitName);
      }
      if (this.kitSelect) {
        this.kitSelect.value = kitName;
      }
      this._applyKitMeta();
      this._persist();
    }

    setMasterVolume(vol) {
      this.masterVolume = clamp(vol, 0, 1);
      if (this.drumMachine) {
        this.drumMachine.setMasterVolume(this.masterVolume);
      }
      if (this.masterSlider) {
        this.masterSlider.value = Math.round(this.masterVolume * 100);
      }
      this._persist();
    }

    setSwing(value) {
      this.swing = clamp(value, 0, 0.3);
      if (this.scheduler) {
        this.scheduler.setSwing(this.swing);
      }
      if (this.swingSlider) {
        this.swingSlider.value = Math.round(this.swing * 100);
      }
      this.updateStatus(`Swing: ${(this.swing * 100).toFixed(0)}%`);
      this._persist();
    }

    playDrum(type, velocity = 1) {
      if (!this.drumMachine) return;
      this.drumMachine.playDrum(type, velocity);
      this._flashPad(type);
    }

    updateStatus(message) {
      if (this.statusLabel) {
        this.statusLabel.textContent = message;
      }
    }

    /* Internal helpers */
    _newPattern(fill) {
      return PAD_LAYOUT.reduce((acc, pad) => {
        acc[pad.type] = Array(STEP_COUNT).fill(fill);
        return acc;
      }, {});
    }

    async _ensureAudioReady({ waitForUnlock = true } = {}) {
      if (this.drumMachine && this.scheduler && this.flStudio?.audioContext) {
        return this.flStudio.audioContext;
      }

      const context = this.flStudio?.audioContext;
      if (context && context.state !== 'closed') {
        this._initializeAudio(context);
        return context;
      }

      if (!waitForUnlock) {
        if (typeof this.flStudio?.onAudioUnlock === 'function' && !this._audioUnlockUnsubscribe) {
          this._audioUnlockUnsubscribe = this.flStudio.onAudioUnlock((ctx) => {
            this._initializeAudio(ctx);
            this.updateStatus('Drum engine ready');
          }, { invokeImmediately: false });
        }
        return null;
      }

      if (typeof this.flStudio?.waitForAudioUnlock === 'function') {
        const unlocked = await this.flStudio.waitForAudioUnlock();
        if (unlocked && unlocked.state !== 'closed') {
          this._initializeAudio(unlocked);
          this.updateStatus('Drum engine ready');
          return unlocked;
        }
      }

      return null;
    }

    _initializeAudio(context) {
      if (!context) {
        return;
      }

      if (!this.drumMachine) {
        this.drumMachine = new DrumMachine(context);
        this.drumMachine.setMasterVolume(this.masterVolume);
        this.drumMachine.setKit(this.currentKit);
      }

      if (!this.scheduler) {
        this.scheduler = new DrumScheduler({
          ctx: context,
          getBpm: () => this.flStudio.bpm || 140,
          onStep: (stepIndex) => this._handleScheduledStep(stepIndex),
          swing: this.swing
        });
      }
    }

    _handleScheduledStep(stepIndex) {
      this.currentStep = stepIndex;
      this._setActiveStep(stepIndex);

      PAD_LAYOUT.forEach((pad) => {
        if (!this.pattern[pad.type][stepIndex]) return;

        const stepProbability = clamp(this.cellProbability[pad.type][stepIndex] * this.globalProbability, 0, 1);
        if (stepProbability === 0) return;
        if (Math.random() <= stepProbability) {
          this.playDrum(pad.type, stepProbability);
          this._pulseStep(pad.type, stepIndex);
        }
      });
    }

    _createUI(host) {
      this.panel = host.ownerDocument.createElement('div');
      this.panel.className = 'panel drum-machine-panel';
      this.panel.id = 'drum-machine-panel';
      this.panel.style.display = 'none';
      this.panel.innerHTML = this._html();
      host.appendChild(this.panel);
    }

    _cacheDomReferences() {
      if (!this.panel) return;
      this.statusLabel = this.panel.querySelector('#drum-machine-status');
      this.playButton = this.panel.querySelector('#seq-play');
      this.stopButton = this.panel.querySelector('#seq-stop');
      this.saveButton = this.panel.querySelector('#seq-save');
      this.exportButton = this.panel.querySelector('#seq-export');
      this.clearButton = this.panel.querySelector('#seq-clear');
      this.kitSelect = this.panel.querySelector('#kit-select');
      this.masterSlider = this.panel.querySelector('#master-volume');
      this.swingSlider = this.panel.querySelector('#swing');
      this.globalProbSlider = this.panel.querySelector('#global-prob');
      this.kitMeta = this.panel.querySelector('#kit-meta');
      this.stepGrid = this.panel.querySelector('#sequencer-grid');
      this._stepElementsCache = null;
    }

    _wire() {
      if (!this.panel) return;

      this.panel.addEventListener('click', (event) => {
        const padButton = event.target.closest('.drum-pad');
        if (padButton) {
          this.playDrum(padButton.dataset.drum, 1);
        }

        const step = event.target.closest('.sequencer-step');
        if (step) {
          this._toggleStep(step);
        }
      });

      this.panel.addEventListener('contextmenu', (event) => {
        const step = event.target.closest('.sequencer-step');
        if (step) {
          event.preventDefault();
          this._cycleStepProbability(step);
        }
      });

      if (this.playButton) {
        this.playButton.addEventListener('click', () => this.toggleSequencer());
      }

      if (this.stopButton) {
        this.stopButton.addEventListener('click', () => this.stopSequencer());
      }

      if (this.clearButton) {
        this.clearButton.addEventListener('click', () => this.clearSequencer());
      }

      if (this.saveButton) {
        this.saveButton.addEventListener('click', () => {
          this._persist();
          this.updateStatus('Pattern saved');
        });
      }

      if (this.exportButton) {
        this.exportButton.addEventListener('click', () => this._exportPattern());
      }

      if (this.kitSelect) {
        this.kitSelect.addEventListener('change', (event) => this.setKit(event.target.value));
      }

      if (this.masterSlider) {
        this.masterSlider.addEventListener('input', (event) => {
          const value = Number(event.target.value) / 100;
          this.setMasterVolume(value);
          this.updateStatus(`Master volume ${(value * 100).toFixed(0)}%`);
        });
      }

      if (this.swingSlider) {
        this.swingSlider.addEventListener('input', (event) => {
          const value = Number(event.target.value) / 100;
          this.setSwing(value);
        });
      }

      if (this.globalProbSlider) {
        this.globalProbSlider.addEventListener('input', (event) => {
          const value = Number(event.target.value) / 100;
          this.globalProbability = clamp(value, 0, 1);
          this._updateGlobalProbabilityLabel();
          this._persist();
        });
      }
    }

    _registerKeyBindings() {
      if (typeof document === 'undefined') return;
      document.addEventListener('keydown', this._keyHandler);
    }

    _handleKeyDown(event) {
      if (!this.isVisible) return;
      if (event.repeat) return;
      const drum = KEY_TO_DRUM[event.key.toLowerCase()];
      if (!drum) return;
      event.preventDefault();
      this.playDrum(drum, 1);
    }

    _toggleStep(stepElement) {
      const drum = stepElement.dataset.drum;
      const index = Number(stepElement.dataset.step);
      const isActive = !this.pattern[drum][index];
      this.pattern[drum][index] = isActive;
      this.cellProbability[drum][index] = isActive ? this.cellProbability[drum][index] || 1 : 1;
      this._applyStepState(stepElement, drum, index);
      this._persist();
    }

    _cycleStepProbability(stepElement) {
      const drum = stepElement.dataset.drum;
      const index = Number(stepElement.dataset.step);
      if (!this.pattern[drum][index]) return;

      const current = clamp(this.cellProbability[drum][index], 0, 1);
      const currentIndex = PROB_LEVELS.findIndex((level) => Math.abs(level - current) < 0.001);
      const nextIndex = (currentIndex + 1) % PROB_LEVELS.length;
      const nextValue = PROB_LEVELS[nextIndex];
      this.cellProbability[drum][index] = nextValue;
      this._applyStepState(stepElement, drum, index);
      this._persist();
    }

    _applyPatternToUI() {
      if (!this.panel) return;
      PAD_LAYOUT.forEach((pad) => {
        for (let index = 0; index < STEP_COUNT; index += 1) {
          const step = this._getStepElement(pad.type, index);
          if (step) {
            this._applyStepState(step, pad.type, index);
          }
        }
      });
      this._updateGlobalProbabilityLabel();
      this._applyKitMeta();
    }

    _applyStepState(stepElement, drum, index) {
      const isActive = this.pattern[drum][index];
      stepElement.classList.toggle('active', isActive);
      if (!isActive) {
        stepElement.dataset.prob = '1';
        stepElement.removeAttribute('data-prob-label');
        return;
      }

      const prob = clamp(this.cellProbability[drum][index], 0, 1);
      const percentage = Math.round(prob * 100);
      stepElement.dataset.prob = String(prob);
      stepElement.dataset.probLabel = `${percentage}%`;
    }

    _getStepElement(drum, index) {
      if (!this.panel) return null;
      if (!this._stepElementsCache) {
        this._stepElementsCache = new Map();
        PAD_LAYOUT.forEach((pad) => {
          const elements = Array.from(this.panel.querySelectorAll(`.sequencer-step[data-drum="${pad.type}"]`));
          this._stepElementsCache.set(pad.type, elements);
        });
      }
      const list = this._stepElementsCache.get(drum);
      return list ? list[index] : null;
    }

    _setActiveStep(index) {
      this._clearActiveStep();
      PAD_LAYOUT.forEach((pad) => {
        const step = this._getStepElement(pad.type, index);
        if (step) {
          step.classList.add('playing');
        }
      });
    }

    _clearActiveStep() {
      if (!this.panel) return;
      this.panel.querySelectorAll('.sequencer-step.playing').forEach((step) => {
        step.classList.remove('playing');
      });
    }

    _pulseStep(drum, index) {
      const step = this._getStepElement(drum, index);
      if (!step) return;
      step.classList.add('fired');
      setTimeout(() => step.classList.remove('fired'), 120);
    }

    _flashPad(drum) {
      if (!this.panel) return;
      const padElement = this.panel.querySelector(`.drum-pad[data-drum="${drum}"]`);
      if (!padElement) return;
      padElement.classList.add('active');
      setTimeout(() => padElement.classList.remove('active'), 150);
    }

    _persist() {
      const payload = this.getState();
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch (error) {
          console.error('DrumMachineUIUltra: failed to persist state', error);
        }
      }
      this._notifyStateChange(payload);
    }

    _loadPersisted(data = null) {
      let payload = data;
      if (!payload && typeof localStorage !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            payload = JSON.parse(saved);
          }
        } catch (error) {
          console.error('DrumMachineUIUltra: failed to read saved state', error);
          payload = null;
        }
      }
      if (!payload) {
        return;
      }

      if (payload.pattern) {
        Object.keys(this.pattern).forEach((drum) => {
          this.pattern[drum] = Array.isArray(payload.pattern[drum]) ? payload.pattern[drum].slice(0, STEP_COUNT) : this._newPattern(false)[drum];
          while (this.pattern[drum].length < STEP_COUNT) {
            this.pattern[drum].push(false);
          }
        });
      }
      if (payload.probabilities) {
        Object.keys(this.cellProbability).forEach((drum) => {
          const values = Array.isArray(payload.probabilities[drum]) ? payload.probabilities[drum] : [];
          this.cellProbability[drum] = values.slice(0, STEP_COUNT).map((value) => clamp(Number(value) || 0, 0, 1));
          while (this.cellProbability[drum].length < STEP_COUNT) {
            this.cellProbability[drum].push(1);
          }
        });
      }
      if (typeof payload.swing === 'number') {
        this.swing = clamp(payload.swing, 0, 0.3);
      }
      if (typeof payload.masterVolume === 'number') {
        this.masterVolume = clamp(payload.masterVolume, 0, 1);
      }
      if (typeof payload.globalProb === 'number') {
        this.globalProbability = clamp(payload.globalProb, 0, 1);
      }
      if (payload.kit && this.kitPresets[payload.kit]) {
        this.currentKit = payload.kit;
      }
      if (this.kitSelect) {
        this.kitSelect.value = this.currentKit;
      }
      if (this.masterSlider) {
        this.masterSlider.value = Math.round(this.masterVolume * 100);
      }
      if (this.swingSlider) {
        this.swingSlider.value = Math.round(this.swing * 100);
      }
      if (this.globalProbSlider) {
        this.globalProbSlider.value = Math.round(this.globalProbability * 100);
      }
      this._applyKitMeta();
    }

    _updateTransportButtons() {
      if (!this.playButton || !this.stopButton) return;
      this.playButton.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
      this.stopButton.disabled = !this.isPlaying;
    }

    _notifyStateChange(state = null) {
      if (typeof this.onStateChange !== 'function') {
        return;
      }
      const snapshot = state || this.getState();
      this.onStateChange(snapshot);
    }

    _updateGlobalProbabilityLabel() {
      if (!this.panel || !this.globalProbSlider) return;
      const label = this.panel.querySelector('#global-prob-label');
      if (label) {
        label.textContent = `${Math.round(this.globalProbability * 100)}%`;
      }
    }

    _applyKitMeta() {
      if (!this.kitMeta) return;
      const preset = this.kitPresets[this.currentKit];
      if (!preset) return;
      this.kitMeta.textContent = preset.description;
      this.panel.style.setProperty('--kit-accent', preset.color);
    }

    _exportPattern() {
      if (typeof document === 'undefined') return;
      const payload = {
        kit: this.currentKit,
        pattern: this.pattern,
        probabilities: this.cellProbability,
        swing: this.swing,
        bpm: this.flStudio.bpm || 140
      };
      const data = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `drum-pattern-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      this.updateStatus('Pattern exported');
    }

    getState() {
      return {
        kit: this.currentKit,
        pattern: JSON.parse(JSON.stringify(this.pattern)),
        probabilities: JSON.parse(JSON.stringify(this.cellProbability)),
        swing: this.swing,
        masterVolume: this.masterVolume,
        globalProb: this.globalProbability
      };
    }

    applyState(state) {
      if (!state || typeof state !== 'object') {
        return;
      }
      this._loadPersisted(state);
      this._applyPatternToUI();
      this._updateGlobalProbabilityLabel();
      this._persist();
    }

    _html() {
      const padHTML = PAD_LAYOUT.map((pad) => `
        <button class="drum-pad" data-drum="${pad.type}" style="--pad-color:${pad.color}">
          <div class="drum-pad-inner">
            <span class="drum-name">${pad.name}</span>
            <span class="drum-key">${pad.key}</span>
            <span class="drum-meter"></span>
          </div>
        </button>
      `).join('');

      const labels = Array.from({ length: STEP_COUNT }, (_, index) => `<div class="step-label">${index + 1}</div>`).join('');

      const rows = PAD_LAYOUT.map((pad) => {
        const steps = Array.from({ length: STEP_COUNT }, (_, index) => {
          const bar = index % 4 === 0 ? '1' : '0';
          return `<div class="sequencer-step" data-step="${index}" data-drum="${pad.type}" data-bar="${bar}" data-prob="1"></div>`;
        }).join('');
        return `
          <div class="sequencer-row" data-row="${pad.type}">
            <div class="drum-label">${pad.name[0]}</div>
            ${steps}
          </div>
        `;
      }).join('');

      return `
        <div class="drum-machine-header">
          <div class="drum-machine-title">
            <h2>Drum Machine</h2>
            <span class="drum-machine-status" id="drum-machine-status">Booting…</span>
          </div>
          <div class="drum-machine-controls">
            <div class="control-group">
              <label for="kit-select">Kit</label>
              <select id="kit-select">
                ${Object.keys(this.kitPresets).map((kit) => `<option value="${kit}">${kit}</option>`).join('')}
              </select>
              <p class="kit-meta" id="kit-meta"></p>
            </div>
            <div class="control-group">
              <label for="master-volume">Vol</label>
              <input type="range" id="master-volume" min="0" max="100" value="80">
            </div>
            <div class="control-group">
              <label for="swing">Swing</label>
              <input type="range" id="swing" min="0" max="30" value="8">
            </div>
            <div class="control-group">
              <label for="global-prob">Prob <span id="global-prob-label">100%</span></label>
              <input type="range" id="global-prob" min="0" max="100" value="100" title="Global probability multiplier">
            </div>
            <button class="switch" id="seq-play" data-state="stopped">▶ Play</button>
            <button class="switch" id="seq-stop" disabled>■ Stop</button>
          </div>
        </div>
        <div class="drum-machine-content">
          <section class="drum-pad-grid" id="drum-pad-grid">${padHTML}</section>
          <section class="drum-sequencer">
            <header class="sequencer-header">
              <h3>Pattern</h3>
              <div class="sequencer-controls">
                <button class="sequencer-btn" id="seq-clear">Clear</button>
                <button class="sequencer-btn" id="seq-save">Save</button>
                <button class="sequencer-btn" id="seq-export">Export JSON</button>
              </div>
            </header>
            <div class="sequencer-grid" id="sequencer-grid">
              <div class="sequencer-labels"><div></div>${labels}</div>
              ${rows}
            </div>
          </section>
        </div>
      `;
    }
  }

  if (typeof window !== 'undefined') {
    window.DrumMachineUIUltra = DrumMachineUIUltra;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DrumMachineUIUltra };
  }
})();
