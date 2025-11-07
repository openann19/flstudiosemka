const assert = require('assert');
const { timelineUtils } = require('../timelineUtils.js');

describeTimelineUtils();

function describeTimelineUtils() {
  runClampTests();
  runBeatBarConversionTests();
  runFormattingTests();
  runSnapAndGridTests();
  runMarkerGenerationTests();
  console.log('✅ timelineUtils tests passed');
}

function runClampTests() {
  assert.strictEqual(timelineUtils.clamp(5, 0, 10), 5, 'clamp should keep mid-range values');
  assert.strictEqual(timelineUtils.clamp(-2, 0, 10), 0, 'clamp should bound to lower range');
  assert.strictEqual(timelineUtils.clamp(20, 0, 10), 10, 'clamp should bound to upper range');
}

function runBeatBarConversionTests() {
  assert.strictEqual(timelineUtils.beatsToPixels(4, 50), 200, 'beatsToPixels should multiply beats by pixels per beat');
  assert.strictEqual(timelineUtils.barsToBeats(8, 4), 32, 'barsToBeats should convert bars to beats');
  assert.strictEqual(timelineUtils.beatsToBars(16, 4), 4, 'beatsToBars should convert beats to bars');
  assert.strictEqual(timelineUtils.beatsToBars(10, 0), 0, 'beatsToBars should guard against divide-by-zero');
}

function runFormattingTests() {
  assert.strictEqual(
    timelineUtils.formatBeatPosition(4.5, 4, 4),
    '02.01.03',
    'formatBeatPosition should format bar/beat/step correctly'
  );

  assert.strictEqual(
    timelineUtils.formatBeatPosition(-1, 4, 4),
    '01.01.01',
    'formatBeatPosition should clamp negative beats to zero'
  );

  assert.strictEqual(
    timelineUtils.formatClockTime(4, 120),
    '00:02.000',
    'formatClockTime should convert beats to mm:ss.ms'
  );

  assert.strictEqual(
    timelineUtils.formatClockTime(4, 0),
    '00:00.000',
    'formatClockTime should guard against invalid BPM'
  );
}

function runSnapAndGridTests() {
  assert.strictEqual(timelineUtils.getSubdivisionForSnap('bar', 4, 4), 4, 'Bar snap should return beats per bar');
  assert.strictEqual(timelineUtils.getSubdivisionForSnap('beat', 4, 4), 1, 'Beat snap should return one beat');
  assert.strictEqual(
    timelineUtils.getSubdivisionForSnap('step', 4, 4),
    0.25,
    'Step snap should return one subdivision per step'
  );

  const gridLines = timelineUtils.buildGridLines({ totalBeats: 4, beatsPerBar: 4, stepsPerBeat: 4, snapSetting: 'beat' });
  const barLines = gridLines.filter((line) => line.type === 'bar');
  const beatLines = gridLines.filter((line) => line.type === 'beat');
  const subLines = gridLines.filter((line) => line.type === 'sub');

  assert.strictEqual(barLines.length, 2, 'Grid should include bar markers at start and end');
  assert.strictEqual(beatLines.length, 3, 'Grid should include beat markers between bars');
  assert.strictEqual(subLines.length, 0, 'Grid should skip subdivision lines for beat snapping');
}

function runMarkerGenerationTests() {
  const markers = timelineUtils.generateDefaultMarkers(12, 4);
  assert.strictEqual(markers.length, 3, 'Default markers should include intro, verse, chorus');
  assert.strictEqual(markers[0].label, 'Intro', 'First marker should be the intro');
  assert.ok(markers[1].beat >= 4, 'Verse should not start before one full bar');
  assert.ok(markers[2].beat > markers[1].beat, 'Chorus should come after verse');
}
