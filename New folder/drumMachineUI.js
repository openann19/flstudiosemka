// Compact Enhanced Drum Machine UI for FL Studio
class DrumMachineUI {
  constructor(flStudio) {
    this.flStudio = flStudio;
    this.drumMachine = null;
    this.isVisible = false;
    this.currentKit = 'Studio HD';
    this.isPlaying = false;
    this.sequencerInterval = null;
    this.currentStep = 0;
    this.pattern = this.createEmptyPattern();
    this.initialized = false;
    
    this.kitPresets = {
      'Studio HD': { color: '#FF9900', description: 'Professional studio quality drums' },
      'Electronic Pro': { color: '#4A90E2', description: 'Modern electronic drum sounds' },
      'Acoustic Premium': { color: '#3FB53F', description: 'Realistic acoustic drum kit' },
      '808 Vintage': { color: '#BB8FCE', description: 'Classic 808 drum machine sounds' }
    };
  }

  async init() {
    if (this.initialized) return;
    
    await this.createUI();
    this.setupEventListeners();
    this.initialized = true;
    console.log('🥁 Compact Drum Machine UI initialized');
  }

  async createUI() {
    // Create compact drum machine panel
    const drumMachinePanel = document.createElement('div');
    drumMachinePanel.className = 'panel drum-machine-panel';
    drumMachinePanel.id = 'drum-machine-panel';
    drumMachinePanel.style.display = 'none';
    drumMachinePanel.innerHTML = this.getCompactPanelHTML();
    
    // Add to main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.appendChild(drumMachinePanel);
    } else {
      console.error('Main content not found for drum machine');
      return;
    }

