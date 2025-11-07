/**
 * Channel Settings Window - Professional 7-tab modal for track parameter editing
 * Integrates with FLStudio app for real-time parameter updates
 * @module ui/ChannelSettingsWindow
 */

import type { Track, TrackParams, WaveformType } from '../types/FLStudio.types';

/**
 * FLStudio app interface
 */
interface FLStudioApp {
  tracks: Record<string, Track>;
  audioContext: AudioContext | null;
  ensureTrackDefaults: (track: Track) => Track;
  applyTrackParams: (trackId: number) => void;
  saveProject: (silent?: boolean) => void;
}

/**
 * Tab name type
 */
type TabName = 'instrument' | 'envelope' | 'filter' | 'lfo' | 'fx' | 'arpeggiator' | 'misc';

/**
 * Channel Settings Window - Professional 7-tab modal for track parameter editing
 * Integrates with FLStudio app for real-time parameter updates
 */
export class ChannelSettingsWindow {
  private readonly flStudio: FLStudioApp;
  private currentTrack: Track | null;
  private activeTab: TabName;

  /**
   * @param {FLStudioApp} flStudio - FLStudio app instance
   */
  constructor(flStudio: FLStudioApp) {
    this.flStudio = flStudio;
    this.currentTrack = null;
    this.activeTab = 'instrument';
    this.init();
  }

  /**
   * Initialize window
   */
  private init(): void {
    this.createStyles();
    this.createWindow();
    this.setupEventListeners();
  }

  /**
   * Create styles
   */
  private createStyles(): void {
    if (document.getElementById('channel-settings-styles')) return;

    const style = document.createElement('style');
    style.id = 'channel-settings-styles';
    style.textContent = `
      /* Styles are already in styles.css - this is just a placeholder */
    `;
    document.head.appendChild(style);
  }

  /**
   * Create window DOM
   */
  private createWindow(): void {
    if (document.getElementById('channel-settings-overlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'channel-settings-overlay';
    overlay.id = 'channel-settings-overlay';
    overlay.innerHTML = `
      <div class="channel-settings-window" onclick="event.stopPropagation()">
        <div class="channel-settings-header">
          <div class="channel-settings-title">
            <span class="channel-settings-icon" id="settings-track-icon">🎵</span>
            <span id="settings-track-name">Channel Settings</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="channel-test-btn" id="test-sound-btn">▶ Test Sound</button>
            <button class="channel-settings-close" onclick="document.getElementById('channel-settings-overlay')?.classList.remove('active')">×</button>
          </div>
        </div>
        
        <div class="channel-settings-tabs">
          <button class="channel-settings-tab active" data-tab="instrument">🎹 Instrument</button>
          <button class="channel-settings-tab" data-tab="envelope">📊 Envelope</button>
          <button class="channel-settings-tab" data-tab="filter">🎚 Filter</button>
          <button class="channel-settings-tab" data-tab="lfo">〰️ LFO</button>
          <button class="channel-settings-tab" data-tab="fx">✨ FX</button>
          <button class="channel-settings-tab" data-tab="arpeggiator">🎼 Arp</button>
          <button class="channel-settings-tab" data-tab="misc">⚙️ Misc</button>
        </div>
        
        <div class="channel-settings-content">
          ${this.getInstrumentPanelHTML()}
          ${this.getEnvelopePanelHTML()}
          ${this.getFilterPanelHTML()}
          ${this.getLFOPanelHTML()}
          ${this.getFXPanelHTML()}
          ${this.getArpeggiatorPanelHTML()}
          ${this.getMiscPanelHTML()}
        </div>
      </div>
    `;

    // Close on overlay click
    overlay.addEventListener('click', (e: MouseEvent) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });

    document.body.appendChild(overlay);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Tab switching
    document.querySelectorAll('.channel-settings-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabName = (tab as HTMLElement).dataset.tab as TabName | undefined;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // ESC to close
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const overlay = document.getElementById('channel-settings-overlay');
        if (overlay?.classList.contains('active')) {
          overlay.classList.remove('active');
        }
      }
    });

