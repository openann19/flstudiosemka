// Automation Plugin: master filter frequency lane with points and linear interpolation
(function(){
  if (typeof window === 'undefined' || typeof window.registerFLPlugin !== 'function') return;

  function lerp(a,b,t){ return a + (b-a)*t; }

  window.registerFLPlugin(function automationPlugin(app){
    const beatsPerBar = app.beatsPerBar || 4;
    const laneId = 'automation-filter-lane';
    const points = app.automationPoints || [
      { beat: 0, value: 1.0 },
      { beat: beatsPerBar*4, value: 0.3 } // default ramp down over 4 bars
    ];
    app.automationPoints = points;

    function ensureLane(){
      const tracks = document.getElementById('timeline-tracks');
      if (!tracks) return null;
      let lane = document.getElementById(laneId);
      if (!lane){
        lane = document.createElement('div');
        lane.id = laneId;
        lane.className = 'automation-lane';
        lane.innerHTML = '<div class="track-label">Automation: Master Filter</div><div class="timeline-grid" style="position:relative;"></div>';
        tracks.appendChild(lane);
      }
      return lane;
    }

    function pxPerBeat(){ return (app.basePixelsPerBeat||60) * (app.zoomLevel||1); }

    function render(){
      const lane = ensureLane(); if (!lane) return;
      const grid = lane.querySelector('.timeline-grid');
      grid.innerHTML = '';
      points.forEach((p, idx) => {
        const dot = document.createElement('div');
        dot.className = 'automation-point';
        dot.style.left = (p.beat * pxPerBeat()) + 'px';
        dot.style.bottom = (p.value * 30) + 'px';
        dot.title = `Beat ${p.beat.toFixed(2)}: ${(p.value*100|0)}%`;
        makeDraggable(dot, idx);
        grid.appendChild(dot);
      });
      // draw segments
      for (let i=0;i<points.length-1;i++){
        const a = points[i], b = points[i+1];
        const seg = document.createElement('div');
        const x1 = a.beat*pxPerBeat();
        const x2 = b.beat*pxPerBeat();
        seg.className = 'automation-segment';
        seg.style.left = x1 + 'px';
        seg.style.width = Math.max(2, x2-x1) + 'px';
        grid.appendChild(seg);
      }
    }

    function makeDraggable(el, index){
      let dragging = false; let startX=0; let startY=0; let baseBeat=0; let baseVal=0;
      el.addEventListener('mousedown', (e)=>{ dragging=true; startX=e.clientX; startY=e.clientY; baseBeat=points[index].beat; baseVal=points[index].value; e.preventDefault(); });
      window.addEventListener('mousemove', (e)=>{ if (!dragging) return; const dx=e.clientX-startX; const dy=e.clientY-startY; points[index].beat=Math.max(0, baseBeat+Math.round(dx/pxPerBeat())); points[index].value=Math.max(0, Math.min(1, baseVal - dy/120)); render(); app.saveProject?.(); });
      window.addEventListener('mouseup', ()=> dragging=false);
    }

    function valueAtBeat(beat){
      if (points.length===0) return 1.0;
      const sorted = points.slice().sort((a,b)=>a.beat-b.beat);
      if (beat<=sorted[0].beat) return sorted[0].value;
      for (let i=0;i<sorted.length-1;i++){
        const a=sorted[i], b=sorted[i+1];
        if (beat>=a.beat && beat<=b.beat){
          const t=(beat-a.beat)/(b.beat-a.beat||1);
          return lerp(a.value,b.value,t);
        }
      }
      return sorted[sorted.length-1].value;
    }

    // Apply at each tick
    app.on && app.on('tick', ({beats})=>{
      if (!app.audio || !app.audio.masterFilter) return;
      const v = valueAtBeat(beats);
      const minHz=400; const maxHz=15000;
      const hz = minHz + (maxHz-minHz)*v;
      app.audio.masterFilter.frequency.setValueAtTime(hz, app.audioContext.currentTime);
    });

    // Re-render when visiting playlist
    const origPopulate = app.populatePlaylist.bind(app);
    app.populatePlaylist = function(){
      origPopulate();
      ensureLane();
      render();
      const lane = ensureLane();
      const grid = lane && lane.querySelector('.timeline-grid');
      if (grid){
        grid.addEventListener('dblclick', (e)=>{
          const rect = grid.getBoundingClientRect();
          const x = e.clientX - rect.left; const y = rect.bottom - e.clientY;
          const beat = Math.round(x/pxPerBeat());
          const value = Math.max(0, Math.min(1, y/120));
          points.push({ beat, value });
          render();
          app.saveProject?.();
        });
      }
    };
  });
})();
