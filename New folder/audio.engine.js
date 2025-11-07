// Audio Engine Plugin: pro drum synthesis, master filter, reverb, compressor
(function(){
  if (typeof window === 'undefined' || typeof window.registerFLPlugin !== 'function') return;

  function createImpulse(ctx, seconds = 2.2, decay = 2.5){
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch=0; ch<2; ch++){
      const chan = impulse.getChannelData(ch);
      for (let i=0; i<length; i++){
        chan[i] = (Math.random()*2-1) * Math.pow(1 - i/length, decay);
      }
    }
    return impulse;
  }

  function makeEnv(ctx, t0, node, a=0.001, d=0.05, s=0.5, r=0.1, peak=1.0){
    // ADSR on GainNode
    const now = t0;
    const g = node.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(0.0001, now);
    g.linearRampToValueAtTime(peak, now + a);
    g.linearRampToValueAtTime(s*peak, now + a + d);
    g.linearRampToValueAtTime(0.0001, now + a + d + r);
  }

  function makeKickBuffer(ctx){
    const len = ctx.sampleRate * 0.6; // 600ms max
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0; i<len; i++){
      const t = i/ctx.sampleRate;
      const freq = 110 * Math.pow(2, -6*t); // pitch drop
      const phase = 2*Math.PI*freq*t;
      const env = Math.pow(1 - t/0.6, 3);
      data[i] = Math.sin(phase) * env * 0.9;
    }
    return buf;
  }

  function makeNoiseBuffer(ctx, seconds=1){
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i=0;i<len;i++) d[i] = Math.random()*2-1;
    return buf;
  }

  function playBuffer(ctx, buffer, destination, opts={}){
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    src.playbackRate.setValueAtTime(opts.rate||1, ctx.currentTime);
    gain.gain.setValueAtTime(opts.gain||1, ctx.currentTime);
    src.connect(gain);
    gain.connect(destination);
    src.start();
    if (opts.stop) src.stop(ctx.currentTime + opts.stop);
  }

  function addMasterChain(app){
    const ctx = app.audioContext;
    if (!ctx || app._masterChainReady) return;

    // Create master filter -> compressor -> reverb send -> analyzer -> destination
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.setValueAtTime(app.masterEffects?.filter?.frequency || 12000, ctx.currentTime);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, ctx.currentTime);
    compressor.knee.setValueAtTime(24, ctx.currentTime);
    compressor.ratio.setValueAtTime(3, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    const reverb = ctx.createConvolver();
    reverb.buffer = createImpulse(ctx, 2.2, 2.5);
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.12, ctx.currentTime);

    // Rewire: masterGain -> masterFilter -> compressor -> analyzer -> destination
    if (app.masterGain){
      try { app.masterGain.disconnect(); } catch(e) {}
      app.masterGain.connect(masterFilter);
    }
    masterFilter.connect(compressor);

    // Reverb send (post-filter pre-compressor to keep transients)
    const reverbSend = ctx.createGain();
    reverbSend.gain.setValueAtTime(0.18, ctx.currentTime);
    masterFilter.connect(reverbSend);
    reverbSend.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(compressor);

    // Continue chain
    if (app.analyzerNode){
      try { app.analyzerNode.disconnect(); } catch(e) {}
      compressor.connect(app.analyzerNode);
      app.analyzerNode.connect(ctx.destination);
    } else {
      compressor.connect(ctx.destination);
    }

    // Expose for automation
    app.audio = app.audio || {};
    app.audio.masterFilter = masterFilter;
    app.audio.compressor = compressor;
    app.audio.reverb = reverb;
    app.audio.reverbGain = reverbGain;

    app._masterChainReady = true;
  }

  function installProPlayback(app){
    const ctx = app.audioContext;
    if (!ctx) return;

    // Prepare caches
    const caches = {
      kick: makeKickBuffer(ctx),
      snareNoise: makeNoiseBuffer(ctx, 1.0),
      hatNoise: makeNoiseBuffer(ctx, 0.5),
      clapNoise: makeNoiseBuffer(ctx, 1.0)
    };

    function playKick(dest){
      playBuffer(ctx, caches.kick, dest || app.masterGain, { gain: 1.0, stop: 0.6 });
    }

    function playSnare(dest){
      // Noise burst through band-pass filter
      const src = ctx.createBufferSource();
      src.buffer = caches.snareNoise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1800, ctx.currentTime);
      bp.Q.setValueAtTime(0.8, ctx.currentTime);
      const g = ctx.createGain();
      makeEnv(ctx, ctx.currentTime, g, 0.001, 0.06, 0.0, 0.18, 0.8);
      src.connect(bp); bp.connect(g);
      g.connect(dest || app.masterGain);
      src.start(); src.stop(ctx.currentTime + 0.25);
    }

    function playHat(dest){
      const src = ctx.createBufferSource();
      src.buffer = caches.hatNoise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(6000, ctx.currentTime);
      const g = ctx.createGain();
      makeEnv(ctx, ctx.currentTime, g, 0.001, 0.02, 0.0, 0.06, 0.5);
      src.connect(hp); hp.connect(g);
      g.connect(dest || app.masterGain);
      src.start(); src.stop(ctx.currentTime + 0.1);
    }

    function playClap(dest){
      const src = ctx.createBufferSource();
      src.buffer = caches.clapNoise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(1200, ctx.currentTime);
      const g = ctx.createGain();
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.8, now + 0.005);
      g.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      src.connect(hp); hp.connect(g);
      g.connect(dest || app.masterGain);
      src.start(); src.stop(now + 0.25);
    }

    function playSynth(name, dest){
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.setValueAtTime(1500, ctx.currentTime);
      const now = ctx.currentTime;
      // mild unison detune
      osc1.type = 'sawtooth'; osc2.type = 'sawtooth';
      osc1.detune.setValueAtTime(-7, now);
      osc2.detune.setValueAtTime(7, now);
      osc1.connect(f); osc2.connect(f); f.connect(g);
      makeEnv(ctx, now, g, 0.005, 0.12, 0.6, 0.2, 0.5);
      (dest || app.masterGain) && g.connect(dest || app.masterGain);
      osc1.start(now); osc2.start(now);
      const dur = name.includes('pad') ? 0.8 : 0.35;
      osc1.stop(now + dur); osc2.stop(now + dur);
    }

    app.audio = app.audio || {};
    app.audio.play = function(type, name, dest){
      const nm = (name||'').toLowerCase();
      if (type === 'drum'){
        if (nm.includes('kick')) return playKick(dest);
        if (nm.includes('snare')) return playSnare(dest);
        if (nm.includes('hat') || nm.includes('hi-hat')) return playHat(dest);
        if (nm.includes('clap')) return playClap(dest);
        return playHat(dest);
      }
      if (type === 'synth') return playSynth(nm, dest);
      // fallback: beep
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.2, ctx.currentTime+0.005);
      g.gain.linearRampToValueAtTime(0.001, ctx.currentTime+0.2);
      osc.connect(g); g.connect(dest || app.masterGain);
      osc.start(); osc.stop(ctx.currentTime+0.22);
    };

    // Override core playSound to delegate here
    const original = app.playSound?.bind(app);
    app.playSound = function(type, name, out){
      try { return app.audio.play(type, name, out || app.masterGain); }
      catch (e){ if (original) return original(type, name, out); }
    };
  }

  window.registerFLPlugin(function(app){
    // After audio init, add master chain and pro playback
    app.on('afterInit', function(){
      if (!app.audioContext) return;
      addMasterChain(app);
      installProPlayback(app);
    });

    // Also if audio gets initialized later (first play press), patch lazily
    const origInitAudio = app.initAudio.bind(app);
    app.initAudio = async function(){
      const res = await origInitAudio();
      addMasterChain(app);
      installProPlayback(app);
      return res;
    };
  });
})();
