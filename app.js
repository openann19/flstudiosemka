// FL Studio Web App
import _ from 'https://cdn.jsdelivr.net/npm/lodash-es@4.17.21/+esm';

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
    this.clipCounter = 0;
    this.arrangementLengthBarsDefault = 8;
    this.timelineUtils = (typeof window !== 'undefined' && window.timelineUtils) ? window.timelineUtils : null;
    if (!this.timelineUtils) {
      this.timelineUtils = this.createTimelineUtilsFallback();
    }
    this.songPositionBeats = 0;
    this.trackColorPalette = ['#FF9933', '#FF5E57', '#00C5FF', '#8C5AFF', '#FFD166', '#6DD400', '#F6A6FF', '#4CD964'];
    this.timelineScrollWrapper = null;
    this.timelineScrollHandler = null;
    this.pointerState = {
      isPointerDown: false,
      originBeat: 0,
      currentBeat: 0,
      trackId: null,
      clipId: null,
      laneElement: null,
      clipElement: null,
      lastPaintBeat: null
    };

    console.debug('Pointer state initialized', this.pointerState);

    this.handleGlobalPointerMove = this.handleGlobalPointerMove.bind(this);
    this.handleGlobalPointerUp = this.handleGlobalPointerUp.bind(this);

    this.audioUnlockState = 'pending';
    this._audioUnlockPromise = null;
    this._resolveAudioUnlock = null;
    this._audioUnlockCallbacks = new Set();
    this._audioUnlockHandler = null;
    this._audioUnlockEvents = ['pointerdown', 'touchstart', 'mousedown', 'keydown'];

    // Audio effects system
    this.masterEffects = {
      reverb: { enabled: false, wet: 0.3, decay: 2.0 },
      delay: { enabled: false, wet: 0.2, time: 0.25, feedback: 0.3 },
      distortion: { enabled: false, amount: 0.5 },
      filter: { enabled: false, frequency: 1000, type: 'lowpass' }
    };

    this.trackEffects = {}; // Per-track effects
    this.drumMachineUI = null;
    this.drumMachineState = null;
    this.drumMachineStateApplied = false;

    // Professional DAW systems - initialized after audio context
    this.instrumentManager = null;
    this.synthesizer = null;
    this.audioRecorder = null;
    this.midiInput = null;
    this.midiKeyboard = null;
    this.trackMixers = new Map(); // trackId -> TrackMixer
    this.busManager = null;
    this.audioRenderer = null;
    this.projectExporter = null;
    this.pianoRollEditor = null;
    this.undoRedo = null;
    this.activeVoices = new Map(); // Track active synthesizer voices
    this.commandPalette = null; // Command palette for quick actions
    this.lufsMeter = null; // LUFS meter for master bus
    this.audioWorkletNode = null; // AudioWorklet node for real-time synthesis

    this.init();
    this._setupAudioUnlockHandling();
  }

  init() {
    this.setupEventListeners();
    this.createInitialTracks();
    this.initializeDefaultArrangement();
    this.updateUI();
    this.startAutoSave();
    this.loadProject(); // Try to load last project
    this.setupDrumMachineUI();
    this.syncExternalTempo();
    
    // Initialize command palette immediately (doesn't need audio)
    if (typeof CommandPalette !== 'undefined') {
      this.commandPalette = new CommandPalette(this);
    }
    
    // Initialize channel rack enhancements
    this.initChannelRackEnhancements();
    
    // Initialize professional DAW systems when audio is ready
    this.onAudioUnlock(() => {
      this.initializeProfessionalSystems();
    }, { invokeImmediately: false });
  }

  /**
   * Initialize channel rack enhancements (context menu, keyboard shortcuts)
   */
  initChannelRackEnhancements() {
    // Context menu for tracks
    document.addEventListener('contextmenu', (e) => {
      const track = e.target.closest('.track');
      if (track) {
        e.preventDefault();
        const trackId = parseInt(track.dataset.trackId, 10);
        this.showChannelContextMenu(e.pageX, e.pageY, trackId);
        track.classList.add('context-active');
      }
    });

    // Close menu on click away
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.channel-context-menu')) {
        this.closeChannelContextMenu();
        document.querySelectorAll('.track.context-active').forEach(t => t.classList.remove('context-active'));
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Pattern operations
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c' && this._selectedTrackId !== null) {
          e.preventDefault();
          this.copyPattern(this._selectedTrackId);
        } else if (e.key === 'v' && this._selectedTrackId !== null) {
          e.preventDefault();
          this.pastePattern(this._selectedTrackId);
        } else if (e.key === 'd' && this._selectedTrackId !== null) {
          e.preventDefault();
          this.duplicateTrack(this._selectedTrackId);
        }
      }
      
      // Delete pattern
      if ((e.key === 'Delete' || e.key === 'Backspace') && this._selectedTrackId !== null) {
        e.preventDefault();
        this.clearPattern(this._selectedTrackId);
      }
      
      // Edit parameters
      if (e.key === 'e' && this._selectedTrackId !== null) {
        e.preventDefault();
        this.openChannelSettings(this._selectedTrackId);
      }
    });

    // Track selection
    document.addEventListener('click', (e) => {
      const track = e.target.closest('.track');
      if (track) {
        this._selectedTrackId = parseInt(track.dataset.trackId, 10);
      }
    });
  }

  _selectedTrackId = null;
  _contextMenu = null;

  /**
   * Show context menu for track
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} trackId - Track ID
   */
  showChannelContextMenu(x, y, trackId) {
    this.closeChannelContextMenu();
    
    const track = this.tracks[trackId];
    if (!track) return;
    
    const hasPattern = track.steps.some(s => s);
    
    const menu = document.createElement('div');
    menu.className = 'channel-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    menu.innerHTML = `
      <div class="channel-context-menu-item" data-action="edit-params">
        <span><span class="menu-item-icon">⚙️</span>Edit Parameters</span>
        <span class="menu-item-shortcut">E</span>
      </div>
      <div class="channel-context-menu-item" data-action="piano-roll">
        <span><span class="menu-item-icon">🎹</span>Piano Roll</span>
        <span class="menu-item-shortcut">P</span>
      </div>
      <div class="menu-separator"></div>
      <div class="channel-context-menu-item" data-action="fill-each-2">
        <span><span class="menu-item-icon">▦</span>Fill Each 2 Steps</span>
      </div>
      <div class="channel-context-menu-item" data-action="fill-each-4">
        <span><span class="menu-item-icon">▦</span>Fill Each 4 Steps</span>
      </div>
      <div class="channel-context-menu-item" data-action="fill-each-8">
        <span><span class="menu-item-icon">▦</span>Fill Each 8 Steps</span>
      </div>
      <div class="channel-context-menu-item" data-action="fill-all">
        <span><span class="menu-item-icon">█</span>Fill All Steps</span>
      </div>
      <div class="menu-separator"></div>
      <div class="channel-context-menu-item ${hasPattern ? '' : 'disabled'}" data-action="copy">
        <span><span class="menu-item-icon">📋</span>Copy Pattern</span>
        <span class="menu-item-shortcut">Ctrl+C</span>
      </div>
      <div class="channel-context-menu-item ${this._patternClipboard ? '' : 'disabled'}" data-action="paste">
        <span><span class="menu-item-icon">📄</span>Paste Pattern</span>
        <span class="menu-item-shortcut">Ctrl+V</span>
      </div>
      <div class="menu-separator"></div>
      <div class="channel-context-menu-item" data-action="randomize">
        <span><span class="menu-item-icon">🎲</span>Randomize</span>
      </div>
      <div class="channel-context-menu-item" data-action="humanize">
        <span><span class="menu-item-icon">👤</span>Humanize Timing</span>
      </div>
      <div class="menu-separator"></div>
      <div class="channel-context-menu-item ${hasPattern ? '' : 'disabled'}" data-action="clear">
        <span><span class="menu-item-icon">🗑</span>Clear Pattern</span>
        <span class="menu-item-shortcut">Del</span>
      </div>
      <div class="menu-separator"></div>
      <div class="channel-context-menu-item" data-action="duplicate-track">
        <span><span class="menu-item-icon">➕</span>Duplicate Track</span>
        <span class="menu-item-shortcut">Ctrl+D</span>
      </div>
      <div class="channel-context-menu-item" data-action="delete-track">
        <span><span class="menu-item-icon">❌</span>Delete Track</span>
      </div>
    `;
    
    // Add click handlers
    menu.querySelectorAll('.channel-context-menu-item:not(.disabled)').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = item.dataset.action;
        this.handleContextMenuAction(action, trackId);
        this.closeChannelContextMenu();
      });
    });
    
    document.body.appendChild(menu);
    this._contextMenu = menu;
    this._selectedTrackId = trackId;
    
    // Adjust position if menu goes offscreen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = `${y - rect.height}px`;
    }
  }

  /**
   * Close context menu
   */
  closeChannelContextMenu() {
    if (this._contextMenu) {
      this._contextMenu.remove();
      this._contextMenu = null;
    }
  }

  /**
   * Handle context menu action
   * @param {string} action - Action name
   * @param {number} trackId - Track ID
   */
  handleContextMenuAction(action, trackId) {
    switch (action) {
      case 'edit-params':
        this.openChannelSettings(trackId);
        break;
      case 'piano-roll':
        this.switchView('pattern');
        console.log(`[DEBUG] Opening piano roll for track ${trackId}`);
        break;
      case 'fill-each-2':
        this.fillPattern(trackId, 2);
        break;
      case 'fill-each-4':
        this.fillPattern(trackId, 4);
        break;
      case 'fill-each-8':
        this.fillPattern(trackId, 8);
        break;
      case 'fill-all':
        this.fillPattern(trackId, 1);
        break;
      case 'copy':
        this.copyPattern(trackId);
        break;
      case 'paste':
        this.pastePattern(trackId);
        break;
      case 'randomize':
        this.randomizePattern(trackId);
        break;
      case 'humanize':
        this.humanizePattern(trackId);
        break;
      case 'clear':
        this.clearPattern(trackId);
        break;
      case 'duplicate-track':
        this.duplicateTrack(trackId);
        break;
      case 'delete-track':
        this.deleteTrack(trackId);
        break;
    }
  }

  /**
   * Initialize all professional DAW systems
   */
  initializeProfessionalSystems() {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      console.warn('FLStudio: Cannot initialize professional systems without audio context');
      return;
    }

    try {
      // Audio engine
      if (typeof InstrumentManager !== 'undefined') {
        this.instrumentManager = new InstrumentManager(this.audioContext);
      }
      if (typeof Synthesizer !== 'undefined') {
        this.synthesizer = new Synthesizer(this.audioContext);
      }
      if (typeof AudioRecorder !== 'undefined') {
        this.audioRecorder = new AudioRecorder(this.audioContext);
      }

      // MIDI
      if (typeof MIDIInput !== 'undefined') {
        this.midiInput = new MIDIInput();
        this.midiInput.initialize().then(success => {
          if (success) {
            this.setupMIDI();
          }
        });
      }
      if (typeof MIDIKeyboard !== 'undefined') {
        this.midiKeyboard = new MIDIKeyboard();
        this.setupVirtualKeyboard();
      }

      // Mixer
      if (typeof BusManager !== 'undefined') {
        this.busManager = new BusManager(this.audioContext);
        
        // Add LUFS meter to master bus
        if (typeof LUFSMeter !== 'undefined') {
          this.lufsMeter = new LUFSMeter(this.audioContext);
          this.busManager.getMasterBus().connect(this.lufsMeter.getInput());
          
          // Update LUFS display periodically
          this.startLUFSUpdate();
        }
      }
      this.initializeTrackMixers();
      
      // Load AudioWorklet processor if available (Electron/desktop)
      this.loadAudioWorkletProcessor();

      // Export
      if (typeof AudioRenderer !== 'undefined') {
        this.audioRenderer = new AudioRenderer(this.audioContext);
      }
      if (typeof ProjectExporter !== 'undefined') {
        this.projectExporter = new ProjectExporter(this);
      }

      // Piano roll
      this.setupPianoRoll();

      // Undo/Redo
      if (typeof UndoRedo !== 'undefined') {
        this.undoRedo = new UndoRedo();
      }

      // Command Palette is initialized in init() so it's always available

      console.log('FLStudio: Professional DAW systems initialized');
    } catch (error) {
      console.error('FLStudio: Failed to initialize professional systems', error);
    }
  }

  /**
   * Setup MIDI input
   */
  setupMIDI() {
    if (!this.midiInput) return;

    this.midiInput.setNoteOnCallback((event) => {
      this.handleMIDINoteOn(event);
    });

    this.midiInput.setNoteOffCallback((event) => {
      this.handleMIDINoteOff(event);
    });

    // Connect to all available inputs
    this.midiInput.connect('all');
  }

  /**
   * Setup virtual keyboard
   */
  setupVirtualKeyboard() {
    if (!this.midiKeyboard) return;

    this.midiKeyboard.setNoteOnCallback((event) => {
      this.handleMIDINoteOn(event);
    });

    this.midiKeyboard.setNoteOffCallback((event) => {
      this.handleMIDINoteOff(event);
    });

    // Enable when pattern editor is active
    // Will be toggled when switching views
  }

  /**
   * Handle MIDI note on
   */
  handleMIDINoteOn(event) {
    const { note, velocity } = event;
    const frequency = 440 * Math.pow(2, (note - 69) / 12);

    // Play on current track or selected track
    const activeTrack = this.getActiveTrack();
    if (activeTrack && this.synthesizer) {
      const voiceId = this.synthesizer.playNote(frequency, velocity);
      if (voiceId) {
        this.activeVoices.set(note, { voiceId, trackId: activeTrack.id });
      }
    }
  }

  /**
   * Handle MIDI note off
   */
  handleMIDINoteOff(event) {
    const { note } = event;
    const voice = this.activeVoices.get(note);
    if (voice && this.synthesizer) {
      this.synthesizer.stopNote(voice.voiceId);
      this.activeVoices.delete(note);
    }
  }

  /**
   * Get active track (for MIDI input)
   */
  getActiveTrack() {
    // Return first track for now, can be enhanced with track selection
    return this.tracks.length > 0 ? this.tracks[0] : null;
  }

  /**
   * Initialize track mixers for all tracks
   */
  initializeTrackMixers() {
    if (typeof TrackMixer === 'undefined') return;

    this.tracks.forEach(track => {
      if (!this.trackMixers.has(track.id)) {
        const mixer = new TrackMixer(this.audioContext, track.id);
        this.trackMixers.set(track.id, mixer);
      }
    });
  }

  /**
   * Get track mixer
   */
  getTrackMixer(trackId) {
    if (!this.trackMixers.has(trackId)) {
      if (typeof TrackMixer !== 'undefined') {
        const mixer = new TrackMixer(this.audioContext, trackId);
        this.trackMixers.set(trackId, mixer);
      } else {
        return null;
      }
    }
    return this.trackMixers.get(trackId);
  }

  /**
   * Setup piano roll editor
   */
  setupPianoRoll() {
    if (typeof PianoRollEditor === 'undefined') return;

    const canvas = document.getElementById('piano-roll-canvas');
    if (canvas && this.audioContext) {
      this.pianoRollEditor = new PianoRollEditor(canvas, this.audioContext);
    }
  }

  /**
   * Load AudioWorklet processor for real-time synthesis
   */
  async loadAudioWorkletProcessor() {
    if (!this.audioContext || !this.audioContext.audioWorklet) {
      console.log('[AudioWorklet] Not available in this context');
      return;
    }

    try {
      // Load the AudioWorklet processor
      // Path is relative to the HTML file location
      // In Electron, we can use absolute paths via electronAPI if needed
      let processorPath = 'apps/desktop/audio-worklets/simple-synth-processor.js';
      
      // Try to use Electron API if available
      if (window.electronAPI) {
        // In Electron, we might need to construct an absolute path
        // For now, use relative path - Electron should resolve it
        processorPath = './apps/desktop/audio-worklets/simple-synth-processor.js';
      }
      
      await this.audioContext.audioWorklet.addModule(processorPath);
      
      // Create AudioWorkletNode
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'simple-synth-processor'
      );
      
      // Connect to master bus or destination
      if (this.busManager) {
        this.audioWorkletNode.connect(this.busManager.getMasterBus());
      } else {
        this.audioWorkletNode.connect(this.audioContext.destination);
      }
      
      console.log('[AudioWorklet] Simple synth processor loaded');
    } catch (error) {
      console.warn('[AudioWorklet] Failed to load processor:', error);
      // Fallback to regular synthesizer
    }
  }

  /**
   * Play note using AudioWorklet (if available)
   * @param {number} frequency - Frequency in Hz
   * @param {number} velocity - Velocity (0-1)
   * @returns {number|null} Voice ID
   */
  playNoteAudioWorklet(frequency, velocity = 1.0) {
    if (!this.audioWorkletNode) {
      return null;
    }

    const voiceId = Date.now(); // Simple ID generation
    
    this.audioWorkletNode.port.postMessage({
      type: 'note-on',
      data: {
        frequency,
        velocity,
        voiceId
      }
    });

    return voiceId;
  }

  /**
   * Stop note using AudioWorklet
   * @param {number} voiceId - Voice ID
   */
  stopNoteAudioWorklet(voiceId) {
    if (!this.audioWorkletNode) {
      return;
    }

    this.audioWorkletNode.port.postMessage({
      type: 'note-off',
      data: { voiceId }
    });
  }

  /**
   * Start LUFS meter updates
   */
  startLUFSUpdate() {
    if (!this.lufsMeter) return;

    // Update LUFS display every 100ms
    setInterval(() => {
      const values = this.lufsMeter.getValues();
      this.updateLUFSDisplay(values);
    }, 100);
  }

  /**
   * Update LUFS display in UI
   * @param {Object} values - LUFS values
   */
  updateLUFSDisplay(values) {
    // Find or create LUFS display element
    let display = document.getElementById('lufs-display');
    if (!display) {
      display = document.createElement('div');
      display.id = 'lufs-display';
      display.className = 'lufs-display';
      
      // Add to mixer panel
      const mixerPanel = document.getElementById('mixer-panel');
      if (mixerPanel) {
        const header = mixerPanel.querySelector('.panel-header');
        if (header) {
          header.appendChild(display);
        }
      }
    }

    // Format values
    const integrated = values.integrated.toFixed(1);
    const shortTerm = values.shortTerm.toFixed(1);
    const momentary = values.momentary.toFixed(1);
    const peak = values.peak > -Infinity ? values.peak.toFixed(1) : '-∞';

    display.innerHTML = `
      <div class="lufs-value">
        <span class="lufs-label">Integrated:</span>
        <span class="lufs-number">${integrated} LUFS</span>
      </div>
      <div class="lufs-value">
        <span class="lufs-label">Short-term:</span>
        <span class="lufs-number">${shortTerm} LUFS</span>
      </div>
      <div class="lufs-value">
        <span class="lufs-label">Momentary:</span>
        <span class="lufs-number">${momentary} LUFS</span>
      </div>
      <div class="lufs-value">
        <span class="lufs-label">Peak:</span>
        <span class="lufs-number">${peak} dB</span>
      </div>
    `;
  }

  async adoptAudioContext(context) {
    if (!context || typeof context.resume !== 'function') {
      console.warn('FLStudio: Invalid audio context supplied to adoptAudioContext');
      return this.audioContext;
    }

    if (this.audioContext === context && this.audioContext?.state !== 'closed') {
      try {
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn('FLStudio: Failed to resume adopted audio context', error);
      }
      return this.audioContext;
    }

    this.audioContext = context;
    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.warn('FLStudio: Failed to resume adopted audio context', error);
    }
    return this.audioContext;
  }

  getAudioContext() {
    return this.audioContext;
  }

  getBpm() {
    return this.bpm || 140;
  }

  sanitizeBpm(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return Math.max(60, Math.min(200, this.bpm || 140));
    }
    return Math.max(60, Math.min(200, numeric));
  }

  syncExternalTempo() {
    if (window.vocalStudio && typeof window.vocalStudio.updateTempo === 'function') {
      window.vocalStudio.updateTempo(this.bpm);
    }
  }

  startAutoSave() {
    // Auto-save every 30 seconds
    this.autoSaveTimer = setInterval(() => {
      this.saveProject(true);
    }, 30000);
  }

  saveProject(autoSave = false) {
    const drumMachineState = this.drumMachineUI ? this.drumMachineUI.getState() : this.drumMachineState;
    if (drumMachineState) {
      this.drumMachineState = drumMachineState;
      this.drumMachineStateApplied = true;
    }

    const projectData = {
      name: this.projectName,
      bpm: this.bpm,
      tracks: this.tracks,
      currentPattern: this.currentPattern,
      savedAt: new Date().toISOString(),
      arrangements: this.arrangements,
      currentArrangementId: this.currentArrangementId,
      zoomLevel: this.zoomLevel,
      snapSetting: this.snapSetting,
      selectedTool: this.selectedTool,
      clipCounter: this.clipCounter,
      drumMachineState: drumMachineState || null
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
        this.bpm = this.sanitizeBpm(projectData.bpm ?? this.bpm ?? 140);
        this.tracks = projectData.tracks || [];
        this.currentPattern = projectData.currentPattern || 1;
        this.arrangements = projectData.arrangements || [];
        this.currentArrangementId = projectData.currentArrangementId || (this.arrangements[0]?.id || null);
        this.zoomLevel = projectData.zoomLevel || this.zoomLevel || 1;
        this.snapSetting = projectData.snapSetting || this.snapSetting || 'beat';
        this.selectedTool = projectData.selectedTool || this.selectedTool || 'draw';
        this.clipCounter = projectData.clipCounter || this.clipCounter || 0;
        this.drumMachineState = projectData.drumMachineState || null;
        this.drumMachineStateApplied = false;

        // Re-render tracks
        document.querySelector('.channel-rack').innerHTML = '';
        this.tracks.forEach(track => this.renderTrack(track));

        if (!this.arrangements.length) {
          this.initializeDefaultArrangement();
        } else {
          this.ensureArrangementsConsistency();
        }

        this.syncExternalTempo();
        this.updateUI();
        this.applyDrumMachineStateIfReady();
        console.log('Project loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  }

  setupDrumMachineUI() {
    if (this.drumMachineUI) {
      return;
    }

    if (typeof window === 'undefined' || typeof window.DrumMachineUIUltra !== 'function') {
      console.warn('DrumMachineUIUltra not available on window scope yet.');
      return;
    }

    try {
      this.drumMachineUI = new window.DrumMachineUIUltra(this);
      const host = document.getElementById('drum-machine-container') || undefined;
      Promise.resolve(this.drumMachineUI.mount(host)).then(() => {
        this.drumMachineUI.setStateListener((state) => this.handleDrumMachineStateChange(state));
        if (this.drumMachineState) {
          this.applyDrumMachineStateIfReady();
        } else {
          const currentState = this.drumMachineUI.getState();
          if (currentState) {
            this.drumMachineState = currentState;
            this.drumMachineStateApplied = true;
          }
        }
      }).catch((error) => {
        console.error('Failed to mount Drum Machine UI', error);
        this.drumMachineUI = null;
      });
    } catch (error) {
      console.error('Unable to initialize Drum Machine UI', error);
      this.drumMachineUI = null;
    }
  }

  handleDrumMachineStateChange(state) {
    if (!state || typeof state !== 'object') {
      return;
    }
    this.drumMachineState = state;
    this.drumMachineStateApplied = true;
    this.saveProject(true);
  }

  applyDrumMachineStateIfReady() {
    if (this.drumMachineUI && this.drumMachineState && !this.drumMachineStateApplied) {
      this.drumMachineUI.applyState(this.drumMachineState);
      this.drumMachineStateApplied = true;
    }
  }

  toggleDrumMachineVisibility() {
    if (!this.drumMachineUI) {
      this.setupDrumMachineUI();
    }

    if (!this.drumMachineUI) {
      return;
    }

    const toggleBtn = document.getElementById('toggle-drum-machine');
    const panel = document.getElementById('drum-machine-panel');
    const isVisible = panel && panel.style.display !== 'none';

    if (isVisible) {
      this.drumMachineUI.hide();
      if (toggleBtn) {
        toggleBtn.textContent = 'Open Drum Machine';
        toggleBtn.setAttribute('aria-pressed', 'false');
      }
    } else {
      this.applyDrumMachineStateIfReady();
      Promise.resolve(this.drumMachineUI.show()).then(() => {
        if (toggleBtn) {
          toggleBtn.textContent = 'Close Drum Machine';
          toggleBtn.setAttribute('aria-pressed', 'true');
        }
      }).catch((error) => {
        console.error('Failed to open Drum Machine panel', error);
      });
    }
  }

  /**
   * Get project data for export/rendering
   * @returns {Object} Project data
   */
  getProjectData() {
    return {
      name: this.projectName,
      bpm: this.bpm,
      tracks: this.tracks,
      currentPattern: this.currentPattern,
      arrangements: this.arrangements,
      currentArrangementId: this.currentArrangementId,
      masterEffects: this.masterEffects,
      trackEffects: Object.fromEntries(this.trackMixers),
      duration: this.getArrangementTotalBeats() * (60 / this.bpm)
    };
  }

  exportProject() {
    const projectData = this.getProjectData();
    projectData.exportedAt = new Date().toISOString();
    projectData.version = '1.0';

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
        this.bpm = this.sanitizeBpm(projectData.bpm ?? this.bpm ?? 140);
        this.tracks = projectData.tracks || [];
        this.currentPattern = projectData.currentPattern || 1;
        this.arrangements = projectData.arrangements || this.arrangements;
        this.currentArrangementId = projectData.currentArrangementId || this.currentArrangementId;
        this.zoomLevel = projectData.zoomLevel || this.zoomLevel;
        this.snapSetting = projectData.snapSetting || this.snapSetting;
        this.selectedTool = projectData.selectedTool || this.selectedTool;
        this.clipCounter = projectData.clipCounter || this.clipCounter;
        this.drumMachineState = projectData.drumMachineState || null;
        this.drumMachineStateApplied = false;

        // Re-render tracks
        document.querySelector('.channel-rack').innerHTML = '';
        this.tracks.forEach(track => this.renderTrack(track));

        if (!this.arrangements.length) {
          this.initializeDefaultArrangement();
        } else {
          this.ensureArrangementsConsistency();
        }

        this.syncExternalTempo();
        this.updateUI();
        this.saveProject();
        this.applyDrumMachineStateIfReady();
        console.log('Project imported successfully');
      } catch (error) {
        console.error('Failed to import project:', error);
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  }

  setupEventListeners() {
    // View tabs
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchView(e.target.dataset.view));
    });

    // Transport controls
    document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
    document.getElementById('stop-btn').addEventListener('click', () => this.stop());
    document.getElementById('record-btn').addEventListener('click', () => this.toggleRecord());
    document.getElementById('test-sound-btn').addEventListener('click', () => this.testSound());

    // BPM controls
    document.getElementById('bpm-up').addEventListener('click', () => this.adjustBPM(1));
    document.getElementById('bpm-down').addEventListener('click', () => this.adjustBPM(-1));
    document.getElementById('bpm-input').addEventListener('change', (e) => {
      const nextValue = this.sanitizeBpm(parseInt(e.target.value, 10));
      this.bpm = nextValue;
      this.updateUI();
      this.syncExternalTempo();
    });

    // Pattern selector
    document.getElementById('pattern-select').addEventListener('change', (e) => {
      this.currentPattern = parseInt(e.target.value);
      this.updateUI();
    });

    const drumMachineToggle = document.getElementById('toggle-drum-machine');
    if (drumMachineToggle) {
      drumMachineToggle.addEventListener('click', () => this.toggleDrumMachineVisibility());
    }

    // Browser functionality
    document.querySelectorAll('.browser-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchBrowserCategory(e.target.dataset.category));
    });

    document.querySelectorAll('.tree-item').forEach(item => {
      item.addEventListener('click', (e) => this.selectBrowserItem(e.target));
    });

    document.getElementById('browser-search').addEventListener('input', (e) => this.searchSounds(e.target.value));

    // File menu
    document.getElementById('save-btn').addEventListener('click', () => this.saveProject());
    document.getElementById('export-btn').addEventListener('click', () => this.exportProject());
    const exportAudioBtn = document.getElementById('export-audio-btn');
    if (exportAudioBtn) {
      exportAudioBtn.addEventListener('click', async () => {
        try {
          exportAudioBtn.disabled = true;
          exportAudioBtn.textContent = 'Exporting...';
          await this.exportAudio({ format: 'wav', bitDepth: 16 });
          exportAudioBtn.textContent = 'Export Audio';
          console.log('Audio export completed');
        } catch (error) {
          console.error('Audio export failed', error);
          alert('Failed to export audio: ' + error.message);
          exportAudioBtn.textContent = 'Export Audio';
        } finally {
          exportAudioBtn.disabled = false;
        }
      });
    }
    document.getElementById('import-input').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.importProject(e.target.files[0]);
      }
    });

    // Load audio sample
    const loadSampleInput = document.getElementById('load-sample-input');
    if (loadSampleInput) {
      loadSampleInput.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
          try {
            const file = e.target.files[0];
            const buffer = await this.loadAudioSample(file);
            
            // Create a new track for the sample
            const trackName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            this.addTrack(trackName, 'sample');
            
            // Assign sample to the newly created track
            const newTrack = this.tracks[this.tracks.length - 1];
            if (newTrack) {
              newTrack.sampleBuffer = buffer;
              if (typeof SamplePlayer !== 'undefined') {
                newTrack.samplePlayer = new SamplePlayer(this.audioContext, buffer);
              }
            }
            
            console.log('Sample loaded:', trackName);
          } catch (error) {
            console.error('Failed to load sample', error);
            alert('Failed to load audio sample: ' + error.message);
          }
        }
      });
    }

    // Playlist controls
    document.querySelectorAll('#playlist-tools .tool-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setSelectedTool(btn.dataset.tool));
    });

    const snapSelect = document.getElementById('snap-select');
    if (snapSelect) {
      snapSelect.addEventListener('change', (e) => {
        this.snapSetting = e.target.value;
        this.renderPlaylist();
      });
    }

    const arrangementSelect = document.getElementById('arrangement-select');
    if (arrangementSelect) {
      arrangementSelect.addEventListener('change', (e) => {
        this.currentArrangementId = e.target.value;
        this.ensureArrangementsConsistency();
        this.songPositionBeats = 0;
        this.renderPlaylist();
        this.updateTimelinePositionLabel();
      });
    }

    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => this.adjustZoom(0.2));
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => this.adjustZoom(-0.2));
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Global pointer listeners for playlist interactions
    document.addEventListener('pointermove', this.handleGlobalPointerMove);
    document.addEventListener('pointerup', this.handleGlobalPointerUp);
    document.addEventListener('pointercancel', this.handleGlobalPointerUp);
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
      this.syncExternalTempo();
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

  switchView(view) {
    // Update active tab
    document.querySelectorAll('.view-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-view="${view}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Show/hide panels
    document.querySelectorAll('.panel').forEach(panel => {
      panel.style.display = 'none';
    });
    const panel = document.getElementById(`${view}-panel`);
    if (panel) {
      panel.style.display = 'block';
    }

    // Populate view if needed
    switch (view) {
      case 'playlist':
        this.renderPlaylist();
        break;
      case 'mixer':
        this.populateMixer();
        break;
      case 'pattern':
        this.populatePatternEditor();
        // Enable virtual keyboard for pattern editor
        if (this.midiKeyboard) {
          this.midiKeyboard.enable();
        }
        break;
      case 'effects':
        this.populateEffects();
        break;
      default:
        // Disable virtual keyboard for other views
        if (this.midiKeyboard && view !== 'pattern') {
          this.midiKeyboard.disable();
        }
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
      this.drumMachineUI?.startSequencer?.();
    } else {
      playBtn.classList.remove('active');
      this.stopPlayback();
      this.drumMachineUI?.stopSequencer?.();
    }
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    document.getElementById('play-btn').classList.remove('active');
    this.stopPlayback();
    this.songPositionBeats = 0;
    this.updateTimelinePositionLabel();
    this.updatePlayheadPosition();
    this.updateUI();
    if (this.drumMachineUI) {
      this.drumMachineUI.stopSequencer?.();
    }
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

  /**
   * Toggle recording
   */
  async toggleRecord() {
    if (!this.audioRecorder) {
      console.warn('AudioRecorder not available');
      return;
    }

    try {
      if (this.audioRecorder.isRecording) {
        // Stop recording
        const buffer = await this.audioRecorder.stopRecording();
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
          recordBtn.classList.remove('active');
        }
        
        // Get active track
        const activeTrack = this.getActiveTrack();
        if (activeTrack && buffer) {
          // Store recorded buffer in track
          activeTrack.recordedBuffer = buffer;
          if (typeof SamplePlayer !== 'undefined') {
            activeTrack.samplePlayer = new SamplePlayer(this.audioContext, buffer);
          }
          console.log('Recording stopped, buffer saved to track:', activeTrack.name);
        }
      } else {
        // Start recording
        const activeTrack = this.getActiveTrack();
        if (!activeTrack) {
          console.warn('No active track for recording');
          return;
        }

        // Initialize recorder if needed
        if (!this.audioRecorder.mediaSource) {
          await this.audioRecorder.initialize();
        }

        // Arm track
        this.audioRecorder.armTrack(activeTrack.id, true);
        
        // Start recording
        await this.audioRecorder.startRecording(activeTrack.id);
        
        const recordBtn = document.getElementById('record-btn');
        if (recordBtn) {
          recordBtn.classList.add('active');
        }
        
        console.log('Recording started on track:', activeTrack.name);
      }
    } catch (error) {
      console.error('Failed to toggle recording', error);
      alert('Failed to start recording: ' + error.message);
    }
  }

  adjustBPM(delta) {
    this.bpm = this.sanitizeBpm((this.bpm || 140) + delta);
    this.updateUI();
    this.syncExternalTempo();
    if (this.isPlaying) {
      this.restartPlayback();
    }
  }

  updateUI() {
    const bpmInput = document.getElementById('bpm-input');
    if (bpmInput) {
      bpmInput.value = this.bpm;
    }

    const patternSelect = document.getElementById('pattern-select');
    if (patternSelect) {
      patternSelect.value = this.currentPattern;
    }

    this.updateStepIndicators();
    this.highlightActiveTool();
    this.updateArrangementSelect();
    this.renderPlaylist();
    this.updateTimelinePositionLabel();
  }

  highlightActiveTool() {
    document.querySelectorAll('#playlist-tools .tool-btn').forEach(btn => {
      const tool = btn.dataset.tool;
      btn.classList.toggle('active', tool === this.selectedTool);
    });
  }

  setSelectedTool(tool) {
    if (!tool || tool === this.selectedTool) return;
    this.selectedTool = tool;
    this.highlightActiveTool();
  }

  initializeDefaultArrangement() {
    if (this.arrangements.length > 0) return;

    const defaultTracks = [
      {
        id: 'track-1',
        name: 'Drums',
        mode: 'Pattern Track',
        mixerChannel: 'Drums',
        color: this.trackColorPalette[0],
        clips: [
          { id: this.generateClipId(), type: 'pattern', patternId: 1, start: 0, length: 4, name: 'Pattern 1' },
          { id: this.generateClipId(), type: 'pattern', patternId: 1, start: 4, length: 4, name: 'Pattern 1' }
        ]
      },
      {
        id: 'track-2',
        name: 'Bass Synth',
        mode: 'Instrument Track',
        mixerChannel: 'Bass',
        color: this.trackColorPalette[3],
        clips: [
          { id: this.generateClipId(), type: 'pattern', patternId: 2, start: 0, length: 8, name: 'Bass Groove' }
        ]
      },
      {
        id: 'track-3',
        name: 'Pad Atmosphere',
        mode: 'Audio Track',
        mixerChannel: 'Pads',
        color: this.trackColorPalette[2],
        clips: [
          { id: this.generateClipId(), type: 'audio', audioId: 'pad_loop', start: 0, length: 8, name: 'Pad Atmosphere' }
        ]
      },
      {
        id: 'track-4',
        name: 'Filter Sweep',
        mode: 'Automation Track',
        mixerChannel: 'Master',
        color: this.trackColorPalette[6],
        clips: [
          { id: this.generateClipId(), type: 'automation', automationTarget: 'filterCutoff', start: 4, length: 4, name: 'Filter Sweep' }
        ]
      }
    ];

    const defaultArrangement = {
      id: 'arrangement-1',
      name: 'Arrangement 1',
      lengthBars: 8,
      tracks: defaultTracks,
      markers: this.timelineUtils.generateDefaultMarkers(8, this.beatsPerBar)
    };

    this.arrangements.push(defaultArrangement);
    this.currentArrangementId = defaultArrangement.id;
    this.clipCounter = defaultTracks.reduce((acc, track) => acc + track.clips.length, this.clipCounter);
  }

  ensureArrangementsConsistency() {
    this.arrangements.forEach(arrangement => {
      arrangement.tracks = arrangement.tracks || [];
      arrangement.tracks.forEach((track, index) => {
        track.id = track.id || `track-${index + 1}`;
        track.clips = track.clips || [];
        track.color = track.color || this.trackColorPalette[index % this.trackColorPalette.length];
      });
      arrangement.markers = arrangement.markers || this.timelineUtils.generateDefaultMarkers(arrangement.lengthBars || this.arrangementLengthBarsDefault, this.beatsPerBar);
      arrangement.lengthBars = arrangement.lengthBars || this.arrangementLengthBarsDefault;
    });

    if (!this.currentArrangementId && this.arrangements.length) {
      this.currentArrangementId = this.arrangements[0].id;
    }
  }

  get currentArrangement() {
    return this.arrangements.find(arr => arr.id === this.currentArrangementId) || null;
  }

  generateClipId() {
    this.clipCounter += 1;
    return `clip-${this.clipCounter}`;
  }

  updateArrangementSelect() {
    const arrangementSelect = document.getElementById('arrangement-select');
    if (!arrangementSelect) return;

    arrangementSelect.innerHTML = '';
    this.arrangements.forEach(arrangement => {
      const option = document.createElement('option');
      option.value = arrangement.id;
      option.textContent = arrangement.name;
      option.selected = arrangement.id === this.currentArrangementId;
      arrangementSelect.appendChild(option);
    });
  }

  renderPlaylist() {
    const arrangement = this.currentArrangement;
    const tracksWrapper = document.getElementById('timeline-tracks');
    const markerStrip = document.getElementById('time-marker-strip');
    const ruler = document.getElementById('time-ruler');
    const gridOverlay = document.getElementById('timeline-grid');

    if (!arrangement || !tracksWrapper || !markerStrip || !ruler || !gridOverlay) {
      return;
    }

    const totalBeats = this.timelineUtils.barsToBeats(arrangement.lengthBars, this.beatsPerBar);
    const pixelsPerBeat = this.basePixelsPerBeat * this.zoomLevel;

    markerStrip.innerHTML = '';
    arrangement.markers.forEach(marker => {
      const markerEl = document.createElement('div');
      markerEl.className = 'timeline-marker';
      markerEl.textContent = marker.label;
      markerStrip.appendChild(markerEl);
    });

    ruler.innerHTML = '';
    const ticks = this.timelineUtils.buildRulerTicks({ totalBeats, beatsPerBar: this.beatsPerBar });
    ticks.forEach(tick => {
      const tickEl = document.createElement('div');
      tickEl.className = `tick ${tick.isMajor ? 'major' : 'minor'}`;
      tickEl.style.width = `${pixelsPerBeat}px`;
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = tick.label;
      tickEl.appendChild(label);
      ruler.appendChild(tickEl);
    });

    gridOverlay.innerHTML = '';
    const gridLines = this.timelineUtils.buildGridLines({
      totalBeats,
      beatsPerBar: this.beatsPerBar,
      stepsPerBeat: this.stepsPerBeat,
      snapSetting: this.snapSetting
    });

    gridLines.forEach(line => {
      const lineEl = document.createElement('div');
      lineEl.className = `grid-line ${line.type === 'bar' ? 'major' : line.type === 'beat' ? 'minor' : 'sub'}`;
      lineEl.style.left = `${line.beat * pixelsPerBeat}px`;
      gridOverlay.appendChild(lineEl);
    });

    tracksWrapper.innerHTML = '';
    arrangement.tracks.forEach(track => {
      const trackEl = document.createElement('div');
      trackEl.className = 'timeline-track';

      const labelEl = document.createElement('div');
      labelEl.className = 'timeline-track-label';
      labelEl.style.borderLeft = `3px solid ${track.color}`;

      const headerEl = document.createElement('div');
      headerEl.className = 'timeline-track-header';

      const titleEl = document.createElement('div');
      titleEl.className = 'track-title';
      titleEl.textContent = track.name;

      const modeEl = document.createElement('div');
      modeEl.className = 'track-mode';
      modeEl.textContent = track.mode || 'Flex Track';

      headerEl.appendChild(titleEl);
      headerEl.appendChild(modeEl);

      const toolsEl = document.createElement('div');
      toolsEl.className = 'timeline-track-tools';
      ['M', 'S', 'R'].forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'mini-btn';
        btn.textContent = action;
        toolsEl.appendChild(btn);
      });

      labelEl.appendChild(headerEl);
      labelEl.appendChild(toolsEl);

      const laneEl = document.createElement('div');
      laneEl.className = 'timeline-track-lane';
      laneEl.dataset.trackId = track.id;
      laneEl.addEventListener('mousedown', (event) => this.handleLanePointerDown(event, track.id));

      track.clips.forEach(clip => {
        const clipEl = document.createElement('div');
        clipEl.className = `timeline-clip ${clip.type}`;
        clipEl.style.left = `${clip.start * pixelsPerBeat}px`;
        clipEl.style.width = `${clip.length * pixelsPerBeat}px`;
        clipEl.style.backgroundColor = this.getClipColor(track.color, clip.type);
        clipEl.dataset.clipId = clip.id;
        clipEl.classList.toggle('muted', !!clip.muted);
        clipEl.innerHTML = `
          <span class="clip-name">${clip.name || clip.type}</span>
        `;
        clipEl.addEventListener('mousedown', (event) => this.handleClipPointerDown(event, track.id, clip.id));
        laneEl.appendChild(clipEl);
      });

      trackEl.appendChild(labelEl);
      trackEl.appendChild(laneEl);

      tracksWrapper.appendChild(trackEl);
    });

    this.syncTimelineScroll();
    this.updatePlayheadPosition();
  }

  getClipTypeForTrack(track) {
    if (!track) return 'pattern';
    const mode = (track.mode || '').toLowerCase();
    if (mode.includes('automation')) return 'automation';
    if (mode.includes('audio')) return 'audio';
    return 'pattern';
  }

  getArrangementTotalBeats(arrangement = this.currentArrangement) {
    if (!arrangement) return 0;
    return this.timelineUtils.barsToBeats(arrangement.lengthBars, this.beatsPerBar);
  }

  getSnapInterval() {
    switch (this.snapSetting) {
      case 'bar':
        return this.beatsPerBar;
      case 'beat':
        return 1;
      case 'step':
        return 1 / this.stepsPerBeat;
      case 'none':
      default:
        return 0; // free placement
    }
  }

  quantizeBeat(beat, mode = 'nearest') {
    const interval = this.getSnapInterval();
    if (!interval) return beat;

    const ratio = beat / interval;
    switch (mode) {
      case 'floor':
        return Math.floor(ratio) * interval;
      case 'ceil':
        return Math.ceil(ratio) * interval;
      default:
        return Math.round(ratio) * interval;
    }
  }

  clampBeatToArrangement(beat) {
    const totalBeats = this.getArrangementTotalBeats();
    return Math.max(0, Math.min(beat, totalBeats));
  }

  findTrackById(trackId) {
    const arrangement = this.currentArrangement;
    if (!arrangement) return null;
    return arrangement.tracks.find(track => track.id === trackId) || null;
  }

  findClipById(clipId) {
    const arrangement = this.currentArrangement;
    if (!arrangement) return null;

    for (const track of arrangement.tracks) {
      const index = track.clips.findIndex(clip => clip.id === clipId);
      if (index !== -1) {
        return { track, clip: track.clips[index], index };
      }
    }
    return null;
  }

  getClipEnd(clip) {
    return clip.start + clip.length;
  }

  sortTrackClips(track) {
    track.clips.sort((a, b) => a.start - b.start || a.id.localeCompare(b.id));
  }

  createClipPayload({
    trackId,
    type = 'pattern',
    start,
    length,
    name,
    patternId,
    audioId,
    automationTarget,
    extras = {}
  }) {
    const normalizedStart = this.clampBeatToArrangement(this.quantizeBeat(start, 'floor'));
    const totalBeats = this.getArrangementTotalBeats();
    const safeLength = Math.max(length, this.getSnapInterval() || (1 / this.stepsPerBeat));
    const normalizedLength = Math.min(safeLength, Math.max(0, totalBeats - normalizedStart));

    const payload = {
      id: this.generateClipId(),
      type,
      start: normalizedStart,
      length: normalizedLength,
      name: name || this.getDefaultClipName(type),
      ...extras
    };

    if (patternId !== undefined) payload.patternId = patternId;
    if (audioId !== undefined) payload.audioId = audioId;
    if (automationTarget !== undefined) payload.automationTarget = automationTarget;

    payload.trackId = trackId;
    return payload;
  }

  getDefaultClipName(type) {
    switch (type) {
      case 'audio':
        return 'Audio Clip';
      case 'automation':
        return 'Automation';
      default:
        return 'Pattern Clip';
    }
  }

  addClipToTrack(trackId, clipData) {
    const track = this.findTrackById(trackId);
    if (!track) {
      console.warn('Track not found for clip insertion:', trackId);
      return null;
    }

    const clip = { ...clipData };
    clip.id = clip.id || this.generateClipId();
    clip.start = this.clampBeatToArrangement(clip.start);
    clip.length = Math.max(clip.length, this.getSnapInterval() || (1 / this.stepsPerBeat));
    clip.length = Math.min(clip.length, this.getArrangementTotalBeats() - clip.start);

    track.clips.push(clip);
    this.sortTrackClips(track);
    this.touchArrangement();
    return clip;
  }

  updateClipTiming(clipId, { start, length }) {
    const result = this.findClipById(clipId);
    if (!result) return null;

    const { clip } = result;
    if (start !== undefined) {
      clip.start = this.clampBeatToArrangement(start);
    }
    if (length !== undefined) {
      clip.length = Math.max(length, this.getSnapInterval() || (1 / this.stepsPerBeat));
    }

    clip.length = Math.min(clip.length, this.getArrangementTotalBeats() - clip.start);
    this.sortTrackClips(result.track);
    this.touchArrangement();
    return clip;
  }

  removeClip(clipId) {
    const result = this.findClipById(clipId);
    if (!result) return false;

    const { track, index } = result;
    track.clips.splice(index, 1);
    this.touchArrangement();
    return true;
  }

  duplicateClip(clipId, offsetBeats) {
    const result = this.findClipById(clipId);
    if (!result) return null;

    const { track, clip } = result;
    const clone = { ...clip, id: this.generateClipId(), start: clip.start + offsetBeats };
    clone.start = this.clampBeatToArrangement(clone.start);
    clone.length = Math.min(clone.length, this.getArrangementTotalBeats() - clone.start);
    track.clips.push(clone);
    this.sortTrackClips(track);
    this.touchArrangement();
    return clone;
  }

  getClipsInRange(trackId, startBeat, endBeat) {
    const track = this.findTrackById(trackId);
    if (!track) return [];

    const rangeStart = Math.min(startBeat, endBeat);
    const rangeEnd = Math.max(startBeat, endBeat);

    return track.clips.filter(clip => {
      const clipStart = clip.start;
      const clipEnd = this.getClipEnd(clip);
      return clipEnd > rangeStart && clipStart < rangeEnd;
    });
  }

  clipOverlaps(trackId, candidateClip, { ignoreClipId } = {}) {
    const track = this.findTrackById(trackId);
    if (!track) return false;

    const candidateStart = candidateClip.start;
    const candidateEnd = this.getClipEnd(candidateClip);

    return track.clips.some(existing => {
      if (ignoreClipId && existing.id === ignoreClipId) return false;
      const start = existing.start;
      const end = this.getClipEnd(existing);
      return end > candidateStart && start < candidateEnd;
    });
  }

  touchArrangement({ render = true, save = true } = {}) {
    if (render) {
      this.renderPlaylist();
    }
    if (save) {
      this.saveProject(true);
    }
  }

  getPointerBeat(event, laneElement) {
    const rect = laneElement.getBoundingClientRect();
    const scrollLeft = this.timelineScrollWrapper ? this.timelineScrollWrapper.scrollLeft : 0;
    const relativeX = event.clientX - rect.left + scrollLeft;
    const pixelsPerBeat = this.basePixelsPerBeat * this.zoomLevel;
    return this.clampBeatToArrangement(relativeX / pixelsPerBeat);
  }

  getDefaultClipLength(type) {
    switch (type) {
      case 'automation':
        return this.beatsPerBar;
      case 'audio':
        return this.beatsPerBar;
      default:
        return this.beatsPerBar;
    }
  }

  handleLanePointerDown(event, trackId) {
    if (event.button !== 0) return;
    event.preventDefault();
    const laneElement = event.currentTarget;
    const track = this.findTrackById(trackId);
    if (!track) return;

    const beat = this.getPointerBeat(event, laneElement);
    const snappedBeat = this.snapSetting === 'none' ? beat : this.quantizeBeat(beat, 'floor');
    const tool = this.selectedTool;

    this.pointerState = {
      ...this.pointerState,
      isPointerDown: false,
      originBeat: snappedBeat,
      currentBeat: snappedBeat,
      trackId,
      clipId: null,
      laneElement,
      clipElement: null,
      lastPaintBeat: null
    };

    switch (tool) {
      case 'draw':
      case 'paint': {
        const clipType = this.getClipTypeForTrack(track);
        const defaultLength = this.getDefaultClipLength(clipType);
        const clipPayload = this.createClipPayload({
          trackId,
          type: clipType,
          start: snappedBeat,
          length: defaultLength
        });

        if (!this.clipOverlaps(trackId, clipPayload)) {
          this.addClipToTrack(trackId, clipPayload);
          if (tool === 'paint') {
            this.pointerState.isPointerDown = true;
            this.pointerState.lastPaintBeat = clipPayload.start;
          }
        }
        break;
      }
      case 'select':
      case 'slip':
        // Selection tools not yet implemented
        break;
    }
  }

  handleClipPointerDown(event, trackId, clipId) {
    if (event.button !== 0) return;
    event.preventDefault();

    const tool = this.selectedTool;
    const result = this.findClipById(clipId);
    if (!result) return;

    const { clip } = result;
    this.pointerState = {
      ...this.pointerState,
      isPointerDown: false,
      trackId,
      clipId,
      laneElement: event.currentTarget.parentElement,
      clipElement: event.currentTarget,
      originBeat: clip.start,
      currentBeat: clip.start
    };

    switch (tool) {
      case 'delete':
        this.removeClip(clipId);
        break;
      case 'mute':
        clip.muted = !clip.muted;
        this.touchArrangement();
        break;
      case 'slice': {
        const laneElement = this.pointerState.laneElement;
        if (!laneElement) return;
        const sliceBeatRaw = this.getPointerBeat(event, laneElement);
        const sliceBeat = this.snapSetting === 'none' ? sliceBeatRaw : this.quantizeBeat(sliceBeatRaw, 'nearest');
        if (sliceBeat <= clip.start + (this.getSnapInterval() || 0) || sliceBeat >= clip.start + clip.length - (this.getSnapInterval() || 0)) {
          return;
        }

        const firstLength = sliceBeat - clip.start;
        const secondLength = clip.length - firstLength;
        const minLength = this.getSnapInterval() || (1 / this.stepsPerBeat);
        if (firstLength < minLength || secondLength < minLength) {
          return;
        }

        clip.length = firstLength;
        const clone = {
          ...clip,
          id: this.generateClipId(),
          start: sliceBeat,
          length: secondLength
        };
        const track = this.findTrackById(trackId);
        if (track) {
          track.clips.push(clone);
          this.sortTrackClips(track);
        }
        this.touchArrangement();
        break;
      }
      default:
        // For other tools (select, slip) future work
        break;
    }
  }

  handleGlobalPointerMove(event) {
    if (!this.pointerState.isPointerDown) return;
    if (this.selectedTool !== 'paint') return;

    const { laneElement, trackId, lastPaintBeat } = this.pointerState;
    if (!laneElement || trackId === null) return;

    const beat = this.getPointerBeat(event, laneElement);
    const snappedBeat = this.snapSetting === 'none' ? beat : this.quantizeBeat(beat, 'floor');
    const minInterval = this.getSnapInterval() || (1 / this.stepsPerBeat);

    if (lastPaintBeat !== null && Math.abs(snappedBeat - lastPaintBeat) < minInterval) {
      return;
    }

    const track = this.findTrackById(trackId);
    if (!track) return;

    const clipType = this.getClipTypeForTrack(track);
    const payload = this.createClipPayload({
      trackId,
      type: clipType,
      start: snappedBeat,
      length: this.getDefaultClipLength(clipType)
    });

    if (!this.clipOverlaps(trackId, payload)) {
      this.addClipToTrack(trackId, payload);
      this.pointerState.lastPaintBeat = payload.start;
    }
  }

  handleGlobalPointerUp() {
    if (!this.pointerState.isPointerDown) return;
    this.pointerState.isPointerDown = false;
    this.pointerState.lastPaintBeat = null;
    this.pointerState.clipElement = null;
    this.pointerState.laneElement = null;
  }

  getClipColor(baseColor, type) {
    switch (type) {
      case 'pattern':
        return baseColor;
      case 'audio':
        return this.shadeColor(baseColor, 0.1);
      case 'automation':
        return this.shadeColor(baseColor, -0.1);
      default:
        return baseColor;
    }
  }

  shadeColor(color, percent) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent * 100);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return `#${(
      0x1000000 +
      (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 0 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
  }

  syncTimelineScroll() {
    if (!this.timelineScrollWrapper) {
      this.timelineScrollWrapper = document.querySelector('.timeline-tracks-wrapper');
    }

    if (this.timelineScrollWrapper && !this.timelineScrollHandler) {
      this.timelineScrollHandler = () => {
        const scrollLeft = this.timelineScrollWrapper.scrollLeft;
        const ruler = document.getElementById('time-ruler');
        const grid = document.getElementById('timeline-grid');
        if (ruler) {
          ruler.style.transform = `translateX(${-scrollLeft}px)`;
        }
        if (grid) {
          grid.style.transform = `translateX(${-scrollLeft}px)`;
        }
        this.updatePlayheadPosition();
      };

      this.timelineScrollWrapper.addEventListener('scroll', this.timelineScrollHandler);
    }
  }

  updateTimelinePositionLabel() {
    const timelinePosition = document.getElementById('timeline-position');
    if (!timelinePosition) return;

    const beatPosition = this.songPositionBeats;
    const beatLabel = this.timelineUtils.formatBeatPosition(beatPosition, this.beatsPerBar, this.stepsPerBeat);
    const clockLabel = this.timelineUtils.formatClockTime(beatPosition, this.bpm);

    timelinePosition.textContent = `${beatLabel} | ${clockLabel}`;
  }

  updatePlayheadPosition() {
    const playhead = document.getElementById('playhead');
    if (!playhead) return;

    const arrangement = this.currentArrangement;
    if (!arrangement) return;

    const totalBeats = this.timelineUtils.barsToBeats(arrangement.lengthBars, this.beatsPerBar);
    const pixelsPerBeat = this.basePixelsPerBeat * this.zoomLevel;

    const clampedBeats = Math.max(0, Math.min(this.songPositionBeats, totalBeats));
    const scrollLeft = this.timelineScrollWrapper ? this.timelineScrollWrapper.scrollLeft : 0;
    playhead.style.transform = `translateX(${clampedBeats * pixelsPerBeat - scrollLeft}px)`;
  }

  advancePlayhead(stepDeltaBeats) {
    this.songPositionBeats += stepDeltaBeats;
    const arrangement = this.currentArrangement;
    if (arrangement) {
      const totalBeats = this.timelineUtils.barsToBeats(arrangement.lengthBars, this.beatsPerBar);
      if (this.songPositionBeats > totalBeats) {
        this.songPositionBeats = 0;
      }
    }

    this.updateTimelinePositionLabel();
    this.updatePlayheadPosition();
  }

  adjustZoom(delta) {
    const newZoom = Math.max(0.4, Math.min(4, this.zoomLevel + delta));
    if (Math.abs(newZoom - this.zoomLevel) < 0.001) return;
    this.zoomLevel = newZoom;
    this.renderPlaylist();
  }

  async waitForAudioUnlock() {
    if (this.audioUnlockState === 'resolved') {
      return this.audioContext;
    }

    this._setupAudioUnlockHandling();

    if (this.audioUnlockState === 'resolved') {
      return this.audioContext;
    }

    if (!this._audioUnlockPromise) {
      this._audioUnlockPromise = new Promise((resolve) => {
        this._resolveAudioUnlock = resolve;
      });
    }

    return this._audioUnlockPromise;
  }

  _setupAudioUnlockHandling() {
    if (this.audioUnlockState !== 'pending') {
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.audioUnlockState = 'resolved';
      this._audioUnlockPromise = Promise.resolve(null);
      this._resolveAudioUnlock = null;
      return;
    }

    if (!this._audioUnlockPromise) {
      this._audioUnlockPromise = new Promise((resolve) => {
        this._resolveAudioUnlock = resolve;
      });
    }

    if (this._audioUnlockHandler) {
      return;
    }

    this._audioUnlockHandler = () => {
      Promise.resolve(this._attemptAudioUnlock()).catch((error) => {
        if (error?.name !== 'NotAllowedError') {
          console.warn('FLStudio: Audio unlock attempt deferred', error);
        }
      });
    };

    this._audioUnlockEvents.forEach((eventName) => {
      document.addEventListener(eventName, this._audioUnlockHandler, true);
    });
  }

  _cleanupAudioUnlockHandling() {
    if (typeof document === 'undefined' || !this._audioUnlockHandler) {
      return;
    }

    this._audioUnlockEvents.forEach((eventName) => {
      document.removeEventListener(eventName, this._audioUnlockHandler, true);
    });
    this._audioUnlockHandler = null;
  }

  async _attemptAudioUnlock() {
    if (this.audioUnlockState === 'resolved') {
      return this.audioContext;
    }

    if (this.audioUnlockState === 'unlocking') {
      return this.waitForAudioUnlock();
    }

    if (typeof window === 'undefined') {
      this.audioUnlockState = 'resolved';
      return null;
    }

    if (!this._audioUnlockPromise) {
      this._audioUnlockPromise = new Promise((resolve) => {
        this._resolveAudioUnlock = resolve;
      });
    }

    this.audioUnlockState = 'unlocking';

    try {
      let context = this.audioContext;
      const sharedContext = (window.vocalStudio && typeof window.vocalStudio.getSharedContext === 'function')
        ? window.vocalStudio.getSharedContext()
        : null;

      if ((!context || context.state === 'closed') && sharedContext) {
        context = await this.adoptAudioContext(sharedContext);
      }

      if (!context || context.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          throw new Error('Web Audio API not supported');
        }
        context = new AudioCtx();
      }

      if (context?.state === 'suspended') {
        await context.resume();
      }

      this.audioContext = context;
      this._finalizeAudioUnlock(context);
      return context;
    } catch (error) {
      this.audioUnlockState = 'pending';
      throw error;
    }
  }

  _finalizeAudioUnlock(context) {
    this.audioUnlockState = 'resolved';
    this._cleanupAudioUnlockHandling();

    if (this._resolveAudioUnlock) {
      this._resolveAudioUnlock(context);
      this._resolveAudioUnlock = null;
    }

    this._audioUnlockPromise = Promise.resolve(context);

    if (this._audioUnlockCallbacks && this._audioUnlockCallbacks.size) {
      this._audioUnlockCallbacks.forEach((cb) => {
        try {
          cb(context);
        } catch (callbackError) {
          console.warn('FLStudio: Audio unlock callback failed', callbackError);
        }
      });
      this._audioUnlockCallbacks.clear();
    }

    if (context && window.vocalStudio) {
      const shared = typeof window.vocalStudio.getSharedContext === 'function'
        ? window.vocalStudio.getSharedContext()
        : null;
      if (typeof window.vocalStudio.attachAudioContext === 'function' && shared !== context) {
        window.vocalStudio.attachAudioContext(context);
      }
    }
  }

  onAudioUnlock(callback, options = {}) {
    if (typeof callback !== 'function') {
      return () => {};
    }

    const { invokeImmediately = true } = options;

    this._setupAudioUnlockHandling();

    if (this.audioUnlockState === 'resolved' && invokeImmediately) {
      try {
        callback(this.audioContext);
      } catch (callbackError) {
        console.warn('FLStudio: Audio unlock callback threw', callbackError);
      }
      return () => {};
    }

    this._audioUnlockCallbacks.add(callback);

    return () => {
      this._audioUnlockCallbacks.delete(callback);
    };
  }

  createInitialTracks() {
    if (this.tracks.length > 0) {
      // Just ensure existing tracks are rendered if already defined
      const rack = document.querySelector('.channel-rack');
      if (rack) {
        rack.innerHTML = '';
        this.tracks.forEach((track) => this.renderTrack(track));
      }
      return;
    }

    const rack = document.querySelector('.channel-rack');
    if (rack) {
      rack.innerHTML = '';
    }

    const starterTracks = [
      { name: 'Kick', type: 'drum' },
      { name: 'Snare', type: 'drum' },
      { name: 'Hi-Hat', type: 'drum' },
      { name: 'Bass Synth', type: 'synth' },
      { name: 'Lead Synth', type: 'synth' }
    ];

    starterTracks.forEach(({ name, type }) => this.addTrack(name, type));
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
    
    // Create track mixer if available
    if (typeof TrackMixer !== 'undefined' && this.audioContext) {
      const mixer = new TrackMixer(this.audioContext, track.id);
      this.trackMixers.set(track.id, mixer);
      
      // Connect to master bus or destination
      if (this.busManager) {
        mixer.getOutput().connect(this.busManager.getMasterBus());
      } else {
        mixer.getOutput().connect(this.audioContext.destination);
      }
    }
    
    this.renderTrack(track);
  }

  /**
   * Ensure track has all required default parameters
   * @param {Object} track - Track object
   * @returns {Object} Track with defaults
   */
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
    if (!t.color) {
      t.color = this.getTrackColor(t.type, t.id);
    }
    return t;
  }

  /**
   * Apply track parameters to audio engine
   * @param {number} trackId - Track ID
   */
  applyTrackParams(trackId) {
    const track = this.tracks[trackId];
    if (!track || !this.audioContext) return;

    track = this.ensureTrackDefaults(track);
    const params = track.params;

    // Apply to track mixer if available
    const mixer = this.trackMixers.get(trackId);
    if (mixer) {
      if (typeof mixer.setVolume === 'function') {
        mixer.setVolume(params.volume);
      }
      if (typeof mixer.setPan === 'function') {
        mixer.setPan(params.pan);
      }
    }

    // Apply to synthesizer if available
    if (this.synthesizer && typeof this.synthesizer.setTrackParams === 'function') {
      this.synthesizer.setTrackParams(trackId, params);
    }

    // Emit parameter change event
    this.emit('trackParamsChanged', trackId, params);
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
    const channelRack = document.querySelector('.channel-rack') || document.getElementById('channel-rack');
    if (!channelRack) return;

    const trackElement = document.createElement('div');
    trackElement.className = 'track';
    trackElement.dataset.trackId = track.id;
    trackElement.addEventListener('dragover', (e) => e.preventDefault());
    trackElement.addEventListener('drop', (e) => this.handleTrackDrop(e, track.id));

    // Track header section
    const header = document.createElement('div');
    header.className = 'track-header';

    // Track icon/color indicator (clickable to open settings)
    const icon = document.createElement('div');
    icon.className = 'track-icon';
    icon.style.background = track.color || this.getTrackColor(track.type, track.id);
    icon.addEventListener('click', () => this.openChannelSettings(track.id));
    header.appendChild(icon);

    // Track name (clickable to open settings, double-click to edit)
    const nameSpan = document.createElement('span');
    nameSpan.className = 'track-name';
    nameSpan.textContent = track.name;
    nameSpan.contentEditable = 'false';
    nameSpan.addEventListener('click', () => this.openChannelSettings(track.id));
    nameSpan.addEventListener('dblclick', (e) => {
      e.stopPropagation();
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
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute(track.id);
    });
    controls.appendChild(muteBtn);

    const soloBtn = document.createElement('button');
    soloBtn.className = 'track-btn solo-btn';
    soloBtn.textContent = 'S';
    soloBtn.title = 'Solo (Ctrl+S)';
    if (track.solo) soloBtn.classList.add('active');
    soloBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleSolo(track.id);
    });
    controls.appendChild(soloBtn);

    const aiBtn = document.createElement('button');
    aiBtn.className = 'ai-pattern-btn';
    aiBtn.title = 'Generate AI Pattern';
    aiBtn.innerHTML = '✨';
    aiBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.generateAIPattern(track.id);
    });
    controls.appendChild(aiBtn);

    header.appendChild(controls);

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
    trackElement.appendChild(stepGrid);

    channelRack.appendChild(trackElement);

    // Update step visuals to reflect the pattern
    this.updateStepVisual(track.id, -1);
  }

  /**
   * Get track color based on type and ID
   * @param {string} type - Track type
   * @param {number} id - Track ID
   * @returns {string} Color hex code
   */
  getTrackColor(type, id) {
    const colors = {
      drum: ['#FF6B6B', '#E84C3D', '#FF9F43', '#F5A623'],
      synth: ['#4A90E2', '#5DADE2', '#BB8FCE', '#AF7AC5'],
      effect: ['#48C9B0', '#16A085', '#1ABC9C', '#0B5345']
    };
    const colorArray = colors[type] || colors.drum;
    return colorArray[id % colorArray.length];
  }

  /**
   * Open channel settings window for a track
   * @param {number} trackId - Track ID
   */
  openChannelSettings(trackId) {
    if (typeof ChannelSettingsWindow !== 'undefined' && window.channelSettingsWindow) {
      window.channelSettingsWindow.open(trackId);
    } else {
      console.warn('ChannelSettingsWindow not available');
    }
  }

  /**
   * Pattern operations for channel rack enhancements
   */
  _patternClipboard = null;

  /**
   * Fill pattern with steps every N beats
   * @param {number} trackId - Track ID
   * @param {number} every - Fill every N steps (1 = fill all)
   */
  fillPattern(trackId, every) {
    const track = this.tracks[trackId];
    if (!track) return;
    
    for (let i = 0; i < track.steps.length; i++) {
      track.steps[i] = (every === 1) ? true : (i % every === 0);
    }
    this.updateStepVisual(trackId, -1);
    this.saveProject(true);
  }

  /**
   * Copy pattern to clipboard
   * @param {number} trackId - Track ID
   */
  copyPattern(trackId) {
    const track = this.tracks[trackId];
    if (!track) return;
    
    this._patternClipboard = {
      steps: [...track.steps],
      name: track.name
    };
    console.log(`[DEBUG] Copied pattern from ${track.name}`);
  }

  /**
   * Paste pattern from clipboard
   * @param {number} trackId - Track ID
   */
  pastePattern(trackId) {
    if (!this._patternClipboard) return;
    
    const track = this.tracks[trackId];
    if (!track) return;
    
    track.steps = [...this._patternClipboard.steps];
    this.updateStepVisual(trackId, -1);
    this.saveProject(true);
    console.log(`[DEBUG] Pasted pattern to ${track.name}`);
  }

  /**
   * Randomize pattern
   * @param {number} trackId - Track ID
   */
  randomizePattern(trackId) {
    const track = this.tracks[trackId];
    if (!track) return;
    
    track.steps = track.steps.map(() => Math.random() > 0.6);
    this.updateStepVisual(trackId, -1);
    this.saveProject(true);
  }

  /**
   * Humanize pattern timing
   * @param {number} trackId - Track ID
   */
  humanizePattern(trackId) {
    const track = this.tracks[trackId];
    if (!track) return;
    
    // Add slight randomization to timing
    track.steps = track.steps.map(s => s ? (Math.random() > 0.15) : false);
    this.updateStepVisual(trackId, -1);
    this.saveProject(true);
    console.log(`[DEBUG] Humanized ${track.name} - timing variations applied`);
  }

  /**
   * Clear pattern
   * @param {number} trackId - Track ID
   */
  clearPattern(trackId) {
    const track = this.tracks[trackId];
    if (!track) return;
    
    track.steps = track.steps.map(() => false);
    this.updateStepVisual(trackId, -1);
    this.saveProject(true);
  }

  /**
   * Duplicate track
   * @param {number} trackId - Track ID
   */
  duplicateTrack(trackId) {
    const original = this.tracks[trackId];
    if (!original) return;
    
    const duplicate = JSON.parse(JSON.stringify(original));
    duplicate.id = this.tracks.length;
    duplicate.name = `${original.name} (Copy)`;
    
    this.tracks.push(duplicate);
    
    // Create track mixer if available
    if (typeof TrackMixer !== 'undefined' && this.audioContext) {
      const mixer = new TrackMixer(this.audioContext, duplicate.id);
      this.trackMixers.set(duplicate.id, mixer);
      
      if (this.busManager) {
        mixer.getOutput().connect(this.busManager.getMasterBus());
      } else {
        mixer.getOutput().connect(this.audioContext.destination);
      }
    }
    
    this.renderTrack(duplicate);
    this.saveProject(true);
    console.log(`[DEBUG] Duplicated ${original.name}`);
  }

  /**
   * Delete track
   * @param {number} trackId - Track ID
   */
  deleteTrack(trackId) {
    if (this.tracks.length <= 1) {
      alert('Cannot delete the last track');
      return;
    }
    
    if (confirm(`Delete ${this.tracks[trackId].name}?`)) {
      this.tracks.splice(trackId, 1);
      
      // Reassign IDs
      this.tracks.forEach((t, i) => t.id = i);
      
      // Remove track mixer
      this.trackMixers.delete(trackId);
      
      // Re-render all tracks
      const channelRack = document.querySelector('.channel-rack') || document.getElementById('channel-rack');
      if (channelRack) {
        channelRack.innerHTML = '';
        this.tracks.forEach(t => this.renderTrack(t));
      }
      
      this.saveProject(true);
    }
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
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn('FLStudio: Failed to resume existing audio context', error);
      }
      return this.audioContext;
    }

    this._setupAudioUnlockHandling();

    if (this.audioUnlockState === 'resolved') {
      return this.audioContext;
    }

    try {
      return await this._attemptAudioUnlock();
    } catch (error) {
      if (error?.name === 'NotAllowedError') {
        console.warn('FLStudio: Audio context unlock requires a user gesture');
        return null;
      }
      console.error('FLStudio: Failed to initialize audio context', error);
      return null;
    }
  }

  startPlayback() {
    if (!this.audioContext) return;

    const stepTime = 60 / this.bpm / 4; // 16th notes

    this.intervalId = setInterval(() => {
      this.playCurrentStep();
      this.currentStep = (this.currentStep + 1) % 16;
      this.updateStepIndicators();
      this.advancePlayhead(this.beatsPerStep);
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
    
    // If it's a sample, try to load it
    if (sound.type === 'sample' && this.instrumentManager && typeof loadAudioSample !== 'undefined') {
      // Sample loading would happen here
      // For now, just create the track
    }
    
    this.saveProject();
  }

  /**
   * Load audio sample file
   * @param {File} file - Audio file
   * @param {string} trackId - Optional track ID to assign to
   * @returns {Promise<AudioBuffer>} Loaded audio buffer
   */
  async loadAudioSample(file, trackId = null) {
    if (!this.audioContext) {
      await this.initAudio();
    }

    try {
      if (typeof loadAudioSample !== 'undefined') {
        const buffer = await loadAudioSample(this.audioContext, file);
        
        // If instrument manager is available, register it
        if (this.instrumentManager && trackId !== null) {
          const track = this.tracks.find(t => t.id === trackId);
          if (track) {
            // Store sample buffer in track
            track.sampleBuffer = buffer;
            track.samplePlayer = new SamplePlayer(this.audioContext, buffer);
          }
        }
        
        return buffer;
      } else {
        throw new Error('Sample loading not available');
      }
    } catch (error) {
      console.error('Failed to load audio sample', error);
      throw error;
    }
  }

  adjustZoom(delta) {
    const newZoom = Math.max(0.4, Math.min(4, this.zoomLevel + delta));
    if (Math.abs(newZoom - this.zoomLevel) < 0.001) return;
    this.zoomLevel = newZoom;
    this.renderPlaylist();
  }

  populatePlaylist() {
    this.renderPlaylist();
  }

  populateMixer() {
    const mixerChannels = document.getElementById('mixer-channels');
    if (!mixerChannels) return;
    
    mixerChannels.innerHTML = '';

    // Ensure track mixers are initialized
    this.initializeTrackMixers();

    this.tracks.forEach(track => {
      const mixer = this.getTrackMixer(track.id);
      const currentVolume = mixer ? mixer.getVolume() : 0.8;
      const currentPan = mixer ? mixer.getPan() : 0;
      
      const channelElement = document.createElement('div');
      channelElement.className = 'mixer-channel';
      channelElement.dataset.trackId = track.id;
      
      channelElement.innerHTML = `
        <div class="channel-name">${track.name}</div>
        <div class="mixer-fader" data-track="${track.id}">
          <div class="fader-handle" style="height: ${currentVolume * 100}%;"></div>
          <div class="fader-value">${Math.round(currentVolume * 100)}</div>
        </div>
        <div class="mixer-pan" data-track="${track.id}">
          <input type="range" class="pan-slider" min="-1" max="1" step="0.01" value="${currentPan}" 
                 title="Pan: ${currentPan > 0 ? 'R' : currentPan < 0 ? 'L' : 'C'}">
        </div>
        <div class="mixer-controls">
          <div class="mixer-btn ${track.muted ? 'active' : ''}" data-action="mute" title="Mute">M</div>
          <div class="mixer-btn ${track.solo ? 'active' : ''}" data-action="solo" title="Solo">S</div>
          <div class="mixer-btn" data-action="eq" title="EQ">EQ</div>
          <div class="mixer-btn" data-action="fx" title="Effects">FX</div>
        </div>
      `;

      // Add event listeners
      const fader = channelElement.querySelector('.mixer-fader');
      fader.addEventListener('click', (e) => this.handleFaderClick(e, track.id));
      
      // Pan control
      const panSlider = channelElement.querySelector('.pan-slider');
      panSlider.addEventListener('input', (e) => {
        const pan = parseFloat(e.target.value);
        if (mixer) {
          mixer.setPan(pan);
        }
        e.target.title = `Pan: ${pan > 0 ? 'R' : pan < 0 ? 'L' : 'C'}`;
      });

      const buttons = channelElement.querySelectorAll('.mixer-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = e.target.dataset.action;
          if (action === 'mute') {
            this.toggleMute(track.id);
            if (mixer) mixer.setMute(track.muted);
          } else if (action === 'solo') {
            this.toggleSolo(track.id);
            if (mixer) mixer.setSolo(track.solo);
          } else if (action === 'eq') {
            this.openTrackEQ(track.id);
          } else if (action === 'fx') {
            this.openTrackFX(track.id);
          }
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
    const valueDisplay = fader.querySelector('.fader-value');
    handle.style.height = `${percentage * 100}%`;
    if (valueDisplay) {
      valueDisplay.textContent = Math.round(percentage * 100);
    }

    // Update track mixer
    const mixer = this.getTrackMixer(trackId);
    if (mixer) {
      mixer.setVolume(percentage);
    }
  }

  /**
   * Open track EQ panel
   */
  openTrackEQ(trackId) {
    const mixer = this.getTrackMixer(trackId);
    if (!mixer) return;
    
    const eq = mixer.getEQ();
    if (!eq) return;
    
    // TODO: Open EQ UI panel
    console.log('Open EQ for track', trackId, eq.getSettings());
  }

  /**
   * Open track FX panel
   */
  openTrackFX(trackId) {
    const mixer = this.getTrackMixer(trackId);
    if (!mixer) return;
    
    const effectChain = mixer.getEffectChain();
    if (!effectChain) return;
    
    // TODO: Open FX chain UI panel
    console.log('Open FX chain for track', trackId);
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

    // Reverb effect
    const reverbEffect = this.createEffectControl('reverb', 'Reverb', this.masterEffects.reverb);
    effectsChain.appendChild(reverbEffect);

    // Delay effect
    const delayEffect = this.createEffectControl('delay', 'Delay', this.masterEffects.delay);
    effectsChain.appendChild(delayEffect);

    // Distortion effect
    const distortionEffect = this.createEffectControl('distortion', 'Distortion', this.masterEffects.distortion);
    effectsChain.appendChild(distortionEffect);

    // Filter effect
    const filterEffect = this.createEffectControl('filter', 'Filter', this.masterEffects.filter);
    effectsChain.appendChild(filterEffect);
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
    // Setup piano roll editor if available
    if (this.pianoRollEditor) {
      // Piano roll is already initialized
      return;
    }

    // Fallback: create canvas if it doesn't exist
    const noteGrid = document.getElementById('note-grid');
    if (!noteGrid) return;

    // Check if canvas exists, if not create it
    let canvas = document.getElementById('piano-roll-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'piano-roll-canvas';
      canvas.width = noteGrid.offsetWidth || 800;
      canvas.height = noteGrid.offsetHeight || 400;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      noteGrid.appendChild(canvas);
    }

    // Initialize piano roll editor
    if (typeof PianoRollEditor !== 'undefined' && this.audioContext) {
      this.pianoRollEditor = new PianoRollEditor(canvas, this.audioContext);
      
      // Enable virtual keyboard when pattern editor is active
      if (this.midiKeyboard) {
        this.midiKeyboard.enable();
      }
    } else {
      // Fallback to basic piano keys
      this.populatePianoKeys();
    }
  }

  populatePianoKeys() {
    const pianoKeys = document.getElementById('piano-keys');
    if (!pianoKeys) return;
    
    pianoKeys.innerHTML = '';

    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaves = [2, 3, 4, 5, 6]; // 5 octaves

    octaves.reverse().forEach(octave => {
      notes.forEach(note => {
        const keyElement = document.createElement('div');
        keyElement.className = `key ${note.includes('#') ? 'black' : 'white'}`;
        keyElement.textContent = `${note}${octave}`;
        keyElement.dataset.note = `${note}${octave}`;
        keyElement.addEventListener('click', () => {
          this.playPianoKey(note, octave);
        });
        pianoKeys.appendChild(keyElement);
      });
    });
  }

  /**
   * Play a piano key
   */
  playPianoKey(note, octave) {
    if (!this.audioContext || this.audioContext.state !== 'running') return;
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = noteNames.indexOf(note);
    const midiNote = (octave + 1) * 12 + noteIndex;
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    
    if (this.synthesizer) {
      this.synthesizer.playNote(frequency, 0.8);
    } else {
      // Fallback to basic oscillator
      this.playSound('synth', note.toLowerCase());
    }
  }

  playCurrentStep() {
    this.tracks.forEach(async (track) => {
      if (track.steps[this.currentStep] && !track.muted) {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
        if (this.audioContext && this.audioContext.state === 'running') {
          // Use sample player if available
          if (track.samplePlayer && typeof SamplePlayer !== 'undefined') {
            const mixer = this.getTrackMixer(track.id);
            if (mixer) {
              const playback = track.samplePlayer.play(1.0, 0, null, 0);
              if (playback && playback.gain) {
                playback.gain.disconnect();
                playback.gain.connect(mixer.getInput());
              }
            } else {
              track.samplePlayer.play(1.0, 0, null, 0);
            }
          } else {
            // Fallback to synthesis
            this.playSound(track.type, track.name.toLowerCase(), track.id);
          }
        }
      }
    });
  }

  /**
   * Play sound with optional track routing
   * @param {string} type - Sound type
   * @param {string} name - Sound name
   * @param {number} trackId - Optional track ID for routing through mixer
   */
  playSound(type, name, trackId = null) {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      console.log('Audio context not ready');
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Generate sound based on type and name
    let frequency = this.getFrequencyForSound(type, name);
    let duration = this.getDurationForSound(type, name);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = this.getWaveformForSound(type, name);

    // Envelope for more natural sound
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    // Route through track mixer if available
    if (trackId !== null && typeof TrackMixer !== 'undefined') {
      const mixer = this.getTrackMixer(trackId);
      if (mixer) {
        // Connect through track mixer
        oscillator.connect(gainNode);
        gainNode.connect(mixer.getInput());
        
        // Connect mixer output to master bus or destination
        if (this.busManager) {
          mixer.getOutput().connect(this.busManager.getMasterBus());
        } else {
          mixer.getOutput().connect(this.audioContext.destination);
        }
      } else {
        // Fallback to direct connection
        this._connectWithMasterEffects(oscillator, gainNode);
      }
    } else {
      // Route through master effects
      this._connectWithMasterEffects(oscillator, gainNode);
    }

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Connect audio through master effects chain
   * @private
   */
  _connectWithMasterEffects(oscillator, gainNode) {
    oscillator.connect(gainNode);
    let currentNode = gainNode;

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

    // Connect to destination
    if (this.busManager) {
      currentNode.connect(this.busManager.getMasterBus());
    } else {
      currentNode.connect(this.audioContext.destination);
    }
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
}

// Initialize the app when DOM is loaded (browser only)
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
  document.addEventListener('DOMContentLoaded', () => {
    const instance = new FLStudio();
    if (typeof window !== 'undefined') {
      window.flStudio = instance;
      window.vocalStudio?.setFLStudio?.(instance);
      window.vocalStudio?.updateTempo?.(instance.getBpm?.() || instance.bpm);
    }
  });
}

// Export for testing environments (Node/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FLStudio };
}
