// FL Studio Web App
class FLStudio {
  constructor() {
    this.bpm = 140;
    this.isPlaying = false;
    this.currentStep = 0;
    this.tracks = [];
    this.audioContext = null;
    this.intervalId = null;
    this.currentPattern = 1;
    this.selectedCategory = 'presets';
    this.selectedFolder = null;
    this.soundLibrary = this.generateSoundLibrary();
    this.projectName = 'Untitled Project';
    this.autoSaveTimer = null;
    this.mode = 'pattern'; // 'pattern' | 'song'
    this.metronomeEnabled = false;

    // Timeline & arrangement state
    this.arrangements = [];
    this.currentArrangementId = null;
    this.selectedTool = 'draw';
    this.snapSetting = 'beat';
    this.zoomLevel = 1;
    this.basePixelsPerBeat = 60;
    this.beatsPerBar = 4;
    this.stepsPerBeat = 4;
    this.beatsPerStep = 1 / this.stepsPerBeat;
    this.playbackLoopCount = 0;
    this.playheadBeats = 0;
    this.clipCounter = 0;
    this.arrangementLengthBarsDefault = 8;
    this.timelineUtils = (typeof window !== 'undefined' && window.timelineUtils) ? window.timelineUtils : null;
    if (!this.timelineUtils) {
      this.timelineUtils = this.createTimelineUtilsFallback();
    }

    // Audio effects system
    this.masterEffects = {
      reverb: { enabled: false, wet: 0.3, decay: 2.0 },
      delay: { enabled: false, wet: 0.2, time: 0.25, feedback: 0.3 },
      distortion: { enabled: false, amount: 0.5 },
      filter: { enabled: false, frequency: 1000, type: 'lowpass' },
      arpeggiator: { enabled: false, rate: '1/16', octaves: 2, pattern: 'up', gate: 0.8 },
      sidechainCompressor: { enabled: false, threshold: -20, ratio: 4, attack: 0.003, release: 0.25 },
      lfo: { enabled: false, rate: 4, waveform: 'sine', amount: 0.5, target: 'filter' },
      vocoder: { enabled: false, bands: 16, carrierGain: 1.0, modulatorGain: 1.0 },
      eq: { enabled: false, bands: [{freq: 60, gain: 0, q: 1}, {freq: 250, gain: 0, q: 1}, {freq: 1000, gain: 0, q: 1}, {freq: 4000, gain: 0, q: 1}, {freq: 12000, gain: 0, q: 1}] },
      spectrumAnalyzer: { enabled: true, smoothing: 0.8, fftSize: 2048 }
    };

    this.trackEffects = {}; // Per-track effects
    
    // Advanced features
    this.chordGenerator = { enabled: false, rootNote: 'C4', chordType: 'major', inversion: 0 };
    this.sampleSlicer = { slices: [], playbackRate: 1.0, activeSlice: null };
    this.automationLanes = [];
    this.midiMappings = [];
    this.analyzerNode = null;

    // Simple event system for plugins/hooks
    this._listeners = {};
    this.on = (event, handler) => {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(handler);
      return () => {
        this._listeners[event] = this._listeners[event].filter((h) => h !== handler);
      };
    };
    this.emit = (event, ...args) => {
      const list = this._listeners[event] || [];
      list.forEach((h) => {
        try { h(...args); } catch (err) { /* eslint-disable-next-line no-console */ console.error('Hook error', event, err); }
      });
    };

    // Drum Machine integration
    this.drumMachine = null;
    this.drumMachineUI = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createInitialTracks();
    this.updateUI();
    this.startAutoSave();
    this.loadProject(); // Try to load last project
    // Emit hook for after init if a plugin system is present
    if (this.emit) this.emit('afterInit', this);
    // Load any globally registered plugins
    if (typeof window !== 'undefined' && Array.isArray(window.__flPlugins)) {
      window.__flPlugins.forEach((plugin) => {
        try { plugin(this); } catch (e) { /* eslint-disable-next-line no-console */ console.error('Plugin failed', e); }
      });
    }
  }

  startAutoSave() {
    // Auto-save every 30 seconds
    this.autoSaveTimer = setInterval(() => {
      this.saveProject(true);
    }, 30000);
  }

