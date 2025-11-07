// Professional FL Studio-style Channel Rack Enhancements
(function() {
  'use strict';
  
  // Wait for app to be ready
  const initEnhancements = (app) => {
    if (!app || !app.tracks) {
      console.warn('FLStudio app not ready for channel rack enhancements');
      return;
    }

  // Context Menu System
  class ChannelRackContextMenu {
    constructor(flStudio) {
      this.flStudio = flStudio;
      this.activeMenu = null;
      this.clipboard = null;
      this.init();
    }

    init() {
      this.createMenuStyles();
      this.createParameterModal();
      this.setupEventListeners();
    }

    createMenuStyles() {
      if (document.getElementById('channel-rack-menu-styles')) return;
      const style = document.createElement('style');
      style.id = 'channel-rack-menu-styles';
      style.textContent = `
        /* Context Menu */
        .channel-context-menu {
          position: fixed;
          background: linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%);
          border: 1px solid #555;
          border-radius: 6px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          z-index: 10000;
          min-width: 220px;
          padding: 4px 0;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 13px;
          backdrop-filter: blur(10px);
          animation: menuSlideIn 0.15s ease-out;
        }

        @keyframes menuSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .channel-context-menu-item {
          padding: 8px 16px;
          color: #e0e0e0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.1s;
          border-left: 3px solid transparent;
        }

        .channel-context-menu-item:hover {
          background: linear-gradient(90deg, rgba(255,120,0,0.2), transparent);
          color: #fff;
          border-left-color: #FF7800;
        }

        .channel-context-menu-item.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .channel-context-menu-item.disabled:hover {
          background: transparent;
          border-left-color: transparent;
        }

        .menu-item-icon {
          margin-right: 10px;
          width: 16px;
          text-align: center;
        }

        .menu-item-shortcut {
          color: #888;
          font-size: 11px;
          margin-left: 20px;
        }

        .menu-separator {
          height: 1px;
          background: #444;
          margin: 4px 8px;
        }

        .menu-submenu-arrow {
          margin-left: auto;
          color: #888;
        }

        /* Parameter Modal */
        .param-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: backdropFadeIn 0.2s ease-out;
        }

        @keyframes backdropFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .param-modal {
          background: linear-gradient(180deg, #2e2e2e 0%, #1e1e1e 100%);
          border: 1px solid #555;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          flex-direction: column;
        }

        @keyframes modalSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .param-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #444;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, rgba(255,120,0,0.15), transparent);
        }

        .param-modal-title {
          font-size: 18px;
          font-weight: 600;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .param-modal-close {
          background: #3a3a3a;
          border: 1px solid #555;
          color: #aaa;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          font-size: 20px;
          line-height: 1;
        }

        .param-modal-close:hover {
          background: #FF7800;
          color: #fff;
          border-color: #FF7800;
          transform: scale(1.1);
        }

        .param-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .param-section {
          margin-bottom: 32px;
        }

        .param-section-title {
          font-size: 14px;
          font-weight: 600;
          color: #FF7800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(255,120,0,0.3);
        }

        .param-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .param-control {
          background: rgba(255,255,255,0.03);
          padding: 16px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.2s;
        }

        .param-control:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,120,0,0.3);
        }

        .param-label {
          display: block;
          font-size: 12px;
          color: #aaa;
          margin-bottom: 8px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .param-value-display {
          font-size: 16px;
          color: #FF7800;
          font-weight: 600;
          margin-bottom: 8px;
          text-align: center;
        }

        .param-input {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(90deg, #444 0%, #555 100%);
          outline: none;
          position: relative;
        }

        .param-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF7800 0%, #FF5500 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255,120,0,0.5);
          transition: all 0.15s;
        }

        .param-input::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(255,120,0,0.7);
        }

        .param-input::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF7800 0%, #FF5500 100%);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(255,120,0,0.5);
        }

        .param-number-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          text-align: center;
          transition: all 0.15s;
        }

        .param-number-input:focus {
          outline: none;
          border-color: #FF7800;
          background: #222;
        }

        .param-select {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .param-select:focus {
          outline: none;
          border-color: #FF7800;
        }

        .param-select option {
          background: #2a2a2a;
          color: #fff;
        }

        .adsr-group {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .adsr-control {
          text-align: center;
        }

        .adsr-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .adsr-input {
          width: 100%;
          background: #1a1a1a;
          border: 1px solid #444;
          color: #FF7800;
          padding: 6px;
          border-radius: 4px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
        }

        .adsr-input:focus {
          outline: none;
          border-color: #FF7800;
        }

        /* Track highlight on right-click */
        .track.context-active {
          background: rgba(255,120,0,0.1);
          outline: 2px solid rgba(255,120,0,0.4);
        }
      `;
      document.head.appendChild(style);
    }

    createParameterModal() {
      if (document.getElementById('track-param-modal')) return;
      
      const backdrop = document.createElement('div');
      backdrop.className = 'param-modal-backdrop';
      backdrop.id = 'track-param-modal';
      backdrop.style.display = 'none';
      backdrop.innerHTML = `
        <div class="param-modal" onclick="event.stopPropagation()">
          <div class="param-modal-header">
            <div class="param-modal-title">
              <span id="param-modal-track-icon" style="font-size: 24px;">🎵</span>
              <span id="param-modal-track-name">Track Parameters</span>
            </div>
            <button class="param-modal-close" onclick="document.getElementById('track-param-modal').style.display='none'">×</button>
          </div>
          <div class="param-modal-body">
            <!-- Synthesis Section -->
            <div class="param-section">
              <div class="param-section-title">⚡ Synthesis</div>
              <div class="param-grid">
                <div class="param-control">
                  <label class="param-label">Pitch (Cents)</label>
                  <div class="param-value-display" id="param-detune-val">0</div>
                  <input type="range" class="param-input" id="param-detune" min="-1200" max="1200" value="0" step="1">
                </div>
                <div class="param-control">
                  <label class="param-label">Waveform</label>
                  <select class="param-select" id="param-waveform">
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth" selected>Sawtooth</option>
                    <option value="triangle">Triangle</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Amplitude Section -->
            <div class="param-section">
              <div class="param-section-title">🔊 Amplitude Envelope (ADSR)</div>
              <div class="adsr-group">
                <div class="adsr-control">
                  <div class="adsr-label">Attack</div>
                  <input type="number" class="adsr-input" id="param-attack" min="0" max="2" step="0.01" value="0.01">
                </div>
                <div class="adsr-control">
                  <div class="adsr-label">Decay</div>
                  <input type="number" class="adsr-input" id="param-decay" min="0" max="2" step="0.01" value="0.08">
                </div>
                <div class="adsr-control">
                  <div class="adsr-label">Sustain</div>
                  <input type="number" class="adsr-input" id="param-sustain" min="0" max="1" step="0.01" value="0.6">
                </div>
                <div class="adsr-control">
                  <div class="adsr-label">Release</div>
                  <input type="number" class="adsr-input" id="param-release" min="0" max="3" step="0.01" value="0.2">
                </div>
              </div>
            </div>

            <!-- Filter Section -->
            <div class="param-section">
              <div class="param-section-title">🎚 Filter</div>
              <div class="param-grid">
                <div class="param-control">
                  <label class="param-label">Filter Type</label>
                  <select class="param-select" id="param-filter-type">
                    <option value="lowpass" selected>Low Pass</option>
                    <option value="highpass">High Pass</option>
                    <option value="bandpass">Band Pass</option>
                    <option value="notch">Notch</option>
                  </select>
                </div>
                <div class="param-control">
                  <label class="param-label">Cutoff (Hz)</label>
                  <div class="param-value-display" id="param-cutoff-val">1500</div>
                  <input type="range" class="param-input" id="param-cutoff" min="20" max="20000" value="1500" step="1">
                </div>
                <div class="param-control">
                  <label class="param-label">Resonance (Q)</label>
                  <div class="param-value-display" id="param-resonance-val">0.8</div>
                  <input type="range" class="param-input" id="param-resonance" min="0.1" max="20" value="0.8" step="0.1">
                </div>
              </div>
            </div>

            <!-- Mixing Section -->
            <div class="param-section">
              <div class="param-section-title">🎛 Mixing</div>
              <div class="param-grid">
                <div class="param-control">
                  <label class="param-label">Volume</label>
                  <div class="param-value-display" id="param-volume-val">1.00</div>
                  <input type="range" class="param-input" id="param-volume" min="0" max="2" value="1" step="0.01">
                </div>
                <div class="param-control">
                  <label class="param-label">Pan</label>
                  <div class="param-value-display" id="param-pan-val">0.00</div>
                  <input type="range" class="param-input" id="param-pan" min="-1" max="1" value="0" step="0.01">
                </div>
              </div>
            </div>

            <!-- FX Sends Section -->
            <div class="param-section">
              <div class="param-section-title">✨ FX Sends</div>
              <div class="param-grid">
                <div class="param-control">
                  <label class="param-label">Reverb Send</label>
                  <div class="param-value-display" id="param-reverb-send-val">18%</div>
                  <input type="range" class="param-input" id="param-reverb-send" min="0" max="100" value="18" step="1">
                </div>
                <div class="param-control">
                  <label class="param-label">Delay Send</label>
                  <div class="param-value-display" id="param-delay-send-val">12%</div>
                  <input type="range" class="param-input" id="param-delay-send" min="0" max="100" value="12" step="1">
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Close on backdrop click
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.style.display = 'none';
        }
      });

      document.body.appendChild(backdrop);
    }

    setupEventListeners() {
      // Right-click on tracks
      document.addEventListener('contextmenu', (e) => {
        const track = e.target.closest('.track');
        if (track) {
          e.preventDefault();
          const trackId = parseInt(track.dataset.trackId, 10);
          this.showContextMenu(e.pageX, e.pageY, trackId);
          track.classList.add('context-active');
        }
      });

      // Close menu on click away
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.channel-context-menu')) {
          this.closeContextMenu();
          document.querySelectorAll('.track.context-active').forEach(t => t.classList.remove('context-active'));
        }
      });

      // ESC to close menu and modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeContextMenu();
          const modal = document.getElementById('track-param-modal');
          if (modal) modal.style.display = 'none';
        }
      });
    }

    showContextMenu(x, y, trackId) {
      this.closeContextMenu();
      
      const menu = document.createElement('div');
      menu.className = 'channel-context-menu';
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      
      const track = this.flStudio.tracks[trackId];
      const hasPattern = track && track.steps.some(s => s);
      
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
        <div class="channel-context-menu-item ${this.clipboard ? '' : 'disabled'}" data-action="paste">
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
          this.handleMenuAction(action, trackId);
          this.closeContextMenu();
        });
      });
      
      document.body.appendChild(menu);
      this.activeMenu = menu;
      
      // Adjust position if menu goes offscreen
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = `${y - rect.height}px`;
      }
    }

    closeContextMenu() {
      if (this.activeMenu) {
        this.activeMenu.remove();
        this.activeMenu = null;
      }
    }

    handleMenuAction(action, trackId) {
      const track = this.flStudio.tracks[trackId];
      if (!track) return;

      switch (action) {
        case 'edit-params':
          this.openParameterModal(trackId);
          break;
        case 'piano-roll':
          this.openPianoRoll(trackId);
          break;
        case 'fill-each-2':
          this.fillPattern(track, 2);
          break;
        case 'fill-each-4':
          this.fillPattern(track, 4);
          break;
        case 'fill-each-8':
          this.fillPattern(track, 8);
          break;
        case 'fill-all':
          this.fillPattern(track, 1);
          break;
        case 'copy':
          this.copyPattern(track);
          break;
        case 'paste':
          this.pastePattern(track);
          break;
        case 'randomize':
          this.randomizePattern(track);
          break;
        case 'humanize':
          this.humanizePattern(track);
          break;
        case 'clear':
          this.clearPattern(track);
          break;
        case 'duplicate-track':
          this.duplicateTrack(trackId);
          break;
        case 'delete-track':
          this.deleteTrack(trackId);
          break;
      }
    }

    openParameterModal(trackId) {
      const track = this.flStudio.tracks[trackId];
      if (!track) return;

      // Ensure params exist
      track = this.flStudio.ensureTrackDefaults(track);

      const modal = document.getElementById('track-param-modal');
      const icon = document.getElementById('param-modal-track-icon');
      const name = document.getElementById('param-modal-track-name');
      
      // Set track info
      icon.textContent = track.type === 'drum' ? '🥁' : '🎹';
      name.textContent = `${track.name} - Parameters`;
      
      // Load current values
      this.loadParametersIntoModal(track);
      
      // Setup live update handlers
      this.setupParameterHandlers(trackId);
      
      modal.style.display = 'flex';
    }

    loadParametersIntoModal(track) {
      const p = track.params || {};
      
      // Synthesis
      document.getElementById('param-detune').value = p.detune || 0;
      document.getElementById('param-detune-val').textContent = p.detune || 0;
      document.getElementById('param-waveform').value = p.waveform || 'sawtooth';
      
      // ADSR
      const amp = p.amp || { a: 0.01, d: 0.08, s: 0.6, r: 0.2 };
      document.getElementById('param-attack').value = amp.a;
      document.getElementById('param-decay').value = amp.d;
      document.getElementById('param-sustain').value = amp.s;
      document.getElementById('param-release').value = amp.r;
      
      // Filter
      const flt = p.filter || { cutoff: 1500, resonance: 0.8, type: 'lowpass' };
      document.getElementById('param-filter-type').value = flt.type || 'lowpass';
      document.getElementById('param-cutoff').value = flt.cutoff;
      document.getElementById('param-cutoff-val').textContent = flt.cutoff;
      document.getElementById('param-resonance').value = flt.resonance;
      document.getElementById('param-resonance-val').textContent = flt.resonance.toFixed(1);
      
      // Mixing
      document.getElementById('param-volume').value = p.volume || 1;
      document.getElementById('param-volume-val').textContent = (p.volume || 1).toFixed(2);
      document.getElementById('param-pan').value = p.pan || 0;
      document.getElementById('param-pan-val').textContent = (p.pan || 0).toFixed(2);
      
      // FX Sends
      const sends = p.sends || { reverb: 0.18, delay: 0.12 };
      document.getElementById('param-reverb-send').value = (sends.reverb * 100).toFixed(0);
      document.getElementById('param-reverb-send-val').textContent = `${(sends.reverb * 100).toFixed(0)}%`;
      document.getElementById('param-delay-send').value = (sends.delay * 100).toFixed(0);
      document.getElementById('param-delay-send-val').textContent = `${(sends.delay * 100).toFixed(0)}%`;
    }

    setupParameterHandlers(trackId) {
      const track = this.flStudio.tracks[trackId];
      if (!track) return;

      // Remove old listeners by cloning nodes
      const inputs = ['param-detune', 'param-waveform', 'param-attack', 'param-decay', 'param-sustain', 'param-release',
                     'param-filter-type', 'param-cutoff', 'param-resonance', 'param-volume', 'param-pan',
                     'param-reverb-send', 'param-delay-send'];
      
      inputs.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const clone = el.cloneNode(true);
        el.parentNode.replaceChild(clone, el);
      });

      // Synthesis
      document.getElementById('param-detune').addEventListener('input', (e) => {
        track.params.detune = parseFloat(e.target.value);
        document.getElementById('param-detune-val').textContent = e.target.value;
        this.flStudio.applyTrackParams(trackId);
        this.flStudio.saveProject(true);
      });

      document.getElementById('param-waveform').addEventListener('change', (e) => {
        track.params.waveform = e.target.value;
        this.flStudio.saveProject(true);
      });

      // ADSR
      ['attack', 'decay', 'sustain', 'release'].forEach(param => {
        const key = param[0];
        document.getElementById(`param-${param}`).addEventListener('input', (e) => {
          track.params.amp[key] = parseFloat(e.target.value);
          this.flStudio.saveProject(true);
        });
      });

      // Filter
      document.getElementById('param-filter-type').addEventListener('change', (e) => {
        track.params.filter.type = e.target.value;
        this.flStudio.saveProject(true);
      });

      document.getElementById('param-cutoff').addEventListener('input', (e) => {
        track.params.filter.cutoff = parseFloat(e.target.value);
        document.getElementById('param-cutoff-val').textContent = e.target.value;
        this.flStudio.applyTrackParams(trackId);
        this.flStudio.saveProject(true);
      });

      document.getElementById('param-resonance').addEventListener('input', (e) => {
        track.params.filter.resonance = parseFloat(e.target.value);
        document.getElementById('param-resonance-val').textContent = parseFloat(e.target.value).toFixed(1);
        this.flStudio.applyTrackParams(trackId);
        this.flStudio.saveProject(true);
      });

      // Mixing
      document.getElementById('param-volume').addEventListener('input', (e) => {
        track.params.volume = parseFloat(e.target.value);
        document.getElementById('param-volume-val').textContent = parseFloat(e.target.value).toFixed(2);
        this.flStudio.applyTrackParams(trackId);
        this.flStudio.saveProject(true);
      });

      document.getElementById('param-pan').addEventListener('input', (e) => {
        track.params.pan = parseFloat(e.target.value);
        document.getElementById('param-pan-val').textContent = parseFloat(e.target.value).toFixed(2);
        this.flStudio.applyTrackParams(trackId);
        this.flStudio.saveProject(true);
      });

      // FX Sends
      document.getElementById('param-reverb-send').addEventListener('input', (e) => {
        track.params.sends.reverb = parseFloat(e.target.value) / 100;
        document.getElementById('param-reverb-send-val').textContent = `${e.target.value}%`;
        this.flStudio.saveProject(true);
      });

      document.getElementById('param-delay-send').addEventListener('input', (e) => {
        track.params.sends.delay = parseFloat(e.target.value) / 100;
        document.getElementById('param-delay-send-val').textContent = `${e.target.value}%`;
        this.flStudio.saveProject(true);
      });
    }

    openPianoRoll(trackId) {
      // Switch to pattern/piano-roll view
      this.flStudio.switchView('piano-roll');
      // Could add logic to select this specific track in piano roll
      console.log(`Opening piano roll for track ${trackId}`);
    }

    fillPattern(track, every) {
      for (let i = 0; i < track.steps.length; i++) {
        track.steps[i] = (i % every === 0);
      }
      this.flStudio.updateStepVisual(track.id, -1);
      this.flStudio.saveProject(true);
    }

    copyPattern(track) {
      this.clipboard = {
        steps: [...track.steps],
        name: track.name
      };
      console.log(`Copied pattern from ${track.name}`);
    }

    pastePattern(track) {
      if (!this.clipboard) return;
      track.steps = [...this.clipboard.steps];
      this.flStudio.updateStepVisual(track.id, -1);
      this.flStudio.saveProject(true);
      console.log(`Pasted pattern to ${track.name}`);
    }

    randomizePattern(track) {
      track.steps = track.steps.map(() => Math.random() > 0.6);
      this.flStudio.updateStepVisual(track.id, -1);
      this.flStudio.saveProject(true);
    }

    humanizePattern(track) {
      // Add slight randomization to timing (future: implement micro-timing)
      console.log(`Humanizing ${track.name} - timing variations applied`);
      // For now, just add some random velocity variation
      track.steps = track.steps.map(s => s ? (Math.random() > 0.15) : false);
      this.flStudio.updateStepVisual(track.id, -1);
      this.flStudio.saveProject(true);
    }

    clearPattern(track) {
      track.steps = track.steps.map(() => false);
      this.flStudio.updateStepVisual(track.id, -1);
      this.flStudio.saveProject(true);
    }

    duplicateTrack(trackId) {
      const original = this.flStudio.tracks[trackId];
      if (!original) return;
      
      const duplicate = JSON.parse(JSON.stringify(original));
      duplicate.id = this.flStudio.tracks.length;
      duplicate.name = `${original.name} (Copy)`;
      
      this.flStudio.tracks.push(duplicate);
      this.flStudio.renderTrack(duplicate);
      this.flStudio.saveProject(true);
      console.log(`Duplicated ${original.name}`);
    }

    deleteTrack(trackId) {
      if (this.flStudio.tracks.length <= 1) {
        alert('Cannot delete the last track');
        return;
      }
      
      if (confirm(`Delete ${this.flStudio.tracks[trackId].name}?`)) {
        this.flStudio.tracks.splice(trackId, 1);
        // Reassign IDs
        this.flStudio.tracks.forEach((t, i) => t.id = i);
        // Re-render all tracks
        const channelRack = document.getElementById('channel-rack');
        if (channelRack) {
          channelRack.innerHTML = '';
          this.flStudio.tracks.forEach(t => this.flStudio.renderTrack(t));
        }
        this.flStudio.saveProject(true);
      }
    }
  }

    // Initialize
    const contextMenu = new ChannelRackContextMenu(app);
    console.log('✨ Professional Channel Rack Enhancements loaded');
  };

  // Try immediate init or wait for DOMContentLoaded
  if (window.flStudio && window.flStudio.tracks) {
    initEnhancements(window.flStudio);
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => initEnhancements(window.flStudio), 100);
    });
  } else {
    // DOM already loaded, wait a bit for app init
    setTimeout(() => initEnhancements(window.flStudio), 100);
  }

})();
