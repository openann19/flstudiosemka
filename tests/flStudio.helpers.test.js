const assert = require('assert');
const { FLStudio } = require('../app.js');

const proto = FLStudio.prototype;

function runSanitizeBpmTests() {
  const clampHigh = proto.sanitizeBpm.call({ bpm: 140 }, 1000);
  assert.strictEqual(clampHigh, 200, 'sanitizeBpm should clamp high BPM values to 200');

  const clampLow = proto.sanitizeBpm.call({ bpm: 140 }, -50);
  assert.strictEqual(clampLow, 60, 'sanitizeBpm should clamp low BPM values to 60');

  const fallback = proto.sanitizeBpm.call({ bpm: 128 }, Number.NaN);
  assert.strictEqual(fallback, 128, 'sanitizeBpm should fall back to current BPM when input is NaN');
}

function runGetBpmTests() {
  const instance = { bpm: 150 };
  const result = proto.getBpm.call(instance);
  assert.strictEqual(result, 150, 'getBpm should return the current BPM');

  const fallback = proto.getBpm.call({});
  assert.strictEqual(fallback, 140, 'getBpm should default to 140 when BPM is undefined');
}

function runOnAudioUnlockTests() {
  const callbacks = new Set();
  let handlerAttached = false;

  const fakeInstance = {
    audioUnlockState: 'pending',
    audioContext: null,
    _audioUnlockCallbacks: callbacks,
    _audioUnlockEvents: ['pointerdown'],
    _audioUnlockHandler: null,
    _setupAudioUnlockHandling() {
      handlerAttached = true;
      if (!this._audioUnlockPromise) {
        this._audioUnlockPromise = new Promise((resolve) => {
          this._resolveAudioUnlock = resolve;
        });
      }
    }
  };

  const immediateStub = {
    ...fakeInstance,
    audioUnlockState: 'resolved',
    audioContext: { state: 'running' }
  };

  let invoked = false;
  const dispose = proto.onAudioUnlock.call(immediateStub, (ctx) => {
    invoked = true;
    assert.strictEqual(ctx, immediateStub.audioContext, 'onAudioUnlock should provide the active audio context');
  });
  assert.strictEqual(typeof dispose, 'function', 'onAudioUnlock should return a disposer');
  assert.strictEqual(invoked, true, 'Callback should fire immediately when already resolved');
  dispose();

  const pendingStub = { ...fakeInstance };
  let triggered = false;
  const disposer = proto.onAudioUnlock.call(pendingStub, () => {
    triggered = true;
  }, { invokeImmediately: false });

  assert.strictEqual(handlerAttached, true, 'Audio unlock handler should be attached when pending');
  assert.strictEqual(typeof disposer, 'function', 'onAudioUnlock should return disposer for pending state');
  assert.strictEqual(triggered, false, 'Callback should not run immediately when invokeImmediately is false');
  assert.strictEqual(callbacks.size, 1, 'Callback should be registered');

  disposer();
  assert.strictEqual(callbacks.size, 0, 'Callback disposer should remove the listener');
}

function main() {
  runSanitizeBpmTests();
  runGetBpmTests();
  runOnAudioUnlockTests();
  console.log('✅ FLStudio helper tests passed');
}

main();