  saveProject(autoSave = false) {
    const projectData = {
      name: this.projectName,
      bpm: this.bpm,
      tracks: this.tracks,
      currentPattern: this.currentPattern,
      playlist: this.playlist || { clips: [] },
      masterEffects: this.masterEffects,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('fl-studio-project', JSON.stringify(projectData));
      if (!autoSave) {
        console.log('Project saved successfully');
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }

  loadProject() {
    try {
      const savedProject = localStorage.getItem('fl-studio-project');
      if (savedProject) {
        const projectData = JSON.parse(savedProject);

        this.projectName = projectData.name || 'Untitled Project';
        this.bpm = projectData.bpm || 140;
  this.tracks = (projectData.tracks || []).map((t) => this.ensureTrackDefaults(t));
        this.currentPattern = projectData.currentPattern || 1;
        this.playlist = projectData.playlist || { clips: [] };
        if (projectData.masterEffects) this.masterEffects = projectData.masterEffects;

        // Re-render tracks
        document.querySelector('.channel-rack').innerHTML = '';
        this.tracks.forEach(track => this.renderTrack(track));

        this.updateUI();
        console.log('Project loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  }

  exportProject() {
    const projectData = {
      name: this.projectName,
      bpm: this.bpm,
      tracks: this.tracks,
      currentPattern: this.currentPattern,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(projectData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${this.projectName.replace(/\s+/g, '_')}.flp`;
    link.click();
  }

  importProject(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = JSON.parse(e.target.result);

        this.projectName = projectData.name || 'Imported Project';
        this.bpm = projectData.bpm || 140;
        this.tracks = projectData.tracks || [];
        this.currentPattern = projectData.currentPattern || 1;

        // Re-render tracks
        document.querySelector('.channel-rack').innerHTML = '';
        this.tracks.forEach(track => this.renderTrack(track));

        this.updateUI();
        this.saveProject();
        console.log('Project imported successfully');
      } catch (error) {
        console.error('Failed to import project:', error);
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  }

  setupEventListeners() {
    // Small helpers to guard missing elements
    const bind = (id, evt, handler) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(evt, handler);
      return !!el;
    };
    const bindAll = (selector, evt, handler) => {
      const els = document.querySelectorAll(selector);
      if (els && els.length) {
        els.forEach((el) => el.addEventListener(evt, handler));
        return true;
      }
      return false;
    };

    // View tabs
    bindAll('.view-tab', 'click', (e) => this.switchView(e.target.dataset.view));

    // Transport controls
    bind('play-btn', 'click', () => this.togglePlay());
    bind('stop-btn', 'click', () => this.stop());
    bind('record-btn', 'click', () => this.toggleRecord());
    // Optional buttons (may not exist in markup)
    bind('test-sound-btn', 'click', () => this.testSound());
    bind('pattern-mode-btn', 'click', () => this.togglePatternSongMode());
    bind('metronome-btn', 'click', () => this.toggleMetronome());

    // BPM controls
    bind('bpm-up', 'click', () => this.adjustBPM(1));
    bind('bpm-down', 'click', () => this.adjustBPM(-1));
    bind('bpm-input', 'change', (e) => {
      this.bpm = parseInt(e.target.value, 10) || this.bpm;
      this.updateUI();
      if (this.isPlaying) this.restartPlayback();
    });

    // Pattern selector
    bind('pattern-select', 'change', (e) => {
      this.currentPattern = parseInt(e.target.value, 10) || this.currentPattern;
      this.updateUI();
    });

    // Browser functionality
    bindAll('.browser-tab', 'click', (e) => this.switchBrowserCategory(e.target.dataset.category));
    bindAll('.tree-item', 'click', (e) => this.selectBrowserItem(e.target));
    bind('browser-search', 'input', (e) => this.searchSounds(e.target.value));

    // File menu
    bind('save-btn', 'click', () => this.saveProject());
    bind('export-btn', 'click', () => this.exportProject());
    bind('import-input', 'change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.importProject(e.target.files[0]);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  togglePatternSongMode() {
    this.mode = this.mode === 'pattern' ? 'song' : 'pattern';
    const btn = document.getElementById('pattern-mode-btn');
    if (btn) btn.classList.toggle('active', this.mode === 'song');
  }

  toggleMetronome() {
    this.metronomeEnabled = !this.metronomeEnabled;
    const btn = document.getElementById('metronome-btn');
    if (btn) btn.classList.toggle('active', this.metronomeEnabled);
  }

  handleKeyDown(e) {
    // Prevent default behavior for our shortcuts
    const isInputFocused = document.activeElement.tagName === 'INPUT';

    switch (e.code) {
      case 'Space':
        if (!isInputFocused) {
          e.preventDefault();
          this.togglePlay();
        }
        break;
      case 'F5':
        e.preventDefault();
        this.switchView('browser');
        break;
      case 'F6':
        e.preventDefault();
        this.switchView('channel-rack');
        break;
      case 'F7':
        e.preventDefault();
        this.switchView('playlist');
        break;
      case 'F8':
        e.preventDefault();
        this.switchView('mixer');
        break;
      case 'F9':
        e.preventDefault();
        this.switchView('pattern');
        break;
      case 'F10':
        e.preventDefault();
        this.switchView('effects');
        break;
      case 'KeyS':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.saveProject();
        }
        break;
      case 'KeyN':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.newProject();
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (!isInputFocused) {
          e.preventDefault();
          this.clearCurrentPattern();
        }
        break;
      case 'KeyZ':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.undo();
        }
        break;
      case 'KeyY':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          this.redo();
        }
        break;
    }
  }

  newProject() {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      this.bpm = 140;
      this.tracks = [];
      this.currentPattern = 1;
      this.projectName = 'Untitled Project';
      this.createInitialTracks();
      this.updateUI();
      this.saveProject();
    }
  }

  clearCurrentPattern() {
    if (confirm('Clear all steps in current pattern?')) {
      this.tracks.forEach(track => {
        track.steps = Array(16).fill(false);
        this.updateStepVisual(track.id, -1); // Update all steps
      });
      this.saveProject();
    }
  }

  undo() {
    // Simple undo - could be enhanced with proper undo stack
    console.log('Undo functionality - could restore previous state');
  }

  redo() {
    // Simple redo - could be enhanced with proper redo stack
    console.log('Redo functionality - could restore next state');
  }

  async switchView(view) {
    // Update active tab
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const targetTab = document.querySelector(`[data-view="${view}"]`);
    if (targetTab) {
      targetTab.classList.add('active');
    }

    // Hide drum machine if switching away
    if (view !== 'drum-machine' && this.drumMachineUI) {
      this.hideDrumMachine();
    }

    // Show/hide panels
    document.querySelectorAll('.panel').forEach(panel => {
      panel.style.display = 'none';
    });
    
    const panelId = view === 'piano-roll' ? 'pattern-panel' : `${view}-panel`;
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
      targetPanel.style.display = 'block';
    }

    // Populate view if needed
    switch (view) {
      case 'playlist':
        this.populatePlaylist();
        break;
      case 'mixer':
        this.populateMixer();
        break;
      case 'piano-roll':
      case 'pattern':
        this.populatePatternEditor();
        break;
      case 'effects':
        this.populateEffects();
        break;
      case 'drum-machine':
        await this.showDrumMachine();
        break;
    }
  }

  async togglePlay() {
    if (!this.audioContext) {
      await this.initAudio();
    }

    this.isPlaying = !this.isPlaying;
    const playBtn = document.getElementById('play-btn');

    if (this.isPlaying) {
      playBtn.classList.add('active');
      this.startPlayback();
    } else {
      playBtn.classList.remove('active');
      this.stopPlayback();
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    document.getElementById('play-btn').classList.remove('active');
    this.stopPlayback();
    this.updateUI();
  }

  async testSound() {
    if (!this.audioContext) {
      await this.initAudio();
    }
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      if (this.audioContext.state === 'running') {
        this.playSound('synth', 'test');
        console.log('Test sound played');
      } else {
        console.log('Audio context not ready. Try clicking again.');
      }
    } else {
      console.log('Audio context not available');
    }
  }

  adjustBPM(delta) {
    this.bpm = Math.max(60, Math.min(200, this.bpm + delta));
    this.updateUI();
    if (this.isPlaying) {
      this.restartPlayback();
    }
  }

  updateUI() {
    document.getElementById('bpm-input').value = this.bpm;
    const pat = document.getElementById('pattern-select');
    if (pat) pat.value = String(this.currentPattern);
    this.updateStepIndicators();
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay && this.timelineUtils) {
      timeDisplay.textContent = this.timelineUtils.formatClockTime(this.playheadBeats || 0, this.bpm);
    }
  }

  createInitialTracks() {
    // Check if we should load saved project or create default
    if (this.tracks && this.tracks.length > 0) {
      // Tracks already loaded from saved project
      this.tracks.forEach(track => this.renderTrack(track));
      return;
    }

    // Create default starter tracks matching FL Studio
    this.addTrack('Kick', 'drum');
    this.addTrack('Clap', 'drum');
    this.addTrack('Hi-Hat', 'drum');
    this.addTrack('Snare', 'drum');
    this.addTrack('Bassline', 'synth');
    this.addTrack('Lead Synth', 'synth');
    this.addTrack('Pad', 'synth');
    this.addTrack('Pluck', 'synth');
  }

  loadProgressiveTechnoTemplate() {
    // Clear existing tracks
    this.tracks = [];
    this.bpm = 125; // Classic progressive techno tempo
    this.projectName = 'Progressive Melodic Techno';

    // Drums
    const kick = this.createTrackData('Kick', 'drum', [
      true, false, false, false, false, false, false, false,
      true, false, false, false, false, false, false, false
    ]);
    this.tracks.push(kick);

    const clap = this.createTrackData('Clap', 'drum', [
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false
    ]);
    this.tracks.push(clap);

    const closedHat = this.createTrackData('Closed Hi-Hat', 'drum', [
      true, false, true, false, true, false, true, false,
      true, false, true, false, true, false, true, false
    ]);
    this.tracks.push(closedHat);

    const openHat = this.createTrackData('Open Hi-Hat', 'drum', [
      false, false, false, false, false, false, true, false,
      false, false, false, false, false, false, true, false
    ]);
    this.tracks.push(openHat);

    const percussion = this.createTrackData('Percussion', 'drum', [
      false, false, true, false, false, true, false, false,
      false, false, true, false, false, true, false, false
    ]);
    this.tracks.push(percussion);

    // Bass
    const bassline = this.createTrackData('Rolling Bass', 'synth', [
      true, false, false, true, false, true, false, false,
      true, false, false, true, false, true, false, false
    ]);
    this.tracks.push(bassline);

    // Melodic Elements
    const arpLead = this.createTrackData('Arp Lead', 'synth', [
      true, false, true, false, true, false, true, false,
      true, false, true, false, true, false, true, false
    ]);
    this.tracks.push(arpLead);

    const pad = this.createTrackData('Atmospheric Pad', 'synth', [
      true, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false
    ]);
    this.tracks.push(pad);

    const pluck = this.createTrackData('Pluck Synth', 'synth', [
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, true, false
    ]);
    this.tracks.push(pluck);

    const strings = this.createTrackData('String Lead', 'synth', [
      true, false, false, false, false, false, false, false,
      true, false, false, false, false, false, false, false
    ]);
    this.tracks.push(strings);

    // Render all tracks
    const channelRack = document.querySelector('.channel-rack');
    if (channelRack) {
      channelRack.innerHTML = '';
      this.tracks.forEach(track => this.renderTrack(track));
    }

    // Enable some effects for the template
    this.masterEffects.reverb.enabled = true;
    this.masterEffects.reverb.wet = 0.25;
    this.masterEffects.reverb.decay = 2.5;

    this.masterEffects.delay.enabled = true;
    this.masterEffects.delay.wet = 0.15;
    this.masterEffects.delay.time = 0.375; // Dotted 8th

    this.masterEffects.sidechainCompressor.enabled = true;
    this.masterEffects.sidechainCompressor.threshold = -25;
    this.masterEffects.sidechainCompressor.ratio = 6;

    this.masterEffects.filter.enabled = true;
    this.masterEffects.filter.frequency = 5000;
    this.masterEffects.filter.type = 'lowpass';

    this.updateUI();
    this.saveProject();

    console.log('Progressive Melodic Techno template loaded!');
  }

  createTrackData(name, type, steps) {
    return {
      id: this.tracks.length,
      name: name,
      type: type,
      steps: steps,
      muted: false,
      solo: false,
      mixerLevel: 1.0,
      params: {
        volume: 1.0, // 0..2
        pan: 0.0,    // -1..1
        amp: { a: 0.01, d: 0.08, s: 0.6, r: 0.2 },
        filter: { cutoff: 1500, resonance: 0.8, type: 'lowpass' },
        detune: 0, // cents
        waveform: 'sawtooth',
        sends: { reverb: 0.18, delay: 0.12 }
      }
    };
  }

  startSpectrumAnalyzer() {
    if (!this.analyzerNode || !this.masterEffects.spectrumAnalyzer.enabled) return;

    const canvas = document.getElementById('spectrum-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = this.analyzerNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!this.masterEffects.spectrumAnalyzer.enabled) return;

      requestAnimationFrame(draw);

      this.analyzerNode.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(40, 40, 40)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height;

        const hue = (i / bufferLength) * 30 + 30; // Orange to red gradient
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  addTrack(name, type) {
    const track = this.ensureTrackDefaults({
      id: this.tracks.length,
      name: name,
      type: type,
      steps: Array(16).fill(false),
      muted: false,
      solo: false
    });

    // Add some basic patterns based on track type
    if (type === 'drum') {
      this.addBasicDrumPattern(track, name);
    } else if (type === 'synth') {
      this.addBasicSynthPattern(track, name);
    }

    this.tracks.push(track);
    this.renderTrack(track);
  }

  ensureTrackDefaults(track) {
    const t = { ...track };
    if (typeof t.mixerLevel !== 'number') t.mixerLevel = 1.0;
    if (!t.params) {
      t.params = {
        volume: 1.0,
        pan: 0.0,
        amp: { a: 0.01, d: 0.08, s: 0.6, r: 0.2 },
        filter: { cutoff: 1500, resonance: 0.8, type: 'lowpass' },
        detune: 0,
        waveform: 'sawtooth',
        sends: { reverb: 0.18, delay: 0.12 }
      };
    } else {
      if (typeof t.params.volume !== 'number') t.params.volume = 1.0;
      if (typeof t.params.pan !== 'number') t.params.pan = 0.0;
      if (!t.params.amp) t.params.amp = { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
      if (!t.params.filter) t.params.filter = { cutoff: 1500, resonance: 0.8, type: 'lowpass' };
      if (typeof t.params.detune !== 'number') t.params.detune = 0;
      if (!t.params.waveform) t.params.waveform = 'sawtooth';
      if (!t.params.sends) t.params.sends = { reverb: 0.18, delay: 0.12 };
    }
    return t;
  }

  addBasicDrumPattern(track, name) {
    const pattern = track.steps;
    const nameLower = name.toLowerCase();

    if (nameLower.includes('kick')) {
      pattern[0] = true;
      pattern[8] = true;
    } else if (nameLower.includes('snare')) {
      pattern[4] = true;
      pattern[12] = true;
    } else if (nameLower.includes('hi-hat') || nameLower.includes('hat')) {
      pattern[0] = true;
      pattern[4] = true;
      pattern[8] = true;
      pattern[12] = true;
    } else {
      // Default drum pattern
      pattern[0] = true;
      pattern[8] = true;
    }
  }

  addBasicSynthPattern(track, name) {
    const pattern = track.steps;
    const nameLower = name.toLowerCase();

    if (nameLower.includes('bass')) {
      pattern[0] = true;
      pattern[6] = true;
      pattern[8] = true;
      pattern[14] = true;
    } else if (nameLower.includes('lead')) {
      pattern[0] = true;
      pattern[2] = true;
      pattern[4] = true;
      pattern[6] = true;
    } else {
      // Default synth pattern
      pattern[0] = true;
      pattern[8] = true;
    }
  }

  renderTrack(track) {
    // Ensure defaults exist for legacy projects
    track = this.ensureTrackDefaults(track);
    const channelRack = document.getElementById('channel-rack');

    const trackElement = document.createElement('div');
    trackElement.className = 'track';
    trackElement.dataset.trackId = track.id;
    trackElement.addEventListener('dragover', (e) => e.preventDefault());
    trackElement.addEventListener('drop', (e) => this.handleTrackDrop(e, track.id));

    // Track header section
    const header = document.createElement('div');
    header.className = 'track-header';

    // Track icon/color indicator
    const icon = document.createElement('div');
    icon.className = 'track-icon';
    icon.style.background = this.getTrackColor(track.type, track.id);
    header.appendChild(icon);

    // Track name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'track-name';
    nameSpan.textContent = track.name;
    nameSpan.contentEditable = 'false';
    nameSpan.addEventListener('dblclick', (e) => {
      e.target.contentEditable = 'true';
      e.target.focus();
      document.execCommand('selectAll', false, null);
    });
    nameSpan.addEventListener('blur', (e) => {
      e.target.contentEditable = 'false';
      track.name = e.target.textContent;
      this.saveProject();
    });
    nameSpan.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });
    header.appendChild(nameSpan);

    // Track controls
    const controls = document.createElement('div');
    controls.className = 'track-controls';

    const muteBtn = document.createElement('button');
    muteBtn.className = 'track-btn mute-btn';
    muteBtn.textContent = 'M';
    muteBtn.title = 'Mute (Ctrl+M)';
    if (track.muted) muteBtn.classList.add('active');
    muteBtn.addEventListener('click', () => this.toggleMute(track.id));
    controls.appendChild(muteBtn);

    const soloBtn = document.createElement('button');
    soloBtn.className = 'track-btn solo-btn';
    soloBtn.textContent = 'S';
    soloBtn.title = 'Solo (Ctrl+S)';
    if (track.solo) soloBtn.classList.add('active');
    soloBtn.addEventListener('click', () => this.toggleSolo(track.id));
    controls.appendChild(soloBtn);

    const aiBtn = document.createElement('button');
    aiBtn.className = 'ai-pattern-btn';
    aiBtn.title = 'Generate AI Pattern';
    aiBtn.innerHTML = '✨';
    aiBtn.addEventListener('click', () => this.generateAIPattern(track.id));
    controls.appendChild(aiBtn);

  header.appendChild(controls);

  // Track parameters toggle button
  const paramsToggle = document.createElement('button');
  paramsToggle.className = 'track-btn';
  paramsToggle.title = 'Track Parameters';
  paramsToggle.textContent = '⚙️';
  controls.appendChild(paramsToggle);

    // Step sequencer grid
    const stepGrid = document.createElement('div');
    stepGrid.className = 'step-grid';

    for (let i = 0; i < 16; i++) {
      const step = document.createElement('button');
      step.className = 'step';
      step.dataset.step = i;
      step.setAttribute('aria-label', `Step ${i + 1}`);
      step.addEventListener('click', () => this.toggleStep(track.id, i));
      stepGrid.appendChild(step);
    }

    trackElement.appendChild(header);

    // Parameters panel (hidden by default)
    const paramsPanel = document.createElement('div');
    paramsPanel.className = 'track-params';
    paramsPanel.style.display = 'none';
    paramsPanel.style.padding = '6px 8px';
    paramsPanel.style.background = 'var(--fl-dark)';
    paramsPanel.style.borderTop = '1px solid var(--fl-light-gray)';
    paramsPanel.innerHTML = `
      <div class="param-row">
        <label>Vol</label>
        <input type="range" data-p="volume" min="0" max="2" step="0.01" value="${track.params.volume}">
        <span class="val">${track.params.volume.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>Pan</label>
        <input type="range" data-p="pan" min="-1" max="1" step="0.01" value="${track.params.pan}">
        <span class="val">${track.params.pan.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>A/D/S/R</label>
        <input type="number" data-p="amp.a" min="0" max="2" step="0.01" value="${track.params.amp.a}" style="width:58px">/
        <input type="number" data-p="amp.d" min="0" max="2" step="0.01" value="${track.params.amp.d}" style="width:58px">/
        <input type="number" data-p="amp.s" min="0" max="1" step="0.01" value="${track.params.amp.s}" style="width:58px">/
        <input type="number" data-p="amp.r" min="0" max="3" step="0.01" value="${track.params.amp.r}" style="width:58px">
      </div>
      <div class="param-row">
        <label>Filter</label>
        <input type="number" data-p="filter.cutoff" min="20" max="20000" step="1" value="${track.params.filter.cutoff}" style="width:90px">Hz
        <input type="number" data-p="filter.resonance" min="0.1" max="20" step="0.1" value="${track.params.filter.resonance}" style="width:90px">Q
      </div>
      <div class="param-row">
        <label>Detune</label>
        <input type="range" data-p="detune" min="-1200" max="1200" step="1" value="${track.params.detune}">
        <span class="val">${track.params.detune}c</span>
      </div>
    `;
    trackElement.appendChild(paramsPanel);

    paramsToggle.addEventListener('click', () => {
      paramsPanel.style.display = paramsPanel.style.display === 'none' ? 'block' : 'none';
    });

    // Bind param inputs
    paramsPanel.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const path = e.target.getAttribute('data-p');
        const value = e.target.type === 'range' || e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        // Apply nested update
        const parts = path.split('.');
        let ref = track.params;
        for (let i = 0; i < parts.length - 1; i++) {
          ref = ref[parts[i]];
        }
        ref[parts[parts.length - 1]] = value;
        // Update UI value spans
        const valSpan = e.target.parentElement.querySelector('.val');
        if (valSpan) valSpan.textContent = e.target.type === 'range' ? (Number.isFinite(value) ? value.toFixed(2) : String(value)) : String(value);
        // Apply immediately
        this.applyTrackParams(track.id);
        this.saveProject(true);
      });
    });
    trackElement.appendChild(stepGrid);

    channelRack.appendChild(trackElement);

    // Update step visuals to reflect the pattern
    this.updateStepVisual(track.id, -1);
  }

  getTrackColor(type, id) {
    const colors = {
      drum: ['#FF6B6B', '#E84C3D', '#FF9F43', '#F5A623'],
      synth: ['#4A90E2', '#5DADE2', '#BB8FCE', '#AF7AC5'],
      effect: ['#48C9B0', '#16A085', '#1ABC9C', '#0B5345']
    };
    const colorArray = colors[type] || colors.drum;
    return colorArray[id % colorArray.length];
  }

  handleTrackDrop(e, trackId) {
    e.preventDefault();
    try {
      const sound = JSON.parse(e.dataTransfer.getData('application/json'));
      const track = this.tracks[trackId];

      if (!track) {
        console.error('Track not found:', trackId);
        return;
      }

      // Update track with new sound
      track.name = sound.name;
      track.type = sound.type;

      // Update display
      const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
      const nameSpan = trackElement.querySelector('.track-name');
      if (nameSpan) {
        nameSpan.textContent = sound.name;
      }

      // Remove dragging class
      document.querySelectorAll('.sound-item.dragging').forEach(item => {
        item.classList.remove('dragging');
      });

    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }

  toggleStep(trackId, stepIndex) {
    const track = this.tracks[trackId];
    track.steps[stepIndex] = !track.steps[stepIndex];
    this.updateStepVisual(trackId, stepIndex);
  }

  toggleMute(trackId) {
    const track = this.tracks[trackId];
    track.muted = !track.muted;
    const muteBtn = document.querySelector(`[data-track-id="${trackId}"] .mute-btn`);
    muteBtn.classList.toggle('active', track.muted);
  }

  toggleSolo(trackId) {
    const track = this.tracks[trackId];
    track.solo = !track.solo;
    const soloBtn = document.querySelector(`[data-track-id="${trackId}"] .solo-btn`);
    soloBtn.classList.toggle('active', track.solo);
  }

  updateStepVisual(trackId, stepIndex) {
    if (stepIndex === -1) {
      // Update all steps
      for (let i = 0; i < 16; i++) {
        this.updateStepVisual(trackId, i);
      }
      return;
    }

    const step = document.querySelector(`[data-track-id="${trackId}"] .step[data-step="${stepIndex}"]`);
    if (step) {
      step.classList.toggle('active', this.tracks[trackId].steps[stepIndex]);
    }
  }

  updateStepIndicators() {
    // Remove current class from all steps
    document.querySelectorAll('.step.current').forEach(step => {
      step.classList.remove('current');
    });

    if (this.isPlaying) {
      // Add current class to steps in current step column
      document.querySelectorAll(`.step[data-step="${this.currentStep}"]`).forEach(step => {
        step.classList.add('current');
      });
    }
  }

  async initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      // Resume audio context if suspended (required in modern browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Create spectrum analyzer
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = this.masterEffects.spectrumAnalyzer.fftSize;
      this.analyzerNode.smoothingTimeConstant = this.masterEffects.spectrumAnalyzer.smoothing;
      // Create master gain and route analyzer through master
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime);

      // Analyzer taps the master output
      this.masterGain.connect(this.analyzerNode);
      this.analyzerNode.connect(this.audioContext.destination);

  // Per-track outputs
  this.trackOutputs = new Map(); // trackId -> { input, gain, panner }
      
      console.log('Audio context initialized and active');
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }

  startPlayback() {
    if (!this.audioContext) return;

    const stepTime = 60 / this.bpm / 4; // 16th notes

    this.intervalId = setInterval(() => {
      // advance playhead in beats
      this.playheadBeats = (this.playheadBeats || 0) + (1 / 4);
      // metronome on beats
      if (this.metronomeEnabled && this.currentStep % 4 === 0) {
        // high click on first beat of bar
        const isBarStart = (Math.floor(this.playheadBeats) % (this.beatsPerBar || 4)) === 0;
        const freq = isBarStart ? 2000 : 1200;
        this.playSound('synth', `metronome-${freq}`, this.masterGain);
      }
      this.playCurrentStep();
      this.currentStep = (this.currentStep + 1) % 16;
      this.updateStepIndicators();
      this.updateUI();
      if (this.emit) this.emit('tick', { beats: this.playheadBeats, bpm: this.bpm, step: this.currentStep });
    }, stepTime * 1000);
  }

  stopPlayback() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.updateStepIndicators();
  }

  restartPlayback() {
    if (this.isPlaying) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  generateSoundLibrary() {
    return {
      presets: {
        Drums: [
          { name: 'Kick 01', type: 'drum', icon: '🥁' },
          { name: 'Snare 01', type: 'drum', icon: '🥁' },
          { name: 'Hi-Hat 01', type: 'drum', icon: '🥁' },
          { name: 'Clap 01', type: 'drum', icon: '👏' },
          { name: 'Crash 01', type: 'drum', icon: '🥁' }
        ],
        Synths: [
          { name: 'Bass Synth 01', type: 'synth', icon: '🎹' },
          { name: 'Lead Synth 01', type: 'synth', icon: '🎹' },
          { name: 'Pad Synth 01', type: 'synth', icon: '🎹' },
          { name: 'Pluck Synth 01', type: 'synth', icon: '🎸' }
        ],
        Effects: [
          { name: 'Reverb Hall', type: 'effect', icon: '🌊' },
          { name: 'Delay 1/8', type: 'effect', icon: '⏰' },
          { name: 'Chorus', type: 'effect', icon: '🌊' },
          { name: 'Distortion', type: 'effect', icon: '⚡' }
        ]
      },
      samples: {
        Kicks: [
          { name: '808 Kick', type: 'sample', icon: '🥁' },
          { name: '909 Kick', type: 'sample', icon: '🥁' },
          { name: 'Acoustic Kick', type: 'sample', icon: '🥁' }
        ],
        Snares: [
          { name: '808 Snare', type: 'sample', icon: '🥁' },
          { name: '909 Snare', type: 'sample', icon: '🥁' },
          { name: 'Piccolo Snare', type: 'sample', icon: '🥁' }
        ],
        HiHats: [
          { name: 'Closed HH', type: 'sample', icon: '🥁' },
          { name: 'Open HH', type: 'sample', icon: '🥁' },
          { name: 'Pedal HH', type: 'sample', icon: '🥁' }
        ]
      },
      plugins: [
        { name: 'Fruity Reverb', type: 'plugin', icon: '🔊' },
        { name: 'EQ', type: 'plugin', icon: '📊' },
        { name: 'Compressor', type: 'plugin', icon: '⚙️' },
        { name: 'Distortion', type: 'plugin', icon: '⚡' },
        { name: 'Delay', type: 'plugin', icon: '⏰' }
      ]
    };
  }

  switchBrowserCategory(category) {
    // Update active browser tab
    document.querySelectorAll('.browser-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Show/hide tree categories
    document.querySelectorAll('.tree-category').forEach(cat => {
      cat.style.display = cat.dataset.category === category ? 'block' : 'none';
    });

    this.selectedCategory = category;
    this.selectedFolder = null;
    this.updateBrowserDetail();
  }

  selectBrowserItem(item) {
    // Remove previous selection
    document.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));

    // Select current item
    item.classList.add('selected');

    const type = item.dataset.type;
    const name = item.dataset.name;

    if (type === 'folder') {
      this.selectedFolder = name;
    } else {
      this.selectedFolder = null;
    }

    this.updateBrowserDetail();
  }

  searchSounds(query) {
    this.updateBrowserDetail(query);
  }

  updateBrowserDetail(searchQuery = '') {
    const soundGrid = document.getElementById('sound-grid');
    const header = document.querySelector('.detail-header');

    let sounds = [];
    let title = 'Select a category to browse sounds';

    if (this.selectedCategory && this.selectedFolder) {
      sounds = this.soundLibrary[this.selectedCategory][this.selectedFolder] || [];
      title = `${this.selectedCategory} > ${this.selectedFolder}`;
    } else if (this.selectedCategory === 'plugins') {
      sounds = this.soundLibrary.plugins;
      title = 'Plugins';
    } else if (this.selectedCategory && !this.selectedFolder) {
      // Show all sounds in category
      Object.values(this.soundLibrary[this.selectedCategory]).forEach(folder => {
        sounds = sounds.concat(folder);
      });
      title = this.selectedCategory;
    }

    // Filter by search
    if (searchQuery) {
      sounds = sounds.filter(sound =>
        sound.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      title = `Search results for "${searchQuery}"`;
    }

    header.textContent = title;

    // Clear grid
    soundGrid.innerHTML = '';

    // Populate grid
    sounds.forEach(sound => {
      const soundItem = document.createElement('div');
      soundItem.className = 'sound-item';
      soundItem.draggable = true;
      soundItem.dataset.sound = JSON.stringify(sound);

      soundItem.innerHTML = `
        <div class="sound-icon">${sound.icon}</div>
        <div class="sound-name">${sound.name}</div>
      `;

      soundItem.addEventListener('dragstart', (e) => this.handleSoundDragStart(e, sound));
      soundItem.addEventListener('click', () => this.addSoundToTrack(sound));

      soundGrid.appendChild(soundItem);
    });
  }

  handleSoundDragStart(e, sound) {
    e.dataTransfer.setData('application/json', JSON.stringify(sound));
    e.target.classList.add('dragging');
  }

  addSoundToTrack(sound) {
    // Create a new track with the selected sound
    this.addTrack(sound.name, sound.type);
    this.saveProject();
  }

  populatePlaylist() {
    const timelineTracks = document.getElementById('timeline-tracks');
    timelineTracks.innerHTML = '';

    this.tracks.forEach(track => {
      const trackElement = document.createElement('div');
      trackElement.className = 'timeline-track';
      trackElement.innerHTML = `
        <div class="track-label">${track.name}</div>
        <div class="timeline-grid">
          <!-- Clips will be added here -->
        </div>
      `;
      timelineTracks.appendChild(trackElement);
    });
  }

  populateMixer() {
    const mixerChannels = document.getElementById('mixer-channels');
    mixerChannels.innerHTML = '';

    this.tracks.forEach(track => {
      const channelElement = document.createElement('div');
      channelElement.className = 'mixer-channel';
      channelElement.innerHTML = `
        <div class="channel-name">${track.name}</div>
        <div class="mixer-fader" data-track="${track.id}">
          <div class="fader-handle" style="height: 80%;"></div>
        </div>
        <div class="mixer-controls">
          <div class="mixer-btn ${track.muted ? 'active' : ''}" data-action="mute">M</div>
          <div class="mixer-btn ${track.solo ? 'active' : ''}" data-action="solo">S</div>
        </div>
      `;

      // Add event listeners
      const fader = channelElement.querySelector('.mixer-fader');
      fader.addEventListener('click', (e) => this.handleFaderClick(e, track.id));

      const buttons = channelElement.querySelectorAll('.mixer-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          if (action === 'mute') this.toggleMute(track.id);
          else if (action === 'solo') this.toggleSolo(track.id);
          this.updateMixerButtons();
        });
      });

      mixerChannels.appendChild(channelElement);
    });
  }

  handleFaderClick(e, trackId) {
    const fader = e.currentTarget;
    const rect = fader.getBoundingClientRect();
    const height = rect.height;
    const clickY = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(1, 1 - (clickY / height)));

    const handle = fader.querySelector('.fader-handle');
    handle.style.height = `${percentage * 100}%`;

    // Store volume level (could be used for audio)
    const output = this.getTrackOutput(trackId);
    const track = this.tracks[trackId] ? this.ensureTrackDefaults(this.tracks[trackId]) : null;
    if (track) track.mixerLevel = percentage * 1.4;
    const volMul = Math.max(0.0, Math.min(2.0, ((track && track.params ? track.params.volume : 1) * (track && typeof track.mixerLevel === 'number' ? track.mixerLevel : 1))));
    if (output && output.gain && output.gain.gain) {
      output.gain.gain.setValueAtTime(volMul, this.audioContext ? this.audioContext.currentTime : 0);
    }
  }

  updateMixerButtons() {
    // Update all mixer buttons to reflect current state
    this.tracks.forEach(track => {
      const channel = document.querySelector(`.mixer-channel .channel-name`);
      if (channel && channel.textContent === track.name) {
        const parent = channel.parentElement;
        const muteBtn = parent.querySelector('[data-action="mute"]');
        const soloBtn = parent.querySelector('[data-action="solo"]');

        muteBtn.classList.toggle('active', track.muted);
        soloBtn.classList.toggle('active', track.solo);
      }
    });
  }

  populateEffects() {
    const effectsChain = document.getElementById('effects-chain');
    effectsChain.innerHTML = '';

    // All effects - organized by category
    const effects = [
      { id: 'arpeggiator', name: 'Arpeggiator', data: this.masterEffects.arpeggiator },
      { id: 'chordGenerator', name: 'Chord Generator', data: this.chordGenerator },
      { id: 'sidechainCompressor', name: 'Sidechain Compressor', data: this.masterEffects.sidechainCompressor },
      { id: 'eq', name: 'Parametric EQ', data: this.masterEffects.eq },
      { id: 'filter', name: 'Filter', data: this.masterEffects.filter },
      { id: 'distortion', name: 'Distortion', data: this.masterEffects.distortion },
      { id: 'delay', name: 'Delay', data: this.masterEffects.delay },
      { id: 'reverb', name: 'Reverb', data: this.masterEffects.reverb },
      { id: 'lfo', name: 'LFO Modulator', data: this.masterEffects.lfo },
      { id: 'vocoder', name: 'Vocoder', data: this.masterEffects.vocoder },
      { id: 'spectrumAnalyzer', name: 'Spectrum Analyzer', data: this.masterEffects.spectrumAnalyzer }
    ];

    effects.forEach(effect => {
      const effectElement = this.createEffectControl(effect.id, effect.name, effect.data);
      effectsChain.appendChild(effectElement);
    });
  }

  createEffectControl(effectType, effectName, effectSettings) {
    const effectDiv = document.createElement('div');
    effectDiv.className = 'effect-control';
    effectDiv.dataset.effect = effectType;

    effectDiv.innerHTML = `
      <div class="effect-header">
        <h3>${effectName}</h3>
        <label class="effect-toggle">
          <input type="checkbox" ${effectSettings.enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="effect-params">
        ${this.createEffectParams(effectType, effectSettings)}
      </div>
    `;

    // Add event listeners
    const toggle = effectDiv.querySelector('input[type="checkbox"]');
    toggle.addEventListener('change', (e) => {
      this.masterEffects[effectType].enabled = e.target.checked;
      this.updateEffectParamsVisibility(effectDiv, e.target.checked);
    });

    // Add parameter change listeners
    const params = effectDiv.querySelectorAll('input, select');
    params.forEach(param => {
      param.addEventListener('input', (e) => {
        const paramName = e.target.dataset.param;
        const value = e.target.type === 'checkbox' ? e.target.checked :
                     e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        this.masterEffects[effectType][paramName] = value;
      });
    });

    this.updateEffectParamsVisibility(effectDiv, effectSettings.enabled);
    return effectDiv;
  }

  updateEffectParamsVisibility(effectDiv, enabled) {
    const paramsDiv = effectDiv.querySelector('.effect-params');
    if (paramsDiv) {
      paramsDiv.style.display = enabled ? 'block' : 'none';
    }
  }

  createEffectParams(effectType, settings) {
    switch (effectType) {
      case 'arpeggiator':
        return `
          <div class="param">
            <label>Rate</label>
            <select data-param="rate">
              <option value="1/4" ${settings.rate === '1/4' ? 'selected' : ''}>1/4</option>
              <option value="1/8" ${settings.rate === '1/8' ? 'selected' : ''}>1/8</option>
              <option value="1/16" ${settings.rate === '1/16' ? 'selected' : ''}>1/16</option>
              <option value="1/32" ${settings.rate === '1/32' ? 'selected' : ''}>1/32</option>
            </select>
          </div>
          <div class="param">
            <label>Octaves</label>
            <input type="range" min="1" max="4" step="1" value="${settings.octaves}" data-param="octaves">
            <span class="value">${settings.octaves}</span>
          </div>
          <div class="param">
            <label>Pattern</label>
            <select data-param="pattern">
              <option value="up" ${settings.pattern === 'up' ? 'selected' : ''}>Up</option>
              <option value="down" ${settings.pattern === 'down' ? 'selected' : ''}>Down</option>
              <option value="updown" ${settings.pattern === 'updown' ? 'selected' : ''}>Up/Down</option>
              <option value="random" ${settings.pattern === 'random' ? 'selected' : ''}>Random</option>
            </select>
          </div>
          <div class="param">
            <label>Gate</label>
            <input type="range" min="0.1" max="1" step="0.1" value="${settings.gate}" data-param="gate">
            <span class="value">${settings.gate}</span>
          </div>
        `;
      case 'chordGenerator':
        return `
          <div class="param">
            <label>Root Note</label>
            <select data-param="rootNote">
              ${['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => 
                `<option value="${note}4" ${settings.rootNote === note + '4' ? 'selected' : ''}>${note}4</option>`
              ).join('')}
            </select>
          </div>
          <div class="param">
            <label>Chord Type</label>
            <select data-param="chordType">
              <option value="major" ${settings.chordType === 'major' ? 'selected' : ''}>Major</option>
              <option value="minor" ${settings.chordType === 'minor' ? 'selected' : ''}>Minor</option>
              <option value="diminished" ${settings.chordType === 'diminished' ? 'selected' : ''}>Diminished</option>
              <option value="augmented" ${settings.chordType === 'augmented' ? 'selected' : ''}>Augmented</option>
              <option value="sus2" ${settings.chordType === 'sus2' ? 'selected' : ''}>Sus2</option>
              <option value="sus4" ${settings.chordType === 'sus4' ? 'selected' : ''}>Sus4</option>
              <option value="7th" ${settings.chordType === '7th' ? 'selected' : ''}>7th</option>
              <option value="maj7" ${settings.chordType === 'maj7' ? 'selected' : ''}>Maj7</option>
              <option value="min7" ${settings.chordType === 'min7' ? 'selected' : ''}>Min7</option>
            </select>
          </div>
          <div class="param">
            <label>Inversion</label>
            <input type="range" min="0" max="3" step="1" value="${settings.inversion}" data-param="inversion">
            <span class="value">${settings.inversion}</span>
          </div>
        `;
      case 'sidechainCompressor':
        return `
          <div class="param">
            <label>Threshold</label>
            <input type="range" min="-60" max="0" step="1" value="${settings.threshold}" data-param="threshold">
            <span class="value">${settings.threshold}dB</span>
          </div>
          <div class="param">
            <label>Ratio</label>
            <input type="range" min="1" max="20" step="0.5" value="${settings.ratio}" data-param="ratio">
            <span class="value">${settings.ratio}:1</span>
          </div>
          <div class="param">
            <label>Attack</label>
            <input type="range" min="0.001" max="0.1" step="0.001" value="${settings.attack}" data-param="attack">
            <span class="value">${(settings.attack * 1000).toFixed(1)}ms</span>
          </div>
          <div class="param">
            <label>Release</label>
            <input type="range" min="0.01" max="1" step="0.01" value="${settings.release}" data-param="release">
            <span class="value">${(settings.release * 1000).toFixed(0)}ms</span>
          </div>
        `;
      case 'lfo':
        return `
          <div class="param">
            <label>Rate</label>
            <input type="range" min="0.1" max="20" step="0.1" value="${settings.rate}" data-param="rate">
            <span class="value">${settings.rate}Hz</span>
          </div>
          <div class="param">
            <label>Waveform</label>
            <select data-param="waveform">
              <option value="sine" ${settings.waveform === 'sine' ? 'selected' : ''}>Sine</option>
              <option value="square" ${settings.waveform === 'square' ? 'selected' : ''}>Square</option>
              <option value="triangle" ${settings.waveform === 'triangle' ? 'selected' : ''}>Triangle</option>
              <option value="sawtooth" ${settings.waveform === 'sawtooth' ? 'selected' : ''}>Sawtooth</option>
            </select>
          </div>
          <div class="param">
            <label>Amount</label>
            <input type="range" min="0" max="1" step="0.1" value="${settings.amount}" data-param="amount">
            <span class="value">${settings.amount}</span>
          </div>
          <div class="param">
            <label>Target</label>
            <select data-param="target">
              <option value="filter" ${settings.target === 'filter' ? 'selected' : ''}>Filter</option>
              <option value="volume" ${settings.target === 'volume' ? 'selected' : ''}>Volume</option>
              <option value="pan" ${settings.target === 'pan' ? 'selected' : ''}>Pan</option>
            </select>
          </div>
        `;
      case 'vocoder':
        return `
          <div class="param">
            <label>Bands</label>
            <input type="range" min="8" max="32" step="8" value="${settings.bands}" data-param="bands">
            <span class="value">${settings.bands}</span>
          </div>
          <div class="param">
            <label>Carrier Gain</label>
            <input type="range" min="0" max="2" step="0.1" value="${settings.carrierGain}" data-param="carrierGain">
            <span class="value">${settings.carrierGain}</span>
          </div>
          <div class="param">
            <label>Modulator Gain</label>
            <input type="range" min="0" max="2" step="0.1" value="${settings.modulatorGain}" data-param="modulatorGain">
            <span class="value">${settings.modulatorGain}</span>
          </div>
        `;
      case 'eq':
        return settings.bands.map((band, idx) => `
          <div class="eq-band">
            <h4>Band ${idx + 1} (${band.freq}Hz)</h4>
            <div class="param">
              <label>Frequency</label>
              <input type="range" min="20" max="20000" step="10" value="${band.freq}" data-param="freq" data-band="${idx}">
              <span class="value">${band.freq}Hz</span>
            </div>
            <div class="param">
              <label>Gain</label>
              <input type="range" min="-12" max="12" step="0.5" value="${band.gain}" data-param="gain" data-band="${idx}">
              <span class="value">${band.gain}dB</span>
            </div>
            <div class="param">
              <label>Q</label>
              <input type="range" min="0.1" max="10" step="0.1" value="${band.q}" data-param="q" data-band="${idx}">
              <span class="value">${band.q}</span>
            </div>
          </div>
        `).join('');
      case 'spectrumAnalyzer':
        return `
          <div class="param">
            <label>Smoothing</label>
            <input type="range" min="0" max="1" step="0.1" value="${settings.smoothing}" data-param="smoothing">
            <span class="value">${settings.smoothing}</span>
          </div>
          <div class="param">
            <label>FFT Size</label>
            <select data-param="fftSize">
              <option value="256" ${settings.fftSize === 256 ? 'selected' : ''}>256</option>
              <option value="512" ${settings.fftSize === 512 ? 'selected' : ''}>512</option>
              <option value="1024" ${settings.fftSize === 1024 ? 'selected' : ''}>1024</option>
              <option value="2048" ${settings.fftSize === 2048 ? 'selected' : ''}>2048</option>
              <option value="4096" ${settings.fftSize === 4096 ? 'selected' : ''}>4096</option>
            </select>
          </div>
          <canvas id="spectrum-canvas" width="600" height="200" style="width: 100%; background: var(--fl-dark-gray); border: 1px solid var(--fl-light-gray); border-radius: 4px; margin-top: 8px;"></canvas>
        `;
      case 'reverb':
        return `
          <div class="param">
            <label>Wet</label>
            <input type="range" min="0" max="1" step="0.1" value="${settings.wet}" data-param="wet">
            <span class="value">${settings.wet}</span>
          </div>
          <div class="param">
            <label>Decay</label>
            <input type="range" min="0.1" max="5" step="0.1" value="${settings.decay}" data-param="decay">
            <span class="value">${settings.decay}s</span>
          </div>
        `;
      case 'delay':
        return `
          <div class="param">
            <label>Wet</label>
            <input type="range" min="0" max="1" step="0.1" value="${settings.wet}" data-param="wet">
            <span class="value">${settings.wet}</span>
          </div>
          <div class="param">
            <label>Time</label>
            <input type="range" min="0.1" max="2" step="0.01" value="${settings.time}" data-param="time">
            <span class="value">${settings.time}s</span>
          </div>
          <div class="param">
            <label>Feedback</label>
            <input type="range" min="0" max="0.9" step="0.1" value="${settings.feedback}" data-param="feedback">
            <span class="value">${settings.feedback}</span>
          </div>
        `;
      case 'distortion':
        return `
          <div class="param">
            <label>Amount</label>
            <input type="range" min="0" max="1" step="0.1" value="${settings.amount}" data-param="amount">
            <span class="value">${settings.amount}</span>
          </div>
        `;
      case 'filter':
        return `
          <div class="param">
            <label>Type</label>
            <select data-param="type">
              <option value="lowpass" ${settings.type === 'lowpass' ? 'selected' : ''}>Low Pass</option>
              <option value="highpass" ${settings.type === 'highpass' ? 'selected' : ''}>High Pass</option>
              <option value="bandpass" ${settings.type === 'bandpass' ? 'selected' : ''}>Band Pass</option>
            </select>
          </div>
          <div class="param">
            <label>Frequency</label>
            <input type="range" min="20" max="20000" step="10" value="${settings.frequency}" data-param="frequency">
            <span class="value">${settings.frequency}Hz</span>
          </div>
        `;
      default:
        return '';
    }
  }

  generateAIPattern(trackId) {
    const track = this.tracks[trackId];
    const pattern = Array(16).fill(false);

    // Generate patterns based on track type
    switch (track.type) {
      case 'drum':
        this.generateDrumPattern(track.name.toLowerCase(), pattern);
        break;
      case 'synth':
        this.generateSynthPattern(track.name.toLowerCase(), pattern);
        break;
      default:
        this.generateRandomPattern(pattern);
    }

    track.steps = pattern;
    this.updateStepVisual(trackId, -1); // Update all steps
    this.saveProject();
  }

  generateDrumPattern(drumType, pattern) {
    switch (drumType) {
      case 'kick':
        // Basic kick pattern: 1 and 3
        pattern[0] = true;
        pattern[8] = true;
        // Add some variation
        if (Math.random() > 0.7) pattern[12] = true;
        break;
      case 'snare':
        // Basic snare pattern: 2 and 4
        pattern[4] = true;
        pattern[12] = true;
        break;
      case 'hi-hat':
        // Hi-hat on most 16th notes with some variation
        for (let i = 0; i < 16; i++) {
          pattern[i] = Math.random() > 0.3;
        }
        // Ensure some rhythm
        pattern[0] = true;
        pattern[8] = true;
        break;
      default:
        // Clap or other percussion
        pattern[4] = true;
        pattern[12] = true;
        if (Math.random() > 0.5) pattern[6] = true;
    }
  }

  generateSynthPattern(synthType, pattern) {
    switch (synthType) {
      case 'bass':
        // Walking bass pattern
        const bassNotes = [0, 4, 7, 12]; // Root, 3rd, 5th, octave
        let noteIndex = 0;
        for (let i = 0; i < 16; i += 4) {
          pattern[i] = true;
          noteIndex = (noteIndex + 1) % bassNotes.length;
        }
        break;
      case 'lead':
        // Arpeggio pattern
        for (let i = 0; i < 16; i += 2) {
          pattern[i] = Math.random() > 0.3;
        }
        break;
      case 'pad':
        // Sustained chord pattern
        pattern[0] = true;
        if (Math.random() > 0.7) pattern[8] = true;
        break;
      default:
        // Random melody
        for (let i = 0; i < 16; i++) {
          pattern[i] = Math.random() > 0.7;
        }
    }
  }

  generateRandomPattern(pattern) {
    // Create a simple rhythmic pattern
    for (let i = 0; i < 16; i++) {
      pattern[i] = Math.random() > 0.6;
    }
    // Ensure some basic rhythm
    pattern[0] = true;
  }

  // Add AI pattern generation buttons to tracks
  addAIPatternButton(trackElement, trackId) {
    const header = trackElement.querySelector('.track-header');
    const aiButton = document.createElement('button');
    aiButton.className = 'ai-pattern-btn';
    aiButton.title = 'Generate AI Pattern';
    aiButton.innerHTML = '🤖';
    aiButton.addEventListener('click', () => this.generateAIPattern(trackId));
    header.appendChild(aiButton);
  }

  populatePatternEditor() {
    // Populate pattern editor - placeholder for now
    this.populatePianoKeys();
    console.log('Pattern editor populated');
  }

  populatePianoKeys() {
    const pianoKeys = document.getElementById('piano-keys');
    pianoKeys.innerHTML = '';

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaves = [2, 3, 4, 5, 6]; // 5 octaves

    octaves.reverse().forEach(octave => {
      notes.forEach(note => {
        const keyElement = document.createElement('div');
        keyElement.className = `key ${note.includes('#') ? 'black' : 'white'}`;
        keyElement.textContent = `${note}${octave}`;
        keyElement.dataset.note = `${note}${octave}`;
        pianoKeys.appendChild(keyElement);
      });
    });
  }

  playCurrentStep() {
    this.tracks.forEach(async (track) => {
      if (track.steps[this.currentStep] && !track.muted) {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        if (this.audioContext && this.audioContext.state === 'running') {
          this.playTrackSound(track);
        }
      }
    });
  }

  getTrackOutput(trackId) {
    if (!this.audioContext) return null;
    if (this.trackOutputs && this.trackOutputs.has(trackId)) return this.trackOutputs.get(trackId);
    const track = this.tracks[trackId] ? this.ensureTrackDefaults(this.tracks[trackId]) : null;
    const panner = (this.audioContext.createStereoPanner) ? this.audioContext.createStereoPanner() : null;
    const gain = this.audioContext.createGain();
    const volMul = Math.max(0, Math.min(2, ((track && track.params ? track.params.volume : 1) * (track && typeof track.mixerLevel === 'number' ? track.mixerLevel : 1))));
    gain.gain.setValueAtTime(volMul, this.audioContext.currentTime);
    if (panner) {
      panner.pan.setValueAtTime(track && track.params ? track.params.pan : 0, this.audioContext.currentTime);
      panner.connect(gain);
    }
    (panner || gain).connect(this.masterGain);
    const out = { input: (panner || gain), gain, panner };
    this.trackOutputs.set(trackId, out);
    return out;
  }

  playTrackSound(track) {
    const out = this.getTrackOutput(track.id);
    const dest = out && out.input ? out.input : this.masterGain;
    this.playSound(track.type, track.name.toLowerCase(), dest, track);
  }

  playSound(type, name, outputNode = null, track = null) {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      console.log('Audio context not ready');
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Ensure oscillator output enters the effects chain
    oscillator.connect(gainNode);

    // Create effects chain
    let currentNode = gainNode;

    // Per-track filter (pre master FX)
    if (track && track.params && track.params.filter) {
      const tFilter = this.audioContext.createBiquadFilter();
      tFilter.type = 'lowpass';
      tFilter.frequency.setValueAtTime(Math.max(20, Math.min(20000, track.params.filter.cutoff || 1500)), this.audioContext.currentTime);
      tFilter.Q.setValueAtTime(Math.max(0.1, Math.min(20, track.params.filter.resonance || 0.8)), this.audioContext.currentTime);
      currentNode.connect(tFilter);
      currentNode = tFilter;
    }

    // Add distortion if enabled
    if (this.masterEffects.distortion.enabled) {
      currentNode = this.createDistortion(currentNode, this.masterEffects.distortion.amount);
    }

    // Add filter if enabled
    if (this.masterEffects.filter.enabled) {
      currentNode = this.createFilter(currentNode, this.masterEffects.filter);
    }

    // Add delay if enabled
    if (this.masterEffects.delay.enabled) {
      currentNode = this.createDelay(currentNode, this.masterEffects.delay);
    }

    // Add reverb if enabled
    if (this.masterEffects.reverb.enabled) {
      currentNode = this.createReverb(currentNode, this.masterEffects.reverb);
    }

    // Connect to destination (track output -> master -> destination)
    if (outputNode) {
      currentNode.connect(outputNode);
    } else if (this.masterGain) {
      currentNode.connect(this.masterGain);
    } else {
      currentNode.connect(this.audioContext.destination);
    }

    // Generate sound based on type and name
    let frequency = this.getFrequencyForSound(type, name);
    let duration = this.getDurationForSound(type, name);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    if (track && track.params && typeof track.params.detune === 'number') {
      try { oscillator.detune.setValueAtTime(track.params.detune, this.audioContext.currentTime); } catch (_) {}
    }
    // Use track waveform if available, otherwise default
    if (track && track.params && track.params.waveform) {
      oscillator.type = track.params.waveform;
    } else {
      oscillator.type = this.getWaveformForSound(type, name);
    }

    // Envelope (per-track ADSR if available)
    const amp = track && track.params && track.params.amp ? track.params.amp : { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
    const now = this.audioContext.currentTime;
    const peak = 0.35;
    const sustainLevel = Math.max(0, Math.min(1, amp.s));
    const aTime = Math.max(0, amp.a);
    const dTime = Math.max(0, amp.d);
    const rTime = Math.max(0.02, amp.r);
    const total = Math.max(duration, aTime + dTime + 0.01);
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peak, now + aTime);
    gainNode.gain.linearRampToValueAtTime(peak * sustainLevel, now + aTime + dTime);
    // Release
    gainNode.gain.setTargetAtTime(0.0001, now + total, rTime);

    oscillator.start(now);
    oscillator.stop(now + total + rTime + 0.02);
  }

  getFrequencyForSound(type, name) {
    const nameLower = name.toLowerCase();
    switch (type) {
      case 'drum':
        switch (true) {
          case nameLower.includes('kick'): return 60;
          case nameLower.includes('snare'): return 200;
          case nameLower.includes('hi-hat'): return 8000;
          case nameLower.includes('crash'): return 300;
          default: return 150;
        }
      case 'synth':
        if (nameLower.startsWith('metronome-')) {
          const parsed = parseFloat(nameLower.replace('metronome-',''));
          return Number.isFinite(parsed) ? parsed : 1200;
        }
        switch (true) {
          case nameLower.includes('bass'): return 110;
          case nameLower.includes('lead'): return 660;
          case nameLower.includes('pad'): return 220;
          case nameLower === 'test': return 440; // A4 note for testing
          default: return 440;
        }
      default: return 440;
    }
  }

  getDurationForSound(type, name) {
    const nameLower = name.toLowerCase();
    switch (type) {
      case 'drum':
        switch (true) {
          case nameLower.includes('kick'): return 0.2;
          case nameLower.includes('snare'): return 0.15;
          case nameLower.includes('hi-hat'): return 0.05;
          default: return 0.1;
        }
      case 'synth':
        if (nameLower.startsWith('metronome-')) return 0.03;
        if (nameLower === 'test') return 0.5; // Longer test tone
        return 0.4;
      default: return 0.2;
    }
  }

  getWaveformForSound(type, name) {
    const nameLower = name.toLowerCase();
    switch (type) {
      case 'drum': return 'square';
      case 'synth':
        switch (true) {
          case nameLower.includes('pad'): return 'sine';
          case nameLower.includes('lead'): return 'sawtooth';
          case nameLower === 'test': return 'sine'; // Clean sine wave for testing
          default: return 'triangle';
        }
      default: return 'sine';
    }
  }

  createDistortion(inputNode, amount) {
    const distortion = this.audioContext.createWaveShaper();
    const k = amount * 50;
    const samples = 44100;
    const curve = new Float32Array(samples);

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = (3 + k) * x * 20 * Math.PI / (1 + k * Math.abs(x));
    }

    distortion.curve = curve;
    distortion.oversample = '4x';
    inputNode.connect(distortion);
    return distortion;
  }

  createFilter(inputNode, filterSettings) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = filterSettings.type;
    filter.frequency.setValueAtTime(filterSettings.frequency, this.audioContext.currentTime);
    filter.Q.setValueAtTime(1, this.audioContext.currentTime);
    inputNode.connect(filter);
    return filter;
  }

  createDelay(inputNode, delaySettings) {
    const delay = this.audioContext.createDelay();
    const feedback = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    delay.delayTime.setValueAtTime(delaySettings.time, this.audioContext.currentTime);
    feedback.gain.setValueAtTime(delaySettings.feedback, this.audioContext.currentTime);
    wetGain.gain.setValueAtTime(delaySettings.wet, this.audioContext.currentTime);
    dryGain.gain.setValueAtTime(1 - delaySettings.wet, this.audioContext.currentTime);

    inputNode.connect(dryGain);
    inputNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wetGain);

    const output = this.audioContext.createGain();
    dryGain.connect(output);
    wetGain.connect(output);

    return output;
  }

  createReverb(inputNode, reverbSettings) {
    // Simple reverb using convolution with white noise
    const reverb = this.audioContext.createConvolver();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    // Create impulse response
    const length = this.audioContext.sampleRate * reverbSettings.decay;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    reverb.buffer = impulse;
    wetGain.gain.setValueAtTime(reverbSettings.wet, this.audioContext.currentTime);
    dryGain.gain.setValueAtTime(1 - reverbSettings.wet, this.audioContext.currentTime);

    inputNode.connect(dryGain);
    inputNode.connect(reverb);
    reverb.connect(wetGain);

    const output = this.audioContext.createGain();
    dryGain.connect(output);
    wetGain.connect(output);

    return output;
  }

  applyTrackParams(trackId) {
    if (!this.audioContext) return;
    const out = this.getTrackOutput(trackId);
    const track = this.tracks[trackId] ? this.ensureTrackDefaults(this.tracks[trackId]) : null;
    if (!out || !track) return;
    const volMul = Math.max(0, Math.min(2, (track.params.volume || 1) * (typeof track.mixerLevel === 'number' ? track.mixerLevel : 1)));
    if (out.gain) out.gain.gain.setValueAtTime(volMul, this.audioContext.currentTime);
    if (out.panner && out.panner.pan && typeof out.panner.pan.setValueAtTime === 'function') {
      out.panner.pan.setValueAtTime(track.params.pan || 0, this.audioContext.currentTime);
    }
  }

  // Drum Machine Methods
  async showDrumMachine() {
    if (!this.drumMachineUI) {
      // Initialize drum machine UI
      if (typeof DrumMachineUI !== 'undefined') {
        this.drumMachineUI = new DrumMachineUI(this);
        // Wait for async initialization to complete
        await this.drumMachineUI.init();
      } else {
        console.error('DrumMachineUI class not found');
        return;
      }
    }
    
    if (this.drumMachineUI) {
      this.drumMachineUI.show();
    }
  }

  hideDrumMachine() {
    if (this.drumMachineUI) {
      this.drumMachineUI.hide();
    }
  }
}

// Initialize the app when DOM is loaded (browser only)
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    // Expose globally for plugins
    window.flStudio = new FLStudio();
  });
}

// Export for testing environments (Node/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FLStudio };
}
