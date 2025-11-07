// FL Studio Channel Settings Window - Ultra Professional Mode
(function() {
  'use strict';

  class ChannelSettingsWindow {
    constructor(flStudio) {
      this.flStudio = flStudio;
      this.currentTrack = null;
      this.activeTab = 'instrument';
      this.init();
    }

    init() {
      this.createStyles();
      this.createWindow();
      this.setupEventListeners();
    }

    createStyles() {
      if (document.getElementById('channel-settings-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'channel-settings-styles';
      style.textContent = `
        /* Channel Settings Window */
        .channel-settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        .channel-settings-overlay.active {
          display: flex;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .channel-settings-window {
          background: linear-gradient(180deg, #2d2d2d 0%, #1d1d1d 100%);
          border: 1px solid #444;
          border-radius: 8px;
          width: 700px;
          max-width: 90%;
          height: 550px;
          max-height: 85vh;
          box-shadow: 0 20px 60px rgba(0,0,0,0.9);
          display: flex;
          flex-direction: column;
          animation: windowSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
        }

        @keyframes windowSlideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .channel-settings-header {
          background: linear-gradient(135deg, #FF7800 0%, #FF5500 100%);
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #FF9900;
        }

        .channel-settings-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
        }

        .channel-settings-icon {
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .channel-settings-close {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          line-height: 1;
          transition: all 0.2s;
        }

        .channel-settings-close:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }

        .channel-test-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s;
          margin-right: 8px;
        }

        .channel-test-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.05);
        }

        .channel-test-btn:active {
          transform: scale(0.95);
        }

        .channel-settings-tabs {
          display: flex;
          background: #1a1a1a;
          border-bottom: 1px solid #333;
          overflow-x: auto;
        }

        .channel-settings-tab {
          padding: 8px 14px;
          background: transparent;
          border: none;
          color: #888;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          white-space: nowrap;
        }

        .channel-settings-tab:hover {
          color: #FF7800;
          background: rgba(255,120,0,0.05);
        }

        .channel-settings-tab.active {
          color: #FF7800;
          background: rgba(255,120,0,0.1);
          border-bottom-color: #FF7800;
        }

        .channel-settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .settings-tab-panel {
          display: none;
        }

        .settings-tab-panel.active {
          display: block;
          animation: tabFadeIn 0.2s ease-out;
        }

        @keyframes tabFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 12px;
        }

        .settings-section-title {
          font-size: 11px;
          font-weight: 600;
          color: #FF7800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255,120,0,0.2);
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .settings-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .settings-control {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-label {
          font-size: 10px;
          color: #aaa;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .settings-value {
          font-size: 13px;
          color: #FF7800;
          font-weight: 600;
          text-align: center;
          margin-bottom: 2px;
        }

        .settings-slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 100%);
          border-radius: 4px;
          outline: none;
        }

        .settings-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF7800 0%, #FF5500 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255,120,0,0.5);
          transition: all 0.15s;
        }

        .settings-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(255,120,0,0.7);
        }

        .settings-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF7800 0%, #FF5500 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(255,120,0,0.5);
        }

        .settings-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #fff;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.15s;
        }

        .settings-input:focus {
          outline: none;
          border-color: #FF7800;
          background: #222;
          box-shadow: 0 0 0 3px rgba(255,120,0,0.1);
        }

        .settings-select {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #fff;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .settings-select:focus {
          outline: none;
          border-color: #FF7800;
        }

        .settings-select option {
          background: #2a2a2a;
          color: #fff;
        }

        .settings-knob-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .settings-knob {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
          border: 3px solid #333;
          position: relative;
          cursor: pointer;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
        }

        .settings-knob::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 25px;
          background: #FF7800;
          border-radius: 2px;
          transform-origin: center 32.5px;
        }

        .settings-knob-value {
          font-size: 14px;
          color: #FF7800;
          font-weight: 600;
        }

        .settings-toggle {
          position: relative;
          width: 60px;
          height: 30px;
          background: #2a2a2a;
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid #444;
        }

        .settings-toggle.active {
          background: #FF7800;
          border-color: #FF7800;
        }

        .settings-toggle::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 22px;
          height: 22px;
          background: #fff;
          border-radius: 50%;
          transition: all 0.3s;
        }

        .settings-toggle.active::after {
          left: 32px;
        }

        .settings-waveform-selector {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .waveform-btn {
          padding: 12px;
          background: #1a1a1a;
          border: 2px solid #333;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 24px;
          text-align: center;
        }

        .waveform-btn:hover {
          background: #2a2a2a;
          border-color: #FF7800;
        }

        .waveform-btn.active {
          background: #FF7800;
          border-color: #FF7800;
        }

        .envelope-visualizer {
          width: 100%;
          height: 80px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }

        .envelope-canvas {
          width: 100%;
          height: 100%;
        }

        /* Track name that opens settings */
        .track-name {
          cursor: pointer;
          transition: all 0.15s;
        }

        .track-name:hover {
          color: #FF7800;
          text-decoration: underline;
        }

        .track-icon {
          cursor: pointer;
          transition: all 0.15s;
        }

        .track-icon:hover {
          transform: scale(1.1);
          filter: brightness(1.3);
        }
      `;
      document.head.appendChild(style);
    }

    createWindow() {
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
              <button class="channel-settings-close" onclick="document.getElementById('channel-settings-overlay').classList.remove('active')">×</button>
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
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });

      document.body.appendChild(overlay);
    }

    getInstrumentPanelHTML() {
      return `
        <div class="settings-tab-panel active" data-panel="instrument">
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
                <label class="settings-label">Coarse Pitch</label>
                <div class="settings-value" id="inst-coarse-val">0</div>
                <input type="range" class="settings-slider" id="inst-coarse" min="-24" max="24" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Fine Tune (cents)</label>
                <div class="settings-value" id="inst-fine-val">0</div>
                <input type="range" class="settings-slider" id="inst-fine" min="-100" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Unison Voices</label>
                <div class="settings-value" id="inst-unison-val">1</div>
                <input type="range" class="settings-slider" id="inst-unison" min="1" max="7" value="1" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Unison Detune</label>
                <div class="settings-value" id="inst-detune-val">10</div>
                <input type="range" class="settings-slider" id="inst-detune" min="0" max="50" value="10" step="1">
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

    getEnvelopePanelHTML() {
      return `
        <div class="settings-tab-panel" data-panel="envelope">
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

          <div class="settings-section">
            <div class="settings-section-title">🎚 Envelope Modulation</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">Attack Tension</label>
                <div class="settings-value" id="env-att-tension-val">0</div>
                <input type="range" class="settings-slider" id="env-att-tension" min="-100" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Decay Tension</label>
                <div class="settings-value" id="env-dec-tension-val">0</div>
                <input type="range" class="settings-slider" id="env-dec-tension" min="-100" max="100" value="0" step="1">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    getFilterPanelHTML() {
      return `
        <div class="settings-tab-panel" data-panel="filter">
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
              <div class="settings-control">
                <label class="settings-label">Gain (dB)</label>
                <div class="settings-value" id="filter-gain-val">0</div>
                <input type="range" class="settings-slider" id="filter-gain" min="-24" max="24" value="0" step="0.5">
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-title">🎛 Filter Envelope</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">Envelope Amount</label>
                <div class="settings-value" id="filter-env-amount-val">0</div>
                <input type="range" class="settings-slider" id="filter-env-amount" min="-100" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Velocity Amount</label>
                <div class="settings-value" id="filter-vel-val">0</div>
                <input type="range" class="settings-slider" id="filter-vel" min="0" max="100" value="0" step="1">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    getLFOPanelHTML() {
      return `
        <div class="settings-tab-panel" data-panel="lfo">
          <div class="settings-section">
            <div class="settings-section-title">〰️ LFO 1</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">LFO Shape</label>
                <select class="settings-select" id="lfo-shape">
                  <option value="sine">Sine</option>
                  <option value="triangle">Triangle</option>
                  <option value="square">Square</option>
                  <option value="sawtooth">Sawtooth</option>
                  <option value="random">Random (S&H)</option>
                </select>
              </div>
              <div class="settings-control">
                <label class="settings-label">Rate (Hz)</label>
                <div class="settings-value" id="lfo-rate-val">4.0</div>
                <input type="range" class="settings-slider" id="lfo-rate" min="0.1" max="20" value="4" step="0.1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Depth</label>
                <div class="settings-value" id="lfo-depth-val">50</div>
                <input type="range" class="settings-slider" id="lfo-depth" min="0" max="100" value="50" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Phase</label>
                <div class="settings-value" id="lfo-phase-val">0°</div>
                <input type="range" class="settings-slider" id="lfo-phase" min="0" max="360" value="0" step="1">
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-title">🎯 LFO Destinations</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">→ Pitch Amount</label>
                <div class="settings-value" id="lfo-pitch-val">0</div>
                <input type="range" class="settings-slider" id="lfo-pitch" min="-100" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">→ Filter Amount</label>
                <div class="settings-value" id="lfo-filter-val">0</div>
                <input type="range" class="settings-slider" id="lfo-filter" min="-100" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">→ Volume Amount</label>
                <div class="settings-value" id="lfo-volume-val">0</div>
                <input type="range" class="settings-slider" id="lfo-volume" min="0" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">→ Pan Amount</label>
                <div class="settings-value" id="lfo-pan-val">0</div>
                <input type="range" class="settings-slider" id="lfo-pan" min="0" max="100" value="0" step="1">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    getFXPanelHTML() {
      return `
        <div class="settings-tab-panel" data-panel="fx">
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
              <div class="settings-control">
                <label class="settings-label">Chorus Send</label>
                <div class="settings-value" id="fx-chorus-val">0%</div>
                <input type="range" class="settings-slider" id="fx-chorus" min="0" max="100" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Distortion</label>
                <div class="settings-value" id="fx-distortion-val">0%</div>
                <input type="range" class="settings-slider" id="fx-distortion" min="0" max="100" value="0" step="1">
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="settings-section-title">🎛 EQ</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">Low (100Hz)</label>
                <div class="settings-value" id="fx-eq-low-val">0dB</div>
                <input type="range" class="settings-slider" id="fx-eq-low" min="-12" max="12" value="0" step="0.5">
              </div>
              <div class="settings-control">
                <label class="settings-label">Mid (1kHz)</label>
                <div class="settings-value" id="fx-eq-mid-val">0dB</div>
                <input type="range" class="settings-slider" id="fx-eq-mid" min="-12" max="12" value="0" step="0.5">
              </div>
              <div class="settings-control">
                <label class="settings-label">High (8kHz)</label>
                <div class="settings-value" id="fx-eq-high-val">0dB</div>
                <input type="range" class="settings-slider" id="fx-eq-high" min="-12" max="12" value="0" step="0.5">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    getArpeggiatorPanelHTML() {
      return `
        <div class="settings-tab-panel" data-panel="arpeggiator">
          <div class="settings-section">
            <div class="settings-section-title">🎼 Arpeggiator</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">Enable</label>
                <div class="settings-toggle" id="arp-enable"></div>
              </div>
              <div class="settings-control">
                <label class="settings-label">Pattern</label>
                <select class="settings-select" id="arp-pattern">
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="updown">Up/Down</option>
                  <option value="random">Random</option>
                  <option value="chord">Chord</option>
                </select>
              </div>
              <div class="settings-control">
                <label class="settings-label">Rate</label>
                <select class="settings-select" id="arp-rate">
                  <option value="1/4">1/4</option>
                  <option value="1/8">1/8</option>
                  <option value="1/16">1/16</option>
                  <option value="1/32">1/32</option>
                </select>
              </div>
              <div class="settings-control">
                <label class="settings-label">Gate</label>
                <div class="settings-value" id="arp-gate-val">80%</div>
                <input type="range" class="settings-slider" id="arp-gate" min="10" max="100" value="80" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Octave Range</label>
                <div class="settings-value" id="arp-octaves-val">2</div>
                <input type="range" class="settings-slider" id="arp-octaves" min="1" max="4" value="2" step="1">
              </div>
            </div>
          </div>
        </div>
      `;
    }

    getMiscPanelHTML() {
      return `
        <div class="settings-tab-panel" data-panel="misc">
          <div class="settings-section">
            <div class="settings-section-title">⚙️ General</div>
            <div class="settings-grid">
              <div class="settings-control">
                <label class="settings-label">Polyphony</label>
                <div class="settings-value" id="misc-poly-val">8</div>
                <input type="range" class="settings-slider" id="misc-poly" min="1" max="32" value="8" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Portamento</label>
                <div class="settings-value" id="misc-porta-val">0ms</div>
                <input type="range" class="settings-slider" id="misc-porta" min="0" max="500" value="0" step="1">
              </div>
              <div class="settings-control">
                <label class="settings-label">Velocity Sensitivity</label>
                <div class="settings-value" id="misc-vel-val">100%</div>
                <input type="range" class="settings-slider" id="misc-vel" min="0" max="200" value="100" step="1">
              </div>
            </div>
          </div>

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

    setupEventListeners() {
      // Tab switching
      document.querySelectorAll('.channel-settings-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabName = tab.dataset.tab;
          this.switchTab(tabName);
        });
      });

      // Track icon/name click to open settings
      document.addEventListener('click', (e) => {
        const trackIcon = e.target.closest('.track-icon');
        const trackName = e.target.closest('.track-name');
        
        if (trackIcon || trackName) {
          const trackElement = e.target.closest('.track');
          if (trackElement) {
            const trackId = parseInt(trackElement.dataset.trackId, 10);
            this.openSettings(trackId);
          }
        }
      });

      // Test sound button
      document.addEventListener('click', (e) => {
        if (e.target.id === 'test-sound-btn' || e.target.closest('#test-sound-btn')) {
          if (this.currentTrack) {
            console.log('🔊 Testing sound for track:', this.currentTrack.name);
            // Play the sound using the track's parameters
            const out = this.flStudio.getTrackOutput(this.currentTrack.id);
            if (out && this.flStudio.playSound) {
              this.flStudio.playSound(this.currentTrack.type, this.currentTrack.name, out.input, this.currentTrack);
            }
          }
        }
      });

      // Close on Esc
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          document.getElementById('channel-settings-overlay').classList.remove('active');
        }
      });

      // Setup parameter handlers (will be populated when settings open)
      this.setupParameterHandlers();
    }

    switchTab(tabName) {
      // Update tabs
      document.querySelectorAll('.channel-settings-tab').forEach(t => t.classList.remove('active'));
      document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
      
      // Update panels
      document.querySelectorAll('.settings-tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelector(`[data-panel="${tabName}"]`).classList.add('active');
      
      this.activeTab = tabName;
      
      // Redraw canvas if switching to envelope
      if (tabName === 'envelope') {
        this.drawEnvelopeVisualizer();
      }
    }

    openSettings(trackId) {
      const track = this.flStudio.tracks[trackId];
      if (!track) {
        console.error('❌ Track not found:', trackId);
        return;
      }

      this.currentTrack = track;
      console.log('🎛 Opening settings for track:', trackId, track.name, 'params:', track.params);
      
      // Update header
      const icon = document.getElementById('settings-track-icon');
      const name = document.getElementById('settings-track-name');
      icon.textContent = track.type === 'drum' ? '🥁' : '🎹';
      name.textContent = `${track.name} - Channel Settings`;
      
      // Load current values
      this.loadParametersIntoWindow(track);
      
      // Show window
      document.getElementById('channel-settings-overlay').classList.add('active');
      
      // Draw visualizer if on envelope tab
      if (this.activeTab === 'envelope') {
        setTimeout(() => this.drawEnvelopeVisualizer(), 100);
      }
    }

    loadParametersIntoWindow(track) {
      const p = track.params || {};
      
      // Instrument tab
      document.querySelectorAll('.waveform-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.waveform === (p.waveform || 'sawtooth'));
      });
      
      // Load all values (simplified - in real implementation would map all params)
      this.updateValue('inst-coarse', p.coarse || 0);
      this.updateValue('inst-fine', p.detune || 0);
      this.updateValue('inst-volume', (p.volume || 1) * 100);
      this.updateValue('inst-pan', (p.pan || 0) * 100);
      
      // Envelope
      this.updateValue('env-attack', (p.amp?.a || 0.01) * 1000);
      this.updateValue('env-decay', (p.amp?.d || 0.08) * 1000);
      this.updateValue('env-sustain', (p.amp?.s || 0.6) * 100);
      this.updateValue('env-release', (p.amp?.r || 0.2) * 1000);
      
      // Filter
      const filterType = document.getElementById('filter-type');
      if (filterType) filterType.value = p.filter?.type || 'lowpass';
      this.updateValue('filter-cutoff', p.filter?.cutoff || 1500);
      this.updateValue('filter-resonance', p.filter?.resonance || 0.8);
      
      // FX
      this.updateValue('fx-reverb', (p.sends?.reverb || 0.18) * 100);
      this.updateValue('fx-delay', (p.sends?.delay || 0.12) * 100);
    }

    updateValue(id, value) {
      const slider = document.getElementById(id);
      const display = document.getElementById(`${id}-val`);
      if (slider) slider.value = value;
      if (display) {
        // Format display based on parameter type
        if (id.includes('percent') || id.includes('val')) {
          display.textContent = `${Math.round(value)}%`;
        } else if (id.includes('pan')) {
          display.textContent = value === 0 ? 'Center' : (value < 0 ? `${Math.abs(value)}% L` : `${value}% R`);
        } else {
          display.textContent = value;
        }
      }
    }

    setupParameterHandlers() {
      // Real-time parameter updates
      document.querySelectorAll('.settings-slider').forEach(slider => {
        slider.addEventListener('input', (e) => {
          if (!this.currentTrack) return;
          
          const display = document.getElementById(`${e.target.id}-val`);
          const value = parseFloat(e.target.value);
          
          // Update display
          if (display) {
            if (e.target.id.includes('pan') && e.target.id.includes('inst')) {
              display.textContent = value === 0 ? 'Center' : (value < 0 ? `${Math.abs(value)}% L` : `${value}% R`);
            } else if (e.target.id.includes('percent') || e.target.id.includes('reverb') || e.target.id.includes('delay') || e.target.id.includes('chorus') || e.target.id.includes('distortion') || e.target.id.includes('sustain') || e.target.id.includes('gate') || e.target.id.includes('volume') || e.target.id.includes('vel') || e.target.id.includes('poly')) {
              display.textContent = `${Math.round(value)}%`;
            } else if (e.target.id.includes('attack') || e.target.id.includes('decay') || e.target.id.includes('release') || e.target.id.includes('porta')) {
              display.textContent = `${Math.round(value)}ms`;
            } else if (e.target.id.includes('phase')) {
              display.textContent = `${Math.round(value)}°`;
            } else if (e.target.id.includes('eq')) {
              display.textContent = `${value.toFixed(1)}dB`;
            } else if (e.target.id.includes('rate') && e.target.id.includes('lfo')) {
              display.textContent = value.toFixed(1);
            } else if (e.target.id.includes('resonance')) {
              display.textContent = value.toFixed(1);
            } else {
              display.textContent = Math.round(value);
            }
          }
          
          // Save to track params
          if (!this.currentTrack.params) this.currentTrack.params = {};
          
          console.log('💾 Saving parameter:', e.target.id, '=', value, 'for track', this.currentTrack.id);
          
          // Map UI controls to track params
          if (e.target.id === 'inst-volume') {
            this.currentTrack.params.volume = value / 100;
            console.log('  → Volume set to', this.currentTrack.params.volume);
          } else if (e.target.id === 'inst-pan') {
            this.currentTrack.params.pan = value / 100;
            console.log('  → Pan set to', this.currentTrack.params.pan);
          } else if (e.target.id === 'inst-fine') {
            this.currentTrack.params.detune = value;
            console.log('  → Detune set to', this.currentTrack.params.detune);
          } else if (e.target.id === 'env-attack') {
            if (!this.currentTrack.params.amp) this.currentTrack.params.amp = {};
            this.currentTrack.params.amp.a = value / 1000;
            console.log('  → Attack set to', this.currentTrack.params.amp.a, 's');
          } else if (e.target.id === 'env-decay') {
            if (!this.currentTrack.params.amp) this.currentTrack.params.amp = {};
            this.currentTrack.params.amp.d = value / 1000;
            console.log('  → Decay set to', this.currentTrack.params.amp.d, 's');
          } else if (e.target.id === 'env-sustain') {
            if (!this.currentTrack.params.amp) this.currentTrack.params.amp = {};
            this.currentTrack.params.amp.s = value / 100;
            console.log('  → Sustain set to', this.currentTrack.params.amp.s);
          } else if (e.target.id === 'env-release') {
            if (!this.currentTrack.params.amp) this.currentTrack.params.amp = {};
            this.currentTrack.params.amp.r = value / 1000;
            console.log('  → Release set to', this.currentTrack.params.amp.r, 's');
          } else if (e.target.id === 'filter-cutoff') {
            if (!this.currentTrack.params.filter) this.currentTrack.params.filter = {};
            this.currentTrack.params.filter.cutoff = value;
            console.log('  → Filter cutoff set to', this.currentTrack.params.filter.cutoff, 'Hz');
          } else if (e.target.id === 'filter-resonance') {
            if (!this.currentTrack.params.filter) this.currentTrack.params.filter = {};
            this.currentTrack.params.filter.resonance = value;
            console.log('  → Filter resonance set to', this.currentTrack.params.filter.resonance);
          } else if (e.target.id === 'fx-reverb') {
            if (!this.currentTrack.params.sends) this.currentTrack.params.sends = {};
            this.currentTrack.params.sends.reverb = value / 100;
          } else if (e.target.id === 'fx-delay') {
            if (!this.currentTrack.params.sends) this.currentTrack.params.sends = {};
            this.currentTrack.params.sends.delay = value / 100;
          }
          
          // Apply changes to audio (for volume/pan only - filters/ADSR apply on next note)
          if (this.flStudio.applyTrackParams) {
            this.flStudio.applyTrackParams(this.currentTrack.id);
            console.log('  ✓ Applied to audio engine');
          }
          
          // Save project
          this.flStudio.saveProject(true);
          console.log('  ✓ Project saved');
          
          // Flash the track to show it updated
          this.flashTrackUpdate(this.currentTrack.id);
          
          // Redraw envelope if on envelope tab
          if (this.activeTab === 'envelope' && e.target.id.includes('env-')) {
            this.drawEnvelopeVisualizer();
          }
        });
      });

      // Filter type dropdown
      const filterType = document.getElementById('filter-type');
      if (filterType) {
        filterType.addEventListener('change', (e) => {
          if (!this.currentTrack) return;
          if (!this.currentTrack.params.filter) this.currentTrack.params.filter = {};
          this.currentTrack.params.filter.type = e.target.value;
          if (this.flStudio.applyTrackParams) {
            this.flStudio.applyTrackParams(this.currentTrack.id);
          }
          this.flStudio.saveProject(true);
        });
      }

      // Waveform buttons
      document.querySelectorAll('.waveform-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this.currentTrack) return;
          document.querySelectorAll('.waveform-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.currentTrack.params.waveform = btn.dataset.waveform;
          if (this.flStudio.applyTrackParams) {
            this.flStudio.applyTrackParams(this.currentTrack.id);
          }
          this.flStudio.saveProject(true);
        });
      });

      // Toggle buttons
      document.querySelectorAll('.settings-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
          toggle.classList.toggle('active');
          // Save toggle state if needed
          this.flStudio.saveProject(true);
        });
      });

      // Color picker
      const colorPicker = document.getElementById('misc-color');
      if (colorPicker) {
        colorPicker.addEventListener('change', (e) => {
          if (!this.currentTrack) return;
          this.currentTrack.color = e.target.value;
          this.flStudio.saveProject(true);
          // Update track icon color if needed
          const trackElement = document.querySelector(`[data-track-id="${this.currentTrack.id}"]`);
          if (trackElement) {
            const icon = trackElement.querySelector('.track-icon');
            if (icon) icon.style.background = e.target.value;
          }
        });
      }

      // Notes textarea
      const notesArea = document.getElementById('misc-notes');
      if (notesArea) {
        notesArea.addEventListener('input', (e) => {
          if (!this.currentTrack) return;
          this.currentTrack.notes = e.target.value;
          this.flStudio.saveProject(true);
        });
      }
    }

    flashTrackUpdate(trackId) {
      const trackElement = document.querySelector(`[data-track-id="${trackId}"]`);
      if (trackElement) {
        trackElement.style.transition = 'background 0.15s';
        trackElement.style.background = 'rgba(255, 120, 0, 0.2)';
        setTimeout(() => {
          trackElement.style.background = '';
        }, 150);
      }
    }

    drawEnvelopeVisualizer() {
      const canvas = document.getElementById('envelope-canvas');
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, width, height);
      
      // Get ADSR values
      const attack = parseFloat(document.getElementById('env-attack')?.value || 10);
      const decay = parseFloat(document.getElementById('env-decay')?.value || 80);
      const sustain = parseFloat(document.getElementById('env-sustain')?.value || 60) / 100;
      const release = parseFloat(document.getElementById('env-release')?.value || 200);
      
      // Calculate positions
      const totalTime = attack + decay + 100 + release; // 100ms sustain hold
      const attackX = (attack / totalTime) * width;
      const decayX = ((attack + decay) / totalTime) * width;
      const sustainX = ((attack + decay + 100) / totalTime) * width;
      const releaseX = width;
      
      const attackY = 5;
      const sustainY = height - (sustain * (height - 10)) - 5;
      const bottomY = height - 5;
      
      // Draw envelope
      ctx.strokeStyle = '#FF7800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(attackX, attackY); // Attack
      ctx.lineTo(decayX, sustainY); // Decay
      ctx.lineTo(sustainX, sustainY); // Sustain
      ctx.lineTo(releaseX, bottomY); // Release
      ctx.stroke();
      
      // Fill area
      ctx.fillStyle = 'rgba(255,120,0,0.1)';
      ctx.beginPath();
      ctx.moveTo(0, bottomY);
      ctx.lineTo(attackX, attackY);
      ctx.lineTo(decayX, sustainY);
      ctx.lineTo(sustainX, sustainY);
      ctx.lineTo(releaseX, bottomY);
      ctx.closePath();
      ctx.fill();
      
      // Draw grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const y = (height / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }

  // Initialize when app is ready
  const init = () => {
    if (window.flStudio && window.flStudio.tracks) {
      const settingsWindow = new ChannelSettingsWindow(window.flStudio);
      console.log('✨ Channel Settings Window loaded');
    } else {
      setTimeout(init, 100);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
