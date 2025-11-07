/* ================== ULTRA PREMIUM VOCAL STUDIO (WebAudio, no deps) ================== */
(function(){
'use strict';

/* ------------------------------- Utilities ------------------------------- */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const NOTE_INDEX = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const SCALE = {
  major:[0,2,4,5,7,9,11],
  minor:[0,2,3,5,7,8,10],
  pentatonic:[0,3,5,7,10],
  blues:[0,3,5,6,7,10],
  chromatic:[0,1,2,3,4,5,6,7,8,9,10,11],
};
function keyToSemitone(k){ return NOTE_INDEX.indexOf(k.toUpperCase()); }
function nearestScaleFreq(f, key="C", scale="minor"){
  if(!f || !isFinite(f) || f<=0) return null;
  const k = keyToSemitone(key); if(k<0) return null;
  const scaleSet = new Set(SCALE[scale]||SCALE.minor);
  // convert to midi, snap to nearest allowed pitch class
  const midi = 69 + 12*Math.log2(f/440);
  let bestMidi = Math.round(midi);
  let bestDist = 1e9;
  for(let m = Math.floor(midi)-24; m<=Math.ceil(midi)+24; m++){
    const pc = ((m%12)+12)%12;
    if(scaleSet.has((pc - k + 12)%12)){
      const d = Math.abs(m - midi);
      if(d < bestDist){ bestDist=d; bestMidi=m; }
    }
  }
  return 440 * Math.pow(2,(bestMidi-69)/12);
}
function yinPitch(buf, sampleRate){
  // YIN (light): returns Hz or null
  const threshold = 0.12;
  const bufSize = buf.length;
  const maxTau = Math.min(1024, bufSize-1);
  const d = new Float32Array(maxTau);
  let tau, j;
  // difference function
  for(tau=1; tau<maxTau; tau++){
    let sum=0;
    for(j=0; j<maxTau; j++){
      const delta = buf[j] - buf[j+tau];
      sum += delta*delta;
    }
    d[tau] = sum;
  }
  // cumulative mean normalized difference
  let cmndf = new Float32Array(maxTau);
  cmndf[0]=1; let runningSum=0;
  for(tau=1; tau<maxTau; tau++){
    runningSum += d[tau];
    cmndf[tau] = d[tau] * tau / (runningSum || 1);
  }
  // absolute threshold
  let tauEstimate=-1;
  for(tau=2; tau<maxTau; tau++){
    if(cmndf[tau] < threshold){
      while(tau+1<maxTau && cmndf[tau+1] < cmndf[tau]) tau++;
      tauEstimate = tau;
      break;
    }
  }
  if(tauEstimate===-1) return null;
  // parabolic interpolation for better precision
  const x0 = (tauEstimate<1)? tauEstimate : tauEstimate-1;
  const x2 = (tauEstimate+1<maxTau)? tauEstimate+1 : tauEstimate;
  const s0 = cmndf[x0], s1 = cmndf[tauEstimate], s2 = cmndf[x2];
  const better = tauEstimate + 0.5*(s0 - s2)/(s0 - 2*s1 + s2 || 1);
  return sampleRate / better;
}

/* ------------------- Pitch-Shift Worklet (Granular, mono->stereo) ------------------- */
async function loadPitchWorklet(ctx){
  if(!ctx.audioWorklet) return null;
  const code = `
  class GranularPitchShiftProcessor extends AudioWorkletProcessor {
    constructor(){
      super();
      const N = Math.max(1, Math.floor(sampleRate*2)); // 2s ring buffer
      this.buf = new Float32Array(N);
      this.N=N; this.w=0; this.rA=0; this.rB=1024;
      this.grain = 2048; // ~43ms @48k
      this.ratio = 1.0;
      this.port.onmessage = (e)=>{ if(e.data && typeof e.data.ratio==='number'){
        const r=e.data.ratio; this.ratio = Math.min(2.5, Math.max(0.4, r));
      }};
    }
    process(inputs, outputs){
      const input = inputs[0]; const output = outputs[0];
      if(!input || !input[0] || !output) return true;
      const inL = input[0]; const inR = input[1] || input[0];
      const outL = output[0]; const outR = output[1] || output[0];
      const N=this.N; const g=this.grain;
      for(let i=0;i<inL.length;i++){
        // write mono mix into ring
        this.buf[this.w] = 0.5*(inL[i] + (inR[i]||0));
        this.w = (this.w+1)%N;
        // read with 2 grains crossfaded
        const posA = Math.floor(this.rA)%N;
        const posB = Math.floor(this.rB)%N;
        const fracA = this.rA - Math.floor(this.rA);
        const fracB = this.rB - Math.floor(this.rB);
        // linear interp
        const sA = this.buf[posA] + (this.buf[(posA+1)%N]-this.buf[posA])*fracA;
        const sB = this.buf[posB] + (this.buf[(posB+1)%N]-this.buf[posB])*fracB;
        // hann crossfade over grain
        const t = (i % g)/g;
        const wA = 0.5*(1 - Math.cos(2*Math.PI*t));
        const y = sA*wA + sB*(1-wA);
        outL[i]=y; outR[i]=y;
        const step = this.ratio;
        this.rA += step; this.rB += step;
        // keep grains staggered ~g/2
        if((i % g) === 0){ this.rB = this.rA + g/2; }
        // wrap read indices to ring
        if(this.rA>=N) this.rA -= N;
        if(this.rB>=N) this.rB -= N;
      }
      return true;
    }
  }
  registerProcessor('granular-pitch-shift', GranularPitchShiftProcessor);
  `;
  const blob = new Blob([code], {type:'application/javascript'});
  const url = URL.createObjectURL(blob);
  await ctx.audioWorklet.addModule(url);
  URL.revokeObjectURL(url);
  return true;
}

/* --------------------------- Main Class: Vocal Studio --------------------------- */
class VocalStudio {
  constructor(flStudio){
    this.flStudio=flStudio;
    this.ctx=flStudio.audioContext;
    // State
    this.mediaStream=null; this.mediaSrc=null;
    this.isRecording=false; this.recordedBlob=null; this.recChunks=[];
    this.pitchOn=true; this.doubleTrack=true; this.monitorOn=true;
    this.targetKey='C'; this.targetScale='minor';
    this.autotuneStrength=0.8; this.pitchMs=50; this.prevRatio=1.0;
    this.bpm = (this.flStudio && this.flStudio.bpm) ? this.flStudio.bpm : 120;
    // Nodes
    this.inputGain=null; this.hpf=null; this.gateGain=null;
    this.comp=null; this.eqLow=null; this.eqHigh=null;
    this.pitchNode=null;
    this.deEssHP=null; this.deEssComp=null; this.deEssMix=null; this.lowBand=null; this.sumMix=null;
    this.doublerLFO1=null; this.doublerLFO2=null; this.dly1=null; this.dly2=null; this.panL=null; this.panR=null; this.doublerGain=null;
    this.delay=null; this.delayFeedback=null; this.delayMix=null;
    this.reverb=null; this.reverbMix=null;
    this.master=null; this.recDest=null; this.mediaRecorder=null;
    this.analyser=null; this.analyserTime=null;
    // params
    this.reverbMixVal=0.3; this.reverbDecay=2.5; this.reverbPredelayMs=20;
    this.delayBeats=0.25; this.delayFb=0.4; this.delayMixVal=0.25;
    this.warmth=0.5; this.air=0.3;
    this.doublerDepthMs=0.008; this.doublerBaseMsL=0.015; this.doublerBaseMsR=0.022;
    this.gateThresh = 0.02; this.gateHoldMs=180; this._gateBelowSince=0;
    // boot
    this._installStyles();
    this._installUI();
    this._buildChain();
    this._bindUI();
    this._restore();
    this._animMeters();
  }

  _installStyles(){
    if(document.getElementById('vs-premium-css')) return;
    const css=`
    .vocal-studio-btn{position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;
      background:linear-gradient(135deg,#FF0080,#7928CA);border:3px solid #FF0080;color:#fff;font-size:28px;cursor:pointer;
      box-shadow:0 8px 32px rgba(255,0,128,.5);z-index:9999;display:flex;align-items:center;justify-content:center;transition:.25s;animation:pulse 2s infinite}
    .vocal-studio-btn:hover{transform:scale(1.08)}
    @keyframes pulse{0%,100%{box-shadow:0 8px 32px rgba(255,0,128,.5)}50%{box-shadow:0 8px 48px rgba(255,0,128,.8)}}
    .vocal-studio-overlay{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px);z-index:10001;display:none;align-items:center;justify-content:center}
    .vocal-studio-overlay.active{display:flex}
    .vocal-studio-window{background:linear-gradient(180deg,#1a1a1a,#0d0d0d);border:2px solid #FF0080;border-radius:24px;width:900px;max-width:95%;height:700px;max-height:90vh;box-shadow:0 24px 80px rgba(255,0,128,.6);display:flex;flex-direction:column;overflow:hidden}
    .vocal-studio-header{background:linear-gradient(135deg,#FF0080 0%,#7928CA 50%,#4F46E5 100%);padding:20px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #FF0080}
    .vocal-studio-title{display:flex;align-items:center;gap:12px;color:#fff;font-size:20px;font-weight:700;text-transform:uppercase;letter-spacing:2px}
    .vocal-studio-close{background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.4);color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:24px;display:flex;align-items:center;justify-content:center;transition:.2s}
    .vocal-studio-close:hover{transform:rotate(90deg) scale(1.1)}
    .vocal-studio-content{flex:1;overflow:auto;padding:24px;display:flex;flex-direction:column;gap:20px}
    .vocal-waveform{background:#0a0a0a;border:2px solid #FF0080;border-radius:16px;height:150px;position:relative;overflow:hidden}
    .vocal-waveform canvas{width:100%;height:100%}
    .vocal-controls-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
    .vocal-section{background:rgba(255,0,128,.05);border:1px solid rgba(255,0,128,.3);border-radius:12px;padding:16px}
    .vocal-section-title{font-size:13px;font-weight:700;color:#FF0080;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;display:flex;align-items:center;gap:8px}
    .vocal-control{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
    .vocal-label{font-size:11px;color:#aaa;font-weight:600;text-transform:uppercase;letter-spacing:.5px;display:flex;justify-content:space-between;align-items:center}
    .vocal-value{color:#FF0080;font-weight:700;font-size:12px}
    .vocal-slider{width:100%;height:6px;appearance:none;background:linear-gradient(90deg,#2a2a2a,#3a3a3a);border-radius:3px}
    .vocal-slider::-webkit-slider-thumb{appearance:none;width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#FF0080,#7928CA);box-shadow:0 2px 8px rgba(255,0,128,.6);transition:.15s}
    .vocal-select{width:100%;background:#1a1a1a;border:2px solid #FF0080;color:#fff;padding:10px;border-radius:8px;font-size:13px;font-weight:600}
    .vocal-toggle{position:relative;width:70px;height:34px;background:#2a2a2a;border-radius:17px;cursor:pointer;border:2px solid #555}
    .vocal-toggle.active{background:linear-gradient(135deg,#FF0080,#7928CA);border-color:#FF0080}
    .vocal-toggle::after{content:'';position:absolute;top:3px;left:3px;width:24px;height:24px;background:#fff;border-radius:50%;transition:.3s}
    .vocal-toggle.active::after{left:39px}
    .vocal-record-btn{background:linear-gradient(135deg,#FF0080,#FF0040);border:3px solid #FF0080;color:#fff;padding:20px 40px;border-radius:50px;font-size:18px;font-weight:700;text-transform:uppercase;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;margin:20px auto;min-width:250px}
    .vocal-record-btn.recording{animation:recPulse 1s infinite}
    @keyframes recPulse{0%,100%{box-shadow:0 8px 24px rgba(255,0,0,.5)}50%{box-shadow:0 12px 40px rgba(255,0,0,.9)}}
    .vocal-meter{height:8px;background:#1a1a1a;border-radius:4px;overflow:hidden}
    .vocal-meter-fill{height:100%;background:linear-gradient(90deg,#0f0,#ff0,#f00);width:0%}
    .vocal-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px}
    .vocal-preset-btn{background:rgba(255,0,128,.1);border:2px solid rgba(255,0,128,.3);color:#fff;padding:12px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;text-align:center}
    .vocal-preset-btn.active,.vocal-preset-btn:hover{background:linear-gradient(135deg,#FF0080,#7928CA);border-color:#FF0080}
    .vocal-playback-controls{display:flex;gap:12px;justify-content:center;align-items:center}
    .vocal-playback-btn{background:rgba(255,0,128,.2);border:2px solid #FF0080;color:#fff;width:50px;height:50px;border-radius:50%;font-size:20px;display:flex;align-items:center;justify-content:center}
    .vocal-download-btn{background:linear-gradient(135deg,#4F46E5,#7928CA);border:2px solid #4F46E5;color:#fff;padding:12px 24px;border-radius:25px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px}
    .vocal-status{background:rgba(255,0,128,.1);border:1px solid rgba(255,0,128,.3);border-radius:8px;padding:12px;text-align:center;font-size:12px;color:#FF0080;font-weight:600}
    `;
    const s=document.createElement('style'); s.id='vs-premium-css'; s.textContent=css; document.head.appendChild(s);
  }

  _installUI(){
    // Floating button
    const btn=document.createElement('button');
    btn.className='vocal-studio-btn'; btn.id='vocal-studio-floating-btn'; btn.textContent='🎤';
    btn.title='Open Vocal Studio';
    document.body.appendChild(btn);

    // Overlay + window
    const ov=document.createElement('div'); ov.className='vocal-studio-overlay'; ov.id='vocal-studio-overlay';
    ov.innerHTML=`
      <div class="vocal-studio-window" onclick="event.stopPropagation()">
        <div class="vocal-studio-header">
          <div class="vocal-studio-title"><span>🎤</span><span>Vocal Studio Pro</span></div>
          <button class="vocal-studio-close" id="vocal-studio-close">×</button>
        </div>
        <div class="vocal-studio-content">
          <div class="vocal-waveform"><canvas id="vs-wave" width="800" height="150"></canvas></div>
          <button class="vocal-record-btn" id="vs-rec"><span class="vocal-record-icon">⏺</span><span id="vs-rec-text">Start Recording</span><span class="vocal-record-time" id="vs-rec-time">00:00</span></button>
          <div class="vocal-control"><div class="vocal-label">Input Level</div><div class="vocal-meter"><div class="vocal-meter-fill" id="vs-meter"></div></div></div>
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
              <div class="vocal-control"><div class="vocal-label">Key</div><select class="vocal-select" id="vs-key">${NOTE_INDEX.map(n=>`<option>${n}</option>`).join('')}</select></div>
              <div class="vocal-control"><div class="vocal-label">Scale</div>
                <select class="vocal-select" id="vs-scale">
                  <option value="minor" selected>Minor (Trap)</option><option value="major">Major</option>
                  <option value="pentatonic">Pentatonic</option><option value="blues">Blues</option><option value="chromatic">Chromatic</option>
                </select>
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
                  <option value="0.125">1/8</option><option value="0.1875">1/8 Dotted</option>
                  <option value="0.25" selected>1/4</option><option value="0.375">1/4 Dotted</option><option value="0.5">1/2</option>
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
    ov.addEventListener('click', (e)=>{ if(e.target===ov) this.close(); });
    document.body.appendChild(ov);
  }

  _buildChain(){
    const ctx=this.ctx;
    // core
    this.inputGain=ctx.createGain(); this.inputGain.gain.value=1.0;
    this.hpf=ctx.createBiquadFilter(); this.hpf.type='highpass'; this.hpf.frequency.value=80;
    this.gateGain=ctx.createGain(); this.gateGain.gain.value=1.0;
    this.comp=ctx.createDynamicsCompressor(); Object.assign(this.comp, {
      threshold:{value:-20}, knee:{value:30}, ratio:{value:3}, attack:{value:0.005}, release:{value:0.12}
    });
    // EQ
    this.eqLow=ctx.createBiquadFilter(); this.eqLow.type='lowshelf'; this.eqLow.frequency.value=200; this.eqLow.gain.value=0;
    this.eqHigh=ctx.createBiquadFilter(); this.eqHigh.type='highshelf'; this.eqHigh.frequency.value=8000; this.eqHigh.gain.value=0;

    // De-esser split
    this.lowBand=ctx.createBiquadFilter(); this.lowBand.type='lowpass'; this.lowBand.frequency.value=6000;
    this.deEssHP=ctx.createBiquadFilter(); this.deEssHP.type='highpass'; this.deEssHP.frequency.value=5000;
    this.deEssComp=ctx.createDynamicsCompressor(); this.deEssComp.threshold.value=-30; this.deEssComp.ratio.value=12; this.deEssComp.attack.value=0.001; this.deEssComp.release.value=0.08;
    this.deEssMix=ctx.createGain(); this.deEssMix.gain.value=1.0; // just a summer

    // Doubler (stereo chorus)
    this.doublerGain=ctx.createGain(); this.doublerGain.gain.value=0.22; // controlled by toggle
    this.dly1=ctx.createDelay(0.05); this.dly1.delayTime.value=this.doublerBaseMsL;
    this.dly2=ctx.createDelay(0.05); this.dly2.delayTime.value=this.doublerBaseMsR;
    this.panL=ctx.createStereoPanner(); this.panL.pan.value=-0.35;
    this.panR=ctx.createStereoPanner(); this.panR.pan.value=0.35;
    this.doublerLFO1=ctx.createOscillator(); this.doublerLFO2=ctx.createOscillator();
    const lfoGain1=ctx.createGain(); lfoGain1.gain.value=this.doublerDepthMs; // seconds
    const lfoGain2=ctx.createGain(); lfoGain2.gain.value=this.doublerDepthMs;
    this.doublerLFO1.frequency.value=0.2; this.doublerLFO2.frequency.value=0.23;
    this.doublerLFO1.connect(lfoGain1).connect(this.dly1.delayTime);
    this.doublerLFO2.connect(lfoGain2).connect(this.dly2.delayTime);
    this.doublerLFO1.start(); this.doublerLFO2.start();

    // Pitch shifter worklet (before time-FX)
    this.pitchNode=null; // load on open()

    // Delay (tempo-sync)
    this.delay=ctx.createDelay(2.0);
    this.delayFeedback=ctx.createGain(); this.delayFeedback.gain.value=this.delayFb;
    this.delayMix=ctx.createGain(); this.delayMix.gain.value=this.delayMixVal;

    this.delay.connect(this.delayFeedback).connect(this.delay);
    // Reverb
    this.reverb=ctx.createConvolver(); this._buildReverbImpulse();
    this.reverbMix=ctx.createGain(); this.reverbMix.gain.value=this.reverbMixVal;

    // Master + record bus
    this.master=ctx.createGain(); this.master.gain.value=1.0;
    this.recDest=ctx.createMediaStreamDestination();

    // Analysers
    this.analyser=ctx.createAnalyser(); this.analyser.fftSize=512;
    this.analyserTime=ctx.createAnalyser(); this.analyserTime.fftSize=2048;

    // wire static graph (dynamic parts connect in open())
    // mic -> inputGain -> HPF -> gate -> comp -> eqLow -> eqHigh -> [split de-esser] -> pitchNode -> (dry core)
    // After pitch: core -> master
    // Parallel FX: core-> delay -> delayMix -> master; core-> reverb -> reverbMix -> master; core-> doubler -> master
    // For meters: tap after comp for input meter; after master for wave draw

    // placeholders until open() connects mic + pitch node
    this.coreTap = ctx.createGain(); // central post-pitch node
    this.coreTap.gain.value=1.0;

    // Split to de-esser then into coreTap
    const deEssSum = ctx.createGain(); deEssSum.gain.value=1.0; this._deEssSum = deEssSum;

    // Chain A (low band)
    this.lowBand.connect(deEssSum);
    // Chain B (high band -> heavy comp)
    this.deEssHP.connect(this.deEssComp).connect(deEssSum);

    // Time FX / Doubler
    this.coreTap.connect(this.delay);
    this.coreTap.connect(this.reverb);
    this.coreTap.connect(this.dly1); this.coreTap.connect(this.dly2);
    this.dly1.connect(this.panL).connect(this.doublerGain);
    this.dly2.connect(this.panR).connect(this.doublerGain);

    // Mixers -> master
    this.delay.connect(this.delayMix).connect(this.master);
    this.reverb.connect(this.reverbMix).connect(this.master);
    this.doublerGain.connect(this.master);

    // Dry core to master
    this.coreTap.connect(this.master);

    // Meters + outputs
    this.master.connect(this.ctx.destination);
    this.master.connect(this.recDest);
    this.master.connect(this.analyserTime);
  }

  async _ensurePitchNode(){
    if(this.pitchNode || !this.ctx.audioWorklet) return true;
    await loadPitchWorklet(this.ctx);
    this.pitchNode = new AudioWorkletNode(this.ctx, 'granular-pitch-shift', {numberOfInputs:1, numberOfOutputs:1, outputChannelCount:[2]});
    return true;
  }

  _bindUI(){
    const $=id=>document.getElementById(id);
    // Open/Close
    $('vocal-studio-floating-btn').addEventListener('click',()=>{
      console.log('🎤 Button clicked!');
      try{
        this.open();
      }catch(e){
        console.error('❌ Error opening vocal studio:', e);
        alert('Error opening Vocal Studio: ' + e.message);
      }
    });
    $('vocal-studio-close').addEventListener('click',()=>this.close());
    // Record
    $('vs-rec').addEventListener('click',()=>this.toggleRec());
    $('vs-play').addEventListener('click',()=>this.play());
    $('vs-stop').addEventListener('click',()=>this.stopPlay());
    $('vs-dl').addEventListener('click',()=>this.download());

    // Toggles
    this._toggle('vs-autotune',(on)=>{ this.pitchOn=on; this._status(`Autotune ${on?'ON':'OFF'}`); });
    this._toggle('vs-double',(on)=>{ this.doubleTrack=on; this.doublerGain.gain.value= on? 0.22 : 0.0; });
    this._toggle('vs-deess',(on)=>{ this.deEssOn = on; /* done in routing open(); */ });
    this._toggle('vs-monitor',(on)=>{ this.monitorOn=on; this.master.disconnect(); if(on){ this.master.connect(this.ctx.destination); } this.master.connect(this.recDest); this.master.connect(this.analyserTime); });

    // Sliders
    this._slider('vs-strength','vs-strength-val',v=>{ this.autotuneStrength=v/100; },'%');
    this._slider('vs-speed','vs-speed-val',v=>{ this.pitchMs=v; },'');
    this._slider('vs-rmix','vs-rmix-val',v=>{ this.reverbMix.gain.value=v/100; this.reverbMixVal=v/100; },'%');
    this._slider('vs-rdecay','vs-rdecay-val',v=>{ this.reverbDecay=v; this._buildReverbImpulse(); },'s');
    this._slider('vs-rpre','vs-rpre-val',v=>{ this.reverbPredelayMs=v; this._buildReverbImpulse(); },'ms');
    this._slider('vs-dmix','vs-dmix-val',v=>{ this.delayMix.gain.value=v/100; this.delayMixVal=v/100; },'%');
    this._slider('vs-dfb','vs-dfb-val',v=>{ this.delayFeedback.gain.value=v/100; this.delayFb=v/100; },'%');
    this._slider('vs-gate','vs-gate-val',v=>{ this.gateThresh = v/100; },'%');
    this._slider('vs-hpf','vs-hpf-val',v=>{ this.hpf.frequency.value=v; },'');
    this._slider('vs-warm','vs-warm-val',v=>{ this.eqLow.gain.value = (v/100)*6; this.warmth=v/100; },'%');
    this._slider('vs-air','vs-air-val',v=>{ this.eqHigh.gain.value = (v/100)*6; this.air=v/100; },'%');

    // Key/Scale
    $('vs-key').addEventListener('change',(e)=>{ this.targetKey=e.target.value; this._status(`Key: ${this.targetKey}`); });
    $('vs-scale').addEventListener('change',(e)=>{ this.targetScale=e.target.value; this._status(`Scale: ${this.targetScale}`); });

    // Delay time (tempo sync)
    $('vs-dtime').addEventListener('change',(e)=>{
      const txt = e.target.options[e.target.selectedIndex].text; $('vs-dtime-label').textContent = txt;
      this.delayBeats = parseFloat(e.target.value);
      this._applyDelayTime();
    });

    // Presets
    const presets = [
      ['trap-auto',{strength:80,speed:50,rmix:30,rdec:2.5,rpre:20,dmix:25,dfb:40,warm:50,air:30,double:1,deess:1}],
      ['hard-tune',{strength:100,speed:1,rmix:20,rdec:1.5,rpre:10,dmix:15,dfb:30,warm:40,air:50,double:1,deess:1}],
      ['melodic',{strength:60,speed:100,rmix:45,rdec:3.5,rpre:25,dmix:35,dfb:50,warm:60,air:40,double:1,deess:0}],
      ['dark',{strength:70,speed:30,rmix:50,rdec:4.0,rpre:28,dmix:30,dfb:60,warm:70,air:20,double:1,deess:1}],
      ['spacey',{strength:50,speed:150,rmix:60,rdec:6.0,rpre:40,dmix:45,dfb:70,warm:30,air:60,double:1,deess:0}],
      ['clean',{strength:30,speed:80,rmix:15,rdec:1.0,rpre:5,dmix:10,dfb:20,warm:40,air:35,double:0,deess:0}],
    ];
    const presetHost=document.getElementById('vs-presets');
    presets.forEach(([name,vals],idx)=>{
      const b=document.createElement('button');
      b.className='vocal-preset-btn'+(idx===0?' active':''); b.dataset.preset=name; b.textContent=name.replace('-', ' ').toUpperCase();
      b.addEventListener('click',()=>{
        presetHost.querySelectorAll('.vocal-preset-btn').forEach(x=>x.classList.remove('active'));
        b.classList.add('active'); this._applyPreset(vals);
      });
      presetHost.appendChild(b);
    });
  }

  async open(){
    console.log('🎤 Opening vocal studio...', {ctx: !!this.ctx, overlay: !!document.getElementById('vocal-studio-overlay')});
    const overlay = document.getElementById('vocal-studio-overlay');
    if(!overlay){
      console.error('❌ Overlay not found!');
      alert('Vocal Studio UI not loaded properly. Please refresh the page.');
      return;
    }
    overlay.classList.add('active');
    
    if(!this.ctx){
      console.error('❌ Audio context not available!');
      alert('Audio context not ready. Please refresh the page.');
      return;
    }
    
    console.log('🎤 Resuming audio context...');
    await this.ctx.resume();
    console.log('🎤 Audio context state:', this.ctx.state);
    
    try{
      // Get mic (disable OS DSP; we'll process ourselves)
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false, channelCount:1 }
      });
      this.mediaSrc = this.ctx.createMediaStreamSource(this.mediaStream);
      // Ensure pitch node
      await this._ensurePitchNode();

      // Connect: Mic -> inputGain -> HPF -> gateGain -> comp -> eqLow -> eqHigh -> [split bands] -> (deEss mix) -> pitchNode -> coreTap
      this.mediaSrc.connect(this.inputGain);
      this.inputGain.connect(this.hpf);
      this.hpf.connect(this.gateGain);

      // meter before comp
      const meterTap=this.ctx.createGain(); meterTap.gain.value=1.0;
      this.gateGain.connect(meterTap).connect(this.analyser);

      this.gateGain.connect(this.comp);
      this.comp.connect(this.eqLow);
      this.eqLow.connect(this.eqHigh);

      // Split to bands
      this.eqHigh.connect(this.lowBand);
      this.eqHigh.connect(this.deEssHP);

      // Sum bands
      this._deEssSum.disconnect(); // safety
      this._deEssSum = this.ctx.createGain();
      this.lowBand.connect(this._deEssSum);
      this.deEssHP.connect(this.deEssComp).connect(this._deEssSum);

      // Pitch correction (or bypass)
      if(this.pitchNode){
        this._deEssSum.connect(this.pitchNode).connect(this.coreTap);
      }else{
        this._deEssSum.connect(this.coreTap);
      }

      // processed recorder
      this.mediaRecorder = new MediaRecorder(this.recDest.stream);

      // start detectors
      this._status('🎙 Microphone connected.'); 
      this._pitchLoop(); // continuous
      this._applyDelayTime();
    }catch(err){
      this._status('❌ Mic error: '+err.message);
      console.error(err);
    }
  }

  close(){
    document.getElementById('vocal-studio-overlay').classList.remove('active');
    if(this.isRecording) this._stopRec();
    if(this.mediaStream){ this.mediaStream.getTracks().forEach(t=>t.stop()); this.mediaStream=null; }
  }

  /* -------------------------- Recording / Playback -------------------------- */
  toggleRec(){ this.isRecording ? this._stopRec() : this._startRec(); }
  _startRec(){
    if(!this.mediaRecorder){ this._status('❌ Not ready'); return; }
    this.recChunks=[]; this.mediaRecorder.ondataavailable=e=>{ if(e.data.size>0) this.recChunks.push(e.data); };
    this.mediaRecorder.onstop=()=>{
      this.recordedBlob=new Blob(this.recChunks,{type:'audio/webm'});
      document.getElementById('vs-playback').style.display='flex';
      this._status('✅ Recorded. Press ▶ to listen.');
    };
    this.mediaRecorder.start();
    this.isRecording=true;
    const btn=document.getElementById('vs-rec');
    btn.classList.add('recording');
    document.getElementById('vs-rec-text').textContent='Recording...';
    btn.querySelector('.vocal-record-icon').textContent='⏹';
    this._recClockStart=Date.now(); this._tickRecClock();
  }
  _stopRec(){
    if(this.mediaRecorder && this.isRecording){ this.mediaRecorder.stop(); }
    this.isRecording=false;
    const btn=document.getElementById('vs-rec');
    btn.classList.remove('recording');
    document.getElementById('vs-rec-text').textContent='Start Recording';
    btn.querySelector('.vocal-record-icon').textContent='⏺';
  }
  _tickRecClock(){
    if(!this.isRecording) return;
    const s=Math.floor((Date.now()-this._recClockStart)/1000);
    const mm=String(Math.floor(s/60)).padStart(2,'0'); const ss=String(s%60).padStart(2,'0');
    document.getElementById('vs-rec-time').textContent=`${mm}:${ss}`;
    setTimeout(()=>this._tickRecClock(), 500);
  }
  play(){
    if(!this.recordedBlob) return;
    const url=URL.createObjectURL(this.recordedBlob);
    if(this._player) { this._player.pause(); this._player=null; }
    this._player=new Audio(url); this._player.onended=()=>URL.revokeObjectURL(url);
    this._player.play(); this._status('▶ Playing...');
  }
  stopPlay(){ if(this._player){ this._player.pause(); this._player=null; this._status('⏹ Stopped'); } }
  download(){
    if(!this.recordedBlob) return;
    const a=document.createElement('a'); const url=URL.createObjectURL(this.recordedBlob);
    a.href=url; a.download=`vocal-${Date.now()}.webm`; a.click(); URL.revokeObjectURL(url);
  }

  /* ----------------------------- DSP Helpers ----------------------------- */
  _applyDelayTime(){
    const beats = this.delayBeats; // fraction of whole note
    const seconds = (60/this.bpm) * (4*beats); // whole note = 4 beats
    this.delay.delayTime.value = clamp(seconds, 0.01, 2.0);
  }
  _buildReverbImpulse(){
    const rate=this.ctx.sampleRate;
    const length = Math.floor(rate * this.reverbDecay);
    const buf = this.ctx.createBuffer(2, Math.max(1,length), rate);
    const preSamp = Math.floor(rate * (this.reverbPredelayMs/1000));
    for(let ch=0; ch<2; ch++){
      const d=buf.getChannelData(ch);
      for(let i=0;i<d.length;i++){
        const t = (i<preSamp)? 0 : (i-preSamp);
        const env = Math.pow(1 - (t/Math.max(1,length-preSamp)), 2);
        d[i] = ((Math.random()*2-1) * env);
      }
    }
    this.reverb.buffer=buf;
  }

  async _pitchLoop(){
    if(!this.mediaSrc) return;
    // Analyse after comp (meterTap) would be ideal, we connected analyser earlier
    const timeBuf = new Float32Array(this.analyserTime.fftSize);
    const dt = Math.max(16, Math.min(60, this.pitchMs)); // refresh cadence
    const tick = ()=>{
      // Noise gate (simple RMS gate using analyser)
      const level = this._levelNow();
      const now = performance.now();
      if(level < this.gateThresh){ if(this._gateBelowSince===0) this._gateBelowSince=now;
        if(now - this._gateBelowSince > this.gateHoldMs){ this.gateGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.01); }
      } else { this._gateBelowSince=0; this.gateGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.005); }

      // Pitch detect (post-master, cleaner envelope)
      this.analyserTime.getFloatTimeDomainData(timeBuf);
      const f0 = yinPitch(timeBuf, this.ctx.sampleRate);
      let ratio = 1.0;
      if(this.pitchOn && f0){
        const target = nearestScaleFreq(f0, this.targetKey, this.targetScale) || f0;
        const raw = target / f0;
        // blend towards target by strength
        ratio = lerp(1.0, raw, this.autotuneStrength);
      }
      // smooth over pitchMs
      const alpha = clamp(1 - Math.exp(-dt/(this.pitchMs||50)), 0, 1);
      this.prevRatio = this.prevRatio + alpha*(ratio - this.prevRatio);
      if(this.pitchNode) this.pitchNode.port.postMessage({ratio:this.prevRatio});
      // doubler amount auto-trim with gate
      this.doublerGain.gain.value = (this.doubleTrack? 0.22 : 0.0) * this.gateGain.gain.value;

      setTimeout(tick, dt);
    };
    tick();
  }

  _levelNow(){
    if(!this.analyser) return 0;
    const n=this.analyser.frequencyBinCount;
    const arr = new Uint8Array(n);
    this.analyser.getByteFrequencyData(arr);
    let sum=0; for(let i=0;i<n;i++) sum+=arr[i];
    return sum/(n*255); // 0..1
  }

  _animMeters(){
    const wave=document.getElementById('vs-wave');
    if(!wave) return;
    const ctx2d = wave.getContext('2d');
    const draw = ()=>{
      // waveform
      const td = new Float32Array(this.analyserTime.fftSize);
      this.analyserTime.getFloatTimeDomainData(td);
      ctx2d.fillStyle='#0a0a0a'; ctx2d.fillRect(0,0,wave.width,wave.height);
      ctx2d.strokeStyle='#FF0080'; ctx2d.lineWidth=2; ctx2d.beginPath();
      for(let x=0; x<wave.width; x++){
        const i = Math.floor(x/wave.width * td.length);
        const y = (0.5 - td[i]*0.45) * wave.height;
        if(x===0) ctx2d.moveTo(x,y); else ctx2d.lineTo(x,y);
      }
      ctx2d.stroke();
      // meter
      const lvl = this._levelNow();
      document.getElementById('vs-meter').style.width = Math.round(lvl*100)+'%';
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ------------------------------ UI Helpers ------------------------------ */
  _toggle(id, cb){ const el=document.getElementById(id); el.addEventListener('click',()=>{ el.classList.toggle('active'); cb(el.classList.contains('active')); this._save(); }); }
  _slider(id, vid, cb, unit){ const el=document.getElementById(id), v=document.getElementById(vid);
    el.addEventListener('input',e=>{ const val=parseFloat(e.target.value); v.textContent = (unit==='s'||unit==='ms')? (val+unit) : (Math.round(val)+(unit||'')); cb(val); this._save();});
  }
  _status(msg){ document.getElementById('vs-status').textContent = msg; }
  _applyPreset(p){
    const set= (id,val,txtId,fmt=(x)=>x)=>{ const el=document.getElementById(id); el.value=String(val); document.getElementById(txtId).textContent = fmt(val); el.dispatchEvent(new Event('input')); };
    set('vs-strength', p.strength, 'vs-strength-val', v=>v+'%');
    set('vs-speed', p.speed, 'vs-speed-val', v=>v);
    set('vs-rmix', p.rmix, 'vs-rmix-val', v=>v+'%');
    set('vs-rdecay', p.rdec, 'vs-rdecay-val', v=>v+'s');
    set('vs-rpre', p.rpre, 'vs-rpre-val', v=>v+'ms');
    set('vs-dmix', p.dmix, 'vs-dmix-val', v=>v+'%');
    set('vs-dfb', p.dfb, 'vs-dfb-val', v=>v+'%');
    set('vs-warm', p.warm, 'vs-warm-val', v=>v+'%');
    set('vs-air', p.air, 'vs-air-val', v=>v+'%');
    // toggles
    const dbl=document.getElementById('vs-double'); dbl.classList.toggle('active', !!p.double); this.doubleTrack=!!p.double;
    const de=document.getElementById('vs-deess'); de.classList.toggle('active', !!p.deess); this.deEssOn=!!p.deess;
    this.doublerGain.gain.value = this.doubleTrack? 0.22 : 0.0;
    this._save();
  }

  /* ------------------------------ Persistence ------------------------------ */
  _save(){
    try{
      const s={
        key:this.targetKey, scale:this.targetScale, strength:this.autotuneStrength, speed:this.pitchMs,
        rmix:this.reverbMixVal, rdec:this.reverbDecay, rpre:this.reverbPredelayMs,
        dmix:this.delayMixVal, dfb:this.delayFb, dtime:this.delayBeats,
        warm:this.warmth, air:this.air, gate:this.gateThresh, hpf:this.hpf.frequency.value,
        pitchOn:this.pitchOn, double:this.doubleTrack, deess:this.deEssOn, monitor:this.monitorOn
      };
      localStorage.setItem('vs_premium', JSON.stringify(s));
    }catch(e){}
  }
  _restore(){
    try{
      const raw=localStorage.getItem('vs_premium'); if(!raw) return;
      const s=JSON.parse(raw);
      const setVal=(id,val,txtId,fmt=(x)=>x)=>{ const el=document.getElementById(id); if(el){ el.value=String(fmt?val:val); el.dispatchEvent(new Event('input')); } };
      document.getElementById('vs-key').value = s.key||'C'; this.targetKey=s.key||'C';
      document.getElementById('vs-scale').value = s.scale||'minor'; this.targetScale=s.scale||'minor';
      setVal('vs-strength', Math.round((s.strength??0.8)*100), 'vs-strength-val');
      setVal('vs-speed', s.speed??50, 'vs-speed-val');
      setVal('vs-rmix', Math.round((s.rmix??0.3)*100), 'vs-rmix-val');
      setVal('vs-rdecay', s.rdec??2.5, 'vs-rdecay-val');
      setVal('vs-rpre', s.rpre??20, 'vs-rpre-val');
      setVal('vs-dmix', Math.round((s.dmix??0.25)*100), 'vs-dmix-val');
      setVal('vs-dfb', Math.round((s.dfb??0.4)*100), 'vs-dfb-val');
      document.getElementById('vs-dtime').value = String(s.dtime??0.25);
      document.getElementById('vs-dtime').dispatchEvent(new Event('change'));
      setVal('vs-warm', Math.round((s.warm??0.5)*100), 'vs-warm-val');
      setVal('vs-air', Math.round((s.air??0.3)*100), 'vs-air-val');
      setVal('vs-gate', Math.round((s.gate??0.02)*100), 'vs-gate-val');
      setVal('vs-hpf', s.hpf??80, 'vs-hpf-val');
      const togg=(id,on)=>{ const el=document.getElementById(id); if(on) el.classList.add('active'); else el.classList.remove('active'); };
      togg('vs-autotune', s.pitchOn!==false); this.pitchOn = s.pitchOn!==false;
      togg('vs-double', !!s.double); this.doubleTrack=!!s.double; this.doublerGain.gain.value=this.doubleTrack?0.22:0.0;
      togg('vs-deess', !!s.deess); this.deEssOn=!!s.deess;
      togg('vs-monitor', s.monitor!==false); this.monitorOn = s.monitor!==false;
    }catch(e){}
  }
}

/* ------------------------- Boot when flStudio ready ------------------------- */
function waitAndInit(){
  console.log('🎤 Checking for FL Studio...', {flStudio: !!window.flStudio, ctx: !!(window.flStudio?.audioContext)});
  if(window.flStudio){
    if(!window.flStudio.audioContext){
      console.log('🎤 Creating audio context...');
      // Create audio context if not exists
      try{
        window.flStudio.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('🎤 Audio context created');
      }catch(e){
        console.error('Failed to create audio context:', e);
      }
    }
    if(window.flStudio.audioContext){
      window.vocalStudio = new VocalStudio(window.flStudio);
      console.log('🎤✨ Vocal Studio Pro ready');
      return;
    }
  }
  setTimeout(waitAndInit, 100);
}
document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', waitAndInit) : waitAndInit();

/* ------------------------------ Smoke Tests ------------------------------ */
(function tests(){
  const ok=(c,msg)=>{ if(!c) throw new Error('Test fail: '+msg); };
  setTimeout(()=>{
    ok(!!document.getElementById('vocal-studio-floating-btn'),'button');
    ok(!!document.getElementById('vocal-studio-overlay'),'overlay');
    console.log('%cVocalStudio: UI tests OK','color:#39d353');
  }, 200);
})();
})();
