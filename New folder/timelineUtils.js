const createTimelineUtils = () => {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const beatsToPixels = (beats, pixelsPerBeat) => beats * pixelsPerBeat;

  const barsToBeats = (bars, beatsPerBar) => bars * beatsPerBar;

  const beatsToBars = (beats, beatsPerBar) => beatsPerBar === 0 ? 0 : beats / beatsPerBar;

  const roundTo = (value, precision = 1e-6) => Math.round(value / precision) * precision;

  const formatBeatPosition = (beat, beatsPerBar = 4, stepsPerBeat = 4) => {
    const safeBeat = Math.max(0, beat);
    const barIndex = Math.floor(safeBeat / beatsPerBar);
    const beatWithinBar = Math.floor(safeBeat % beatsPerBar);
    const fractionalBeat = safeBeat - Math.floor(safeBeat);
    const stepIndex = Math.floor(fractionalBeat * stepsPerBeat);
    const barStr = String(barIndex + 1).padStart(2, '0');
    const beatStr = String(beatWithinBar + 1).padStart(2, '0');
    const stepStr = String(stepIndex + 1).padStart(2, '0');
    return `${barStr}.${beatStr}.${stepStr}`;
  };

  const formatClockTime = (beat, bpm) => {
    if (!bpm || bpm <= 0) return '00:00.000';
    const secondsPerBeat = 60 / bpm;
    const totalSeconds = beat * secondsPerBeat;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000);
    const minuteStr = String(minutes).padStart(2, '0');
    const secondStr = String(seconds).padStart(2, '0');
    const milliStr = String(milliseconds).padStart(3, '0');
    return `${minuteStr}:${secondStr}.${milliStr}`;
  };

  const getSubdivisionForSnap = (snapSetting, beatsPerBar = 4, stepsPerBeat = 4) => {
    switch (snapSetting) {
      case 'bar':
        return beatsPerBar;
      case 'beat':
        return 1;
      case 'step':
        return 1 / stepsPerBeat;
      case 'none':
      default:
        return 1 / (stepsPerBeat * 2);
    }
  };

  const buildRulerTicks = ({ totalBeats, beatsPerBar = 4 }) => {
    const ticks = [];
    for (let beat = 0; beat <= totalBeats + 1e-6; beat += 1) {
      const isBar = Math.abs(roundTo(beat % beatsPerBar)) < 1e-6;
      ticks.push({
        beat: roundTo(beat),
        label: isBar ? `Bar ${Math.floor(beat / beatsPerBar) + 1}` : `${Math.floor(beat % beatsPerBar) + 1}`,
        isMajor: isBar
      });
    }
    return ticks;
  };

  const buildGridLines = ({
    totalBeats,
    beatsPerBar = 4,
    stepsPerBeat = 4,
    snapSetting = 'beat'
  }) => {
    const lines = [];
    const subdivision = getSubdivisionForSnap(snapSetting, beatsPerBar, stepsPerBeat);
    const increment = Math.min(subdivision, 1 / stepsPerBeat);
    for (let beat = 0; beat <= totalBeats + 1e-6; beat += increment) {
      const roundedBeat = roundTo(beat);
      const isBar = Math.abs(roundedBeat % beatsPerBar) < 1e-6;
      const isBeat = Math.abs(roundedBeat % 1) < 1e-6;
      const type = isBar ? 'bar' : isBeat ? 'beat' : 'sub';
      if (snapSetting === 'bar' && !isBar) continue;
      if (snapSetting === 'beat' && type === 'sub') continue;
      lines.push({ beat: roundedBeat, type });
    }
    return lines;
  };

  const generateDefaultMarkers = (lengthBars, beatsPerBar = 4) => {
    const markers = [];
    const totalBeats = barsToBeats(lengthBars, beatsPerBar);
    markers.push({ id: 'marker-intro', label: 'Intro', beat: 0 });
    const verseBeat = clamp(Math.floor(totalBeats / 3 / beatsPerBar) * beatsPerBar, beatsPerBar, totalBeats - beatsPerBar);
    markers.push({ id: 'marker-verse', label: 'Verse', beat: verseBeat });
    const chorusBeat = clamp(Math.floor((2 * totalBeats) / 3 / beatsPerBar) * beatsPerBar, verseBeat + beatsPerBar, totalBeats - beatsPerBar);
    markers.push({ id: 'marker-chorus', label: 'Chorus', beat: chorusBeat });
    return markers;
  };

  return {
    clamp,
    beatsToPixels,
    barsToBeats,
    beatsToBars,
    formatBeatPosition,
    formatClockTime,
    getSubdivisionForSnap,
    buildRulerTicks,
    buildGridLines,
    generateDefaultMarkers
  };
};

const timelineUtils = createTimelineUtils();

if (typeof window !== 'undefined') {
  window.timelineUtils = timelineUtils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { timelineUtils };
}