    // Test sound button
    const testBtn = document.getElementById('test-sound-btn');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (this.currentTrack && this.flStudio.audioContext) {
          this.playTestSound();
        }
      });
    }

    // Setup parameter handlers after window is created
    setTimeout(() => {
      this.setupParameterHandlers();
    }, 100);
  }

  /**
   * Switch active tab
   * @param {TabName} tabName - Tab name
   */
  private switchTab(tabName: TabName): void {
    this.activeTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.channel-settings-tab').forEach((tab) => {
      const tabData = (tab as HTMLElement).dataset.tab;
      tab.classList.toggle('active', tabData === tabName);
    });

    // Update panels
    document.querySelectorAll('.channel-settings-tab-panel').forEach((panel) => {
      const panelData = (panel as HTMLElement).dataset.panel;
      panel.classList.toggle('active', panelData === tabName);
    });

    // Redraw envelope if switching to envelope tab
    if (tabName === 'envelope') {
      this.drawEnvelope();
    }
  }

  /**
   * Open window for track
   * @param {number} trackId - Track ID
   */
  public open(trackId: number): void {
    const track = this.flStudio.tracks[trackId];
    if (!track) return;

    this.currentTrack = this.flStudio.ensureTrackDefaults(track);

    // Update header
    const icon = document.getElementById('settings-track-icon');
    const name = document.getElementById('settings-track-name');
    if (icon) icon.textContent = track.type === 'drum' ? '🥁' : '🎵';
    if (name) name.textContent = `${track.name} - Channel Settings`;

    // Load current values
    this.loadTrackValues();

    // Show window
    const overlay = document.getElementById('channel-settings-overlay');
    if (overlay) {
      overlay.classList.add('active');
      this.switchTab('instrument');
    }
  }

  /**
   * Load track values into UI
   */
  private loadTrackValues(): void {
    if (!this.currentTrack) return;
    const p: TrackParams = this.currentTrack.params || {
      volume: 1,
      pan: 0,
      amp: { a: 0.01, d: 0.08, s: 0.6, r: 0.2 },
      filter: { cutoff: 1500, resonance: 0.8, type: 'lowpass' },
      detune: 0,
      waveform: 'sawtooth',
      sends: { reverb: 0.18, delay: 0.12 },
    };

    // Instrument tab
    this.setSliderValue('inst-volume', (p.volume || 1) * 100);
    this.setSliderValue('inst-pan', (p.pan || 0) * 100);
    this.setSliderValue('inst-fine', p.detune || 0);
    this.setWaveform(p.waveform || 'sawtooth');

    // Envelope tab
    const amp = p.amp || { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
    this.setSliderValue('env-attack', (amp.a || 0.01) * 1000);
    this.setSliderValue('env-decay', (amp.d || 0.08) * 1000);
    this.setSliderValue('env-sustain', (amp.s || 0.6) * 100);
    this.setSliderValue('env-release', (amp.r || 0.2) * 1000);

    // Filter tab
    const flt = p.filter || { cutoff: 1500, resonance: 0.8, type: 'lowpass' };
    this.setSelectValue('filter-type', flt.type || 'lowpass');
    this.setSliderValue('filter-cutoff', flt.cutoff || 1500);
    this.setSliderValue('filter-resonance', flt.resonance || 0.8);

    // FX tab
    const sends = p.sends || { reverb: 0.18, delay: 0.12 };
    this.setSliderValue('fx-reverb', (sends.reverb || 0.18) * 100);
    this.setSliderValue('fx-delay', (sends.delay || 0.12) * 100);

    // Misc tab
    if (this.currentTrack.color) {
      const colorInput = document.getElementById('misc-color') as HTMLInputElement | null;
      if (colorInput) colorInput.value = this.currentTrack.color;
    }
    if (this.currentTrack.notes) {
      const notesInput = document.getElementById('misc-notes') as HTMLTextAreaElement | null;
      if (notesInput) notesInput.value = this.currentTrack.notes;
    }

    // Redraw envelope
    this.drawEnvelope();
  }

  /**
   * Set slider value
   * @param {string} id - Element ID
   * @param {number} value - Value
   */
  private setSliderValue(id: string, value: number): void {
    const slider = document.getElementById(id) as HTMLInputElement | null;
    const display = document.getElementById(`${id}-val`);
    if (slider) {
      slider.value = value.toString();
      if (display) {
        if (id === 'inst-pan') {
          display.textContent =
            value === 0 ? 'Center' : value < 0 ? `L ${Math.abs(value)}%` : `R ${value}%`;
        } else if (
          id.includes('volume') ||
          id.includes('reverb') ||
          id.includes('delay') ||
          id.includes('sustain')
        ) {
          display.textContent = `${Math.round(value)}%`;
        } else if (id.includes('attack') || id.includes('decay') || id.includes('release')) {
          display.textContent = `${Math.round(value)}ms`;
        } else if (id === 'filter-cutoff') {
          display.textContent = `${Math.round(value)}Hz`;
        } else if (id === 'filter-resonance') {
          display.textContent = value.toFixed(1);
        } else {
          display.textContent = Math.round(value).toString();
        }
      }
    }
  }

  /**
   * Set select value
   * @param {string} id - Element ID
   * @param {string} value - Value
   */
  private setSelectValue(id: string, value: string): void {
    const select = document.getElementById(id) as HTMLSelectElement | null;
    if (select) select.value = value;
  }

  /**
   * Set waveform
   * @param {WaveformType} waveform - Waveform type
   */
  private setWaveform(waveform: WaveformType): void {
    document.querySelectorAll('.waveform-btn').forEach((btn) => {
      const btnData = (btn as HTMLElement).dataset.waveform;
      btn.classList.toggle('active', btnData === waveform);
    });
  }

  /**
   * Setup parameter handlers
   */
  private setupParameterHandlers(): void {
    if (!this.currentTrack) return;

    // Ensure params exist
    if (!this.currentTrack.params) {
      this.currentTrack.params = {
        volume: 1,
        pan: 0,
        amp: { a: 0.01, d: 0.08, s: 0.6, r: 0.2 },
        filter: { cutoff: 1500, resonance: 0.8, type: 'lowpass' },
        detune: 0,
        waveform: 'sawtooth',
        sends: { reverb: 0.18, delay: 0.12 },
      };
    }

    // Instrument parameters
    this.setupSlider('inst-volume', (value: number) => {
      if (this.currentTrack?.params) {
        this.currentTrack.params.volume = value / 100;
        this.flStudio.applyTrackParams(this.currentTrack.id);
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('inst-pan', (value: number) => {
      if (this.currentTrack?.params) {
        this.currentTrack.params.pan = value / 100;
        this.flStudio.applyTrackParams(this.currentTrack.id);
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('inst-fine', (value: number) => {
      if (this.currentTrack?.params) {
        this.currentTrack.params.detune = value;
        this.flStudio.applyTrackParams(this.currentTrack.id);
        this.flStudio.saveProject(true);
      }
    });

    // Waveform buttons
    document.querySelectorAll('.waveform-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document
          .querySelectorAll('.waveform-btn')
          .forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const waveform = (btn as HTMLElement).dataset.waveform as WaveformType | undefined;
        if (waveform && this.currentTrack?.params) {
          this.currentTrack.params.waveform = waveform;
          this.flStudio.saveProject(true);
        }
      });
    });

    // Envelope parameters
    this.setupSlider('env-attack', (value: number) => {
      if (this.currentTrack?.params) {
        if (!this.currentTrack.params.amp) {
          this.currentTrack.params.amp = { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
        }
        this.currentTrack.params.amp.a = value / 1000;
        this.drawEnvelope();
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('env-decay', (value: number) => {
      if (this.currentTrack?.params) {
        if (!this.currentTrack.params.amp) {
          this.currentTrack.params.amp = { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
        }
        this.currentTrack.params.amp.d = value / 1000;
        this.drawEnvelope();
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('env-sustain', (value: number) => {
      if (this.currentTrack?.params) {
        if (!this.currentTrack.params.amp) {
          this.currentTrack.params.amp = { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
        }
        this.currentTrack.params.amp.s = value / 100;
        this.drawEnvelope();
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('env-release', (value: number) => {
      if (this.currentTrack?.params) {
        if (!this.currentTrack.params.amp) {
          this.currentTrack.params.amp = { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
        }
        this.currentTrack.params.amp.r = value / 1000;
        this.drawEnvelope();
        this.flStudio.saveProject(true);
      }
    });

    // Filter parameters
    this.setupSelect('filter-type', (value: string) => {
      if (this.currentTrack?.params?.filter) {
        this.currentTrack.params.filter.type = value as TrackParams['filter']['type'];
        this.flStudio.applyTrackParams(this.currentTrack.id);
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('filter-cutoff', (value: number) => {
      if (this.currentTrack?.params?.filter) {
        this.currentTrack.params.filter.cutoff = value;
        this.flStudio.applyTrackParams(this.currentTrack.id);
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('filter-resonance', (value: number) => {
      if (this.currentTrack?.params?.filter) {
        this.currentTrack.params.filter.resonance = value;
        this.flStudio.applyTrackParams(this.currentTrack.id);
        this.flStudio.saveProject(true);
      }
    });

    // FX sends
    this.setupSlider('fx-reverb', (value: number) => {
      if (this.currentTrack?.params) {
        if (!this.currentTrack.params.sends) {
          this.currentTrack.params.sends = { reverb: 0.18, delay: 0.12 };
        }
        this.currentTrack.params.sends.reverb = value / 100;
        this.flStudio.saveProject(true);
      }
    });

    this.setupSlider('fx-delay', (value: number) => {
      if (this.currentTrack?.params) {
        if (!this.currentTrack.params.sends) {
          this.currentTrack.params.sends = { reverb: 0.18, delay: 0.12 };
        }
        this.currentTrack.params.sends.delay = value / 100;
        this.flStudio.saveProject(true);
      }
    });

    // Misc
    const colorInput = document.getElementById('misc-color') as HTMLInputElement | null;
    if (colorInput) {
      colorInput.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (this.currentTrack) {
          this.currentTrack.color = target.value;
          // Update track icon color
          const trackElement = document.querySelector(
            `[data-track-id="${this.currentTrack.id}"]`
          );
          const icon = trackElement?.querySelector('.track-icon') as HTMLElement | null;
          if (icon) icon.style.background = target.value;
          this.flStudio.saveProject(true);
        }
      });
    }

    const notesInput = document.getElementById('misc-notes') as HTMLTextAreaElement | null;
    if (notesInput) {
      notesInput.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLTextAreaElement;
        if (this.currentTrack) {
          this.currentTrack.notes = target.value;
          this.flStudio.saveProject(true);
        }
      });
    }
  }

  /**
   * Setup slider handler
   * @param {string} id - Element ID
   * @param {Function} callback - Callback function
   */
  private setupSlider(id: string, callback: (value: number) => void): void {
    const slider = document.getElementById(id) as HTMLInputElement | null;
    if (!slider) return;

    slider.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      const display = document.getElementById(`${id}-val`);
      if (display) {
        if (id === 'inst-pan') {
          display.textContent =
            value === 0 ? 'Center' : value < 0 ? `L ${Math.abs(value)}%` : `R ${value}%`;
        } else if (
          id.includes('volume') ||
          id.includes('reverb') ||
          id.includes('delay') ||
          id.includes('sustain')
        ) {
          display.textContent = `${Math.round(value)}%`;
        } else if (id.includes('attack') || id.includes('decay') || id.includes('release')) {
          display.textContent = `${Math.round(value)}ms`;
        } else if (id === 'filter-cutoff') {
          display.textContent = `${Math.round(value)}Hz`;
        } else if (id === 'filter-resonance') {
          display.textContent = value.toFixed(1);
        } else {
          display.textContent = Math.round(value).toString();
        }
      }
      callback(value);
    });
  }

  /**
   * Setup select handler
   * @param {string} id - Element ID
   * @param {Function} callback - Callback function
   */
  private setupSelect(id: string, callback: (value: string) => void): void {
    const select = document.getElementById(id) as HTMLSelectElement | null;
    if (!select) return;

    select.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLSelectElement;
      callback(target.value);
    });
  }

  /**
   * Draw envelope visualization
   */
  private drawEnvelope(): void {
    if (!this.currentTrack) return;

    const canvas = document.getElementById('envelope-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const amp = this.currentTrack.params?.amp || { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };

    const width = canvas.width;
    const height = canvas.height;
    const padding = 10;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;

    // Clear
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (drawHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Calculate envelope points
    const totalTime = amp.a + amp.d + amp.r;
    const attackX = (amp.a / totalTime) * drawWidth;
    const decayX = ((amp.a + amp.d) / totalTime) * drawWidth;
    const sustainY = drawHeight - amp.s * drawHeight;

    // Draw envelope
    ctx.strokeStyle = '#FF7800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding + attackX, padding);
    ctx.lineTo(padding + decayX, padding + sustainY);
    ctx.lineTo(width - padding, padding + sustainY);
    ctx.stroke();

    // Fill
    ctx.fillStyle = 'rgba(255, 120, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(padding + attackX, padding);
    ctx.lineTo(padding + decayX, padding + sustainY);
    ctx.lineTo(width - padding, padding + sustainY);
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Play test sound
   */
  private playTestSound(): void {
    if (!this.flStudio.audioContext || !this.currentTrack) return;

    const ctx = this.flStudio.audioContext;
    const params = this.currentTrack.params;
    if (!params) return;

    // Create oscillator
    const osc = ctx.createOscillator();
    osc.type = params.waveform || 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);

    // Create gain for envelope
    const gain = ctx.createGain();
    const amp = params.amp || { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
    const now = ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(params.volume || 1, now + amp.a);
    gain.gain.linearRampToValueAtTime((params.volume || 1) * amp.s, now + amp.a + amp.d);
    gain.gain.linearRampToValueAtTime(0, now + amp.a + amp.d + amp.r);

    // Apply filter if available
    let output: AudioNode = gain;
    if (params.filter && params.filter.cutoff) {
      const filter = ctx.createBiquadFilter();
      filter.type = params.filter.type || 'lowpass';
      filter.frequency.setValueAtTime(params.filter.cutoff, now);
      filter.Q.setValueAtTime(params.filter.resonance || 0.8, now);
      gain.connect(filter);
      output = filter;
    }

    osc.connect(gain);
    output.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + amp.a + amp.d + amp.r + 0.1);
  }

  /**
   * Get instrument panel HTML
   */
  private getInstrumentPanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel active" data-panel="instrument">
        <div class="settings-section">
          <div class="settings-section-title">🎵 Oscillator</div>
          <div class="settings-grid">
            <div class="settings-control">
              <label class="settings-label">Waveform</label>
              <div class="settings-waveform-selector">
                <button class="waveform-btn" data-waveform="sine" title="Sine">∿</button>
                <button class="waveform-btn active" data-waveform="sawtooth" title="Sawtooth">⩘</button>
                <button class="waveform-btn" data-waveform="square" title="Square">⊓</button>
                <button class="waveform-btn" data-waveform="triangle" title="Triangle">△</button>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">🎚 Tuning</div>
          <div class="settings-grid">
            <div class="settings-control">
              <label class="settings-label">Fine Tune (cents)</label>
              <div class="settings-value" id="inst-fine-val">0</div>
              <input type="range" class="settings-slider" id="inst-fine" min="-100" max="100" value="0" step="1">
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">🔊 Mixing</div>
          <div class="settings-grid">
            <div class="settings-control">
              <label class="settings-label">Volume</label>
              <div class="settings-value" id="inst-volume-val">100%</div>
              <input type="range" class="settings-slider" id="inst-volume" min="0" max="200" value="100" step="1">
            </div>
            <div class="settings-control">
              <label class="settings-label">Pan</label>
              <div class="settings-value" id="inst-pan-val">Center</div>
              <input type="range" class="settings-slider" id="inst-pan" min="-100" max="100" value="0" step="1">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get envelope panel HTML
   */
  private getEnvelopePanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel" data-panel="envelope">
        <div class="settings-section">
          <div class="settings-section-title">📊 Amplitude Envelope (ADSR)</div>
          <div class="envelope-visualizer">
            <canvas class="envelope-canvas" id="envelope-canvas" width="600" height="80"></canvas>
          </div>
          <div class="settings-grid">
            <div class="settings-control">
              <label class="settings-label">Attack (ms)</label>
              <div class="settings-value" id="env-attack-val">10</div>
              <input type="range" class="settings-slider" id="env-attack" min="0" max="2000" value="10" step="1">
            </div>
            <div class="settings-control">
              <label class="settings-label">Decay (ms)</label>
              <div class="settings-value" id="env-decay-val">80</div>
              <input type="range" class="settings-slider" id="env-decay" min="0" max="2000" value="80" step="1">
            </div>
            <div class="settings-control">
              <label class="settings-label">Sustain (%)</label>
              <div class="settings-value" id="env-sustain-val">60</div>
              <input type="range" class="settings-slider" id="env-sustain" min="0" max="100" value="60" step="1">
            </div>
            <div class="settings-control">
              <label class="settings-label">Release (ms)</label>
              <div class="settings-value" id="env-release-val">200</div>
              <input type="range" class="settings-slider" id="env-release" min="0" max="3000" value="200" step="1">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get filter panel HTML
   */
  private getFilterPanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel" data-panel="filter">
        <div class="settings-section">
          <div class="settings-section-title">🎚 Filter Settings</div>
          <div class="settings-grid">
            <div class="settings-control">
              <label class="settings-label">Filter Type</label>
              <select class="settings-select" id="filter-type">
                <option value="lowpass">Low Pass</option>
                <option value="highpass">High Pass</option>
                <option value="bandpass">Band Pass</option>
                <option value="notch">Notch</option>
                <option value="allpass">All Pass</option>
                <option value="peaking">Peaking</option>
                <option value="lowshelf">Low Shelf</option>
                <option value="highshelf">High Shelf</option>
              </select>
            </div>
            <div class="settings-control">
              <label class="settings-label">Cutoff (Hz)</label>
              <div class="settings-value" id="filter-cutoff-val">1500</div>
              <input type="range" class="settings-slider" id="filter-cutoff" min="20" max="20000" value="1500" step="1">
            </div>
            <div class="settings-control">
              <label class="settings-label">Resonance (Q)</label>
              <div class="settings-value" id="filter-resonance-val">0.8</div>
              <input type="range" class="settings-slider" id="filter-resonance" min="0.1" max="20" value="0.8" step="0.1">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get LFO panel HTML
   */
  private getLFOPanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel" data-panel="lfo">
        <div class="settings-section">
          <div class="settings-section-title">〰️ LFO (Coming Soon)</div>
          <p style="color: var(--fl-text-secondary); padding: 20px; text-align: center;">
            LFO modulation features will be available in a future update.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get FX panel HTML
   */
  private getFXPanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel" data-panel="fx">
        <div class="settings-section">
          <div class="settings-section-title">✨ FX Sends</div>
          <div class="settings-grid">
            <div class="settings-control">
              <label class="settings-label">Reverb Send</label>
              <div class="settings-value" id="fx-reverb-val">18%</div>
              <input type="range" class="settings-slider" id="fx-reverb" min="0" max="100" value="18" step="1">
            </div>
            <div class="settings-control">
              <label class="settings-label">Delay Send</label>
              <div class="settings-value" id="fx-delay-val">12%</div>
              <input type="range" class="settings-slider" id="fx-delay" min="0" max="100" value="12" step="1">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get arpeggiator panel HTML
   */
  private getArpeggiatorPanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel" data-panel="arpeggiator">
        <div class="settings-section">
          <div class="settings-section-title">🎼 Arpeggiator (Coming Soon)</div>
          <p style="color: var(--fl-text-secondary); padding: 20px; text-align: center;">
            Arpeggiator features will be available in a future update.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Get misc panel HTML
   */
  private getMiscPanelHTML(): string {
    return `
      <div class="channel-settings-tab-panel" data-panel="misc">
        <div class="settings-section">
          <div class="settings-section-title">🎨 Track Color</div>
          <div class="settings-control">
            <label class="settings-label">Color</label>
            <input type="color" class="settings-input" id="misc-color" value="#FF7800">
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">📝 Notes</div>
          <div class="settings-control">
            <label class="settings-label">Track Notes</label>
            <textarea class="settings-input" id="misc-notes" rows="4" placeholder="Add notes about this sound..."></textarea>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize when app is ready
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const flStudio = (window as unknown as { flStudio?: FLStudioApp }).flStudio;
      if (flStudio) {
        (window as unknown as { channelSettingsWindow: ChannelSettingsWindow }).channelSettingsWindow =
          new ChannelSettingsWindow(flStudio);
      }
    }, 500);
  });
}

