// Playlist plugin: pattern blocks with drag & drop
(function(){
  if (typeof window === 'undefined' || typeof window.registerFLPlugin !== 'function') return;

  window.registerFLPlugin(function playlistPlugin(app){
    // State
    if (!app.playlist) app.playlist = { clips: [] };

    const tracksContainer = document.getElementById('timeline-tracks');
    const gridOverlay = document.getElementById('timeline-grid');
    const ruler = document.getElementById('time-ruler');

    if (!tracksContainer) return;

    const pxPerBeat = () => app.basePixelsPerBeat * (app.zoomLevel || 1);
    const beatsPerBar = app.beatsPerBar || 4;

    function ensureTrackRows(){
      tracksContainer.innerHTML = '';
      app.tracks.forEach((track) => {
        const el = document.createElement('div');
        el.className = 'timeline-track';
        el.dataset.trackId = String(track.id);
        el.innerHTML = `
          <div class="track-label">${track.name}</div>
          <div class="timeline-grid"></div>
        `;
        const grid = el.querySelector('.timeline-grid');
        grid.addEventListener('dblclick', (e) => {
          const rect = grid.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const beat = Math.max(0, Math.round(x / pxPerBeat()));
          addClip(track.id, beat, beatsPerBar); // default 1 bar
          renderClips();
        });
        tracksContainer.appendChild(el);
      });
    }

    function addClip(trackId, startBeat, lengthBeats){
      const id = 'clip-' + Date.now() + '-' + Math.floor(Math.random()*1000);
      app.playlist.clips.push({ id, trackId, startBeat, lengthBeats, label: 'Pat ' + String(app.currentPattern).padStart(2,'0') });
      app.saveProject?.();
    }

    function renderRuler(totalBars = 16){
      if (!ruler || !app.timelineUtils) return;
      ruler.innerHTML = '';
      const totalBeats = app.timelineUtils.barsToBeats(totalBars, beatsPerBar);
      const ticks = app.timelineUtils.buildRulerTicks({ totalBeats, beatsPerBar });
      ticks.forEach((t) => {
        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = (t.beat * pxPerBeat()) + 'px';
        div.style.top = '0';
        div.style.height = '24px';
        div.style.width = '1px';
        div.style.background = t.isMajor ? 'rgba(255,153,0,0.6)' : 'rgba(255,255,255,0.15)';
        const label = document.createElement('span');
        label.textContent = t.label;
        label.style.position = 'absolute';
        label.style.left = '4px';
        label.style.top = '4px';
        label.style.fontSize = '10px';
        label.style.color = 'var(--fl-text-secondary)';
        if (t.isMajor) ruler.appendChild(label);
        ruler.appendChild(div);
      });
      ruler.style.position = 'relative';
      ruler.style.height = '24px';
    }

    function renderClips(){
      // Clear existing clips in all grids
      document.querySelectorAll('.timeline-track .timeline-grid').forEach((g) => g.innerHTML='');
      app.playlist.clips.forEach((clip) => {
        const row = document.querySelector(`.timeline-track[data-track-id="${clip.trackId}"] .timeline-grid`);
        if (!row) return;
        const div = document.createElement('div');
        div.className = 'timeline-clip';
        div.dataset.clipId = clip.id;
        div.style.left = (clip.startBeat * pxPerBeat()) + 'px';
        div.style.width = (clip.lengthBeats * pxPerBeat()) + 'px';
        div.textContent = clip.label;
        makeDraggable(div, clip);
        row.appendChild(div);
      });
    }

    function makeDraggable(el, clip){
      let dragging = false;
      let startX = 0;
      let startBeat = 0;
      el.addEventListener('mousedown', (e) => {
        dragging = true;
        startX = e.clientX;
        startBeat = clip.startBeat;
        e.preventDefault();
      });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dBeats = Math.round(dx / pxPerBeat());
        const newBeat = Math.max(0, startBeat + dBeats);
        clip.startBeat = newBeat;
        el.style.left = (clip.startBeat * pxPerBeat()) + 'px';
      });
      window.addEventListener('mouseup', () => {
        if (dragging) {
          dragging = false;
          app.saveProject?.();
        }
      });
    }

    function wireView(){
      // Re-render when switching to playlist
      app.on('afterInit', () => {
        ensureTrackRows();
        renderRuler();
        renderClips();
      });
      // Rebuild rows if tracks change (simple hook via populatePlaylist)
      const origPopulate = app.populatePlaylist.bind(app);
      app.populatePlaylist = function(){
        origPopulate();
        ensureTrackRows();
        renderRuler();
        renderClips();
      };
    }

    wireView();
  });
})();