    // Initialize drum machine
    await this.initializeDrumMachine();
  }

  getCompactPanelHTML() {
    return `
      <div class="drum-machine-header">
        <div class="drum-machine-title">
          <h2>Drum Machine</h2>
          <span class="drum-machine-status" id="drum-machine-status">Ready</span>
        </div>
        <div class="drum-machine-controls">
          <div class="kit-selector">
            <label>Kit:</label>
            <select id="kit-select">
              <option value="Studio HD">Studio HD</option>
              <option value="Electronic Pro">Electronic Pro</option>
              <option value="Acoustic Premium">Acoustic Premium</option>
              <option value="808 Vintage">808 Vintage</option>
            </select>
          </div>
          <div class="master-controls">
            <label>Vol:</label>
            <input type="range" id="master-volume" min="0" max="100" value="80">
          </div>
          <button class="sequencer-btn" id="seq-play">▶ Play</button>
          <button class="sequencer-btn" id="seq-stop">■ Stop</button>
        </div>
      </div>

      <div class="drum-machine-content">
        <!-- Compact Drum Pad Grid -->
        <div class="drum-pad-grid" id="drum-pad-grid">
          ${this.getCompactDrumPadHTML()}
        </div>

        <!-- Compact Sequencer -->
        <div class="drum-sequencer">
          <div class="sequencer-header">
            <h3>Pattern</h3>
            <div class="sequencer-controls">
              <button class="sequencer-btn" id="seq-clear">Clear</button>
              <button class="sequencer-btn" id="seq-save">Save to Rack</button>
            </div>
          </div>
          <div class="sequencer-grid" id="sequencer-grid">
            ${this.getCompactSequencerHTML()}
          </div>
        </div>
      </div>
    `;
  }

  getCompactDrumPadHTML() {
    const drums = [
      { type: 'kick', name: 'Kick', color: '#FF6B6B', key: 'Q' },
      { type: 'snare', name: 'Snare', color: '#4A90E2', key: 'W' },
      { type: 'hihat', name: 'Hi-Hat', color: '#F5A623', key: 'E' },
      { type: 'clap', name: 'Clap', color: '#BB8FCE', key: 'R' },
      { type: 'tom', name: 'Tom', color: '#48C9B0', key: 'A' },
      { type: 'crash', name: 'Crash', color: '#E84C3D', key: 'S' },
      { type: 'ride', name: 'Ride', color: '#3498DB', key: 'D' },
      { type: 'perc', name: 'Perc', color: '#F39C12', key: 'F' }
    ];

    return drums.map(drum => `
      <div class="drum-pad" data-drum="${drum.type}" style="--drum-color: ${drum.color}">
        <div class="drum-pad-inner">
          <div class="drum-name">${drum.name}</div>
          <div class="drum-key">${drum.key}</div>
          <div class="drum-visualizer">
            <div class="drum-waveform"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  getCompactSequencerHTML() {
    let html = '<div class="sequencer-labels">';
    
    // Step labels
    for (let i = 1; i <= 16; i++) {
      html += `<div class="step-label">${i}</div>`;
    }
    html += '</div>';

    // Drum rows
    const drums = ['kick', 'snare', 'hihat', 'clap', 'tom', 'crash', 'ride', 'perc'];
    
    drums.forEach(drum => {
      html += `<div class="sequencer-row" data-drum="${drum}">`;
      html += `<div class="drum-label">${drum.charAt(0).toUpperCase()}</div>`;
      
      for (let i = 0; i < 16; i++) {
        html += `<div class="sequencer-step" data-step="${i}" data-drum="${drum}"></div>`;
      }
      
      html += '</div>';
    });

    return html;
  }

  createEmptyPattern() {
    const drums = ['kick', 'snare', 'hihat', 'clap', 'tom', 'crash', 'ride', 'perc'];
    const pattern = {};
    drums.forEach(drum => {
      pattern[drum] = Array(16).fill(false);
    });
    return pattern;
  }

  setupEventListeners() {
    // Drum pad clicks
    document.addEventListener('click', (e) => {
      const drumPad = e.target.closest('.drum-pad');
      if (drumPad) {
        const drumType = drumPad.dataset.drum;
        this.playDrum(drumType);
        this.animateDrumPad(drumPad);
      }
    });

    // Drum pad right-click for adding to drum rack
    document.addEventListener('contextmenu', (e) => {
      const drumPad = e.target.closest('.drum-pad');
      if (drumPad) {
        e.preventDefault();
        const drumType = drumPad.dataset.drum;
        this.addDrumToRack(drumType);
        return false;
      }
    });

    // Kit selector
    document.getElementById('kit-select')?.addEventListener('change', (e) => {
      this.setKit(e.target.value);
    });

    // Master volume
    document.getElementById('master-volume')?.addEventListener('input', (e) => {
      this.setMasterVolume(e.target.value / 100);
    });

    // Sequencer controls
    this.setupSequencerControls();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  setupSequencerControls() {
    // Sequencer step clicks
    document.addEventListener('click', (e) => {
      const step = e.target.closest('.sequencer-step');
      if (step) {
        const drumType = step.dataset.drum;
        const stepIndex = parseInt(step.dataset.step);
        this.toggleStep(drumType, stepIndex);
      }
    });

    // Sequencer buttons
    document.getElementById('seq-play')?.addEventListener('click', () => {
      this.toggleSequencer();
    });

    document.getElementById('seq-stop')?.addEventListener('click', () => {
      this.stopSequencer();
    });

    document.getElementById('seq-clear')?.addEventListener('click', () => {
      this.clearSequencer();
    });

    document.getElementById('seq-save')?.addEventListener('click', () => {
      this.savePatternToChannel();
    });
  }

  handleKeyDown(e) {
    if (!this.isVisible) return;

    const key = e.key.toUpperCase();
    const keyMap = {
      'Q': 'kick',
      'W': 'snare',
      'E': 'hihat',
      'R': 'clap',
      'A': 'tom',
      'S': 'crash',
      'D': 'ride',
      'F': 'perc'
    };

    if (keyMap[key]) {
      e.preventDefault();
      this.playDrum(keyMap[key]);
      this.animateDrumPadByType(keyMap[key]);
    }

    // Space bar to toggle sequencer
    if (e.code === 'Space' && this.isVisible) {
      e.preventDefault();
      this.toggleSequencer();
    }
  }

  async playDrum(drumType, velocity = 1.0) {
    if (!this.drumMachine) {
      await this.initializeDrumMachine();
    }

    if (this.drumMachine && this.drumMachine.isLoaded) {
      this.drumMachine.playDrum(drumType, velocity);
      this.updateStatus(`Playing: ${drumType}`);
    } else {
      console.warn('Drum machine not ready');
    }
  }

  async initializeDrumMachine() {
    if (!this.flStudio.audioContext) {
      await this.flStudio.initAudio();
    }

    if (this.flStudio.audioContext && !this.drumMachine) {
      if (typeof DrumMachine !== 'undefined') {
        this.drumMachine = new DrumMachine(this.flStudio.audioContext);
        this.updateStatus('Drum Machine Ready');
      } else {
        console.error('DrumMachine class not found');
        this.updateStatus('Error: Drum Machine not available');
      }
    }
  }

  animateDrumPad(drumPad) {
    drumPad.classList.add('active');
    setTimeout(() => {
      drumPad.classList.remove('active');
    }, 100);
  }

  animateDrumPadByType(drumType) {
    const drumPad = document.querySelector(`[data-drum="${drumType}"]`);
    if (drumPad) {
      this.animateDrumPad(drumPad);
    }
  }

  setKit(kitName) {
    this.currentKit = kitName;
    if (this.drumMachine) {
      this.drumMachine.setKit(kitName);
      this.updateStatus(`Kit loaded: ${kitName}`);
    }
  }

  setMasterVolume(volume) {
    if (this.drumMachine) {
      this.drumMachine.setMasterVolume(volume);
    }
  }

  updateStatus(message) {
    const statusElement = document.getElementById('drum-machine-status');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.classList.add('pulse');
      setTimeout(() => {
        statusElement.classList.remove('pulse');
      }, 1000);
    }
  }

  toggleStep(drumType, stepIndex) {
    this.pattern[drumType][stepIndex] = !this.pattern[drumType][stepIndex];
    const step = document.querySelector(`[data-drum="${drumType}"][data-step="${stepIndex}"]`);
    if (step) {
      step.classList.toggle('active', this.pattern[drumType][stepIndex]);
    }
  }

  toggleSequencer() {
    if (this.isPlaying) {
      this.stopSequencer();
    } else {
      this.startSequencer();
    }
  }

  startSequencer() {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    const playBtn = document.getElementById('seq-play');
    if (playBtn) playBtn.textContent = '❚❚ Pause';

    const stepTime = (60 / this.flStudio.bpm) * 0.25 * 1000; // 16th notes

    this.sequencerInterval = setInterval(() => {
      this.playCurrentStep();
      this.currentStep = (this.currentStep + 1) % 16;
      this.updateStepIndicator();
    }, stepTime);

    this.updateStatus('Sequencer playing');
  }

  stopSequencer() {
    this.isPlaying = false;
    if (this.sequencerInterval) {
      clearInterval(this.sequencerInterval);
      this.sequencerInterval = null;
    }

    const playBtn = document.getElementById('seq-play');
    if (playBtn) playBtn.textContent = '▶ Play';

    this.updateStepIndicator();
    this.updateStatus('Sequencer stopped');
  }

  playCurrentStep() {
    Object.keys(this.pattern).forEach(drumType => {
      if (this.pattern[drumType][this.currentStep]) {
        this.playDrum(drumType, 0.8);
      }
    });
  }

  updateStepIndicator() {
    // Remove current step highlight
    document.querySelectorAll('.sequencer-step.current').forEach(step => {
      step.classList.remove('current');
    });

    if (this.isPlaying) {
      // Add current step highlight
      document.querySelectorAll(`[data-step="${this.currentStep}"]`).forEach(step => {
        step.classList.add('current');
      });
    }
  }

  clearSequencer() {
    this.pattern = this.createEmptyPattern();
    document.querySelectorAll('.sequencer-step').forEach(step => {
      step.classList.remove('active');
    });
    this.updateStatus('Sequencer cleared');
  }

  addDrumToRack(drumType) {
    if (this.flStudio && this.flStudio.addTrack) {
      const drumNames = {
        kick: 'Drum Kick',
        snare: 'Drum Snare',
        hihat: 'Drum Hi-Hat',
        clap: 'Drum Clap',
        tom: 'Drum Tom',
        crash: 'Drum Crash',
        ride: 'Drum Ride',
        perc: 'Drum Perc'
      };

      this.flStudio.addTrack(drumNames[drumType] || `Drum ${drumType}`, 'drum');
      this.updateStatus(`Added ${drumType} to drum rack`);
    } else {
      console.warn('Cannot add to drum rack: FL Studio instance not available');
    }
  }

  savePatternToChannel() {
    // Convert pattern to individual drum tracks in the channel rack
    Object.keys(this.pattern).forEach(drumType => {
      const hasSteps = this.pattern[drumType].some(step => step);
      if (hasSteps) {
        this.addDrumToRack(drumType);
      }
    });
    this.updateStatus('Pattern saved to channel rack');
  }

  show() {
    this.isVisible = true;
    const panel = document.getElementById('drum-machine-panel');
    if (panel) {
      panel.style.display = 'block';
    }
    this.initializeDrumMachine();
  }

  hide() {
    this.isVisible = false;
    this.stopSequencer();
    const panel = document.getElementById('drum-machine-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DrumMachineUI };
}
