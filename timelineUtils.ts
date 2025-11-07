/**
 * Timeline Utilities
 * Helper functions for timeline calculations, formatting, and grid generation
 */

interface RulerTick {
  beat: number;
  label: string;
  isMajor: boolean;
}

interface GridLine {
  beat: number;
  type: 'bar' | 'beat' | 'sub';
}

interface Marker {
  id: string;
  label: string;
  beat: number;
}

interface BuildRulerTicksOptions {
  totalBeats: number;
  beatsPerBar?: number;
}

interface BuildGridLinesOptions {
  totalBeats: number;
  beatsPerBar?: number;
  stepsPerBeat?: number;
  snapSetting?: string;
}

const createTimelineUtils = () => {
  const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

  const beatsToPixels = (beats: number, pixelsPerBeat: number): number => beats * pixelsPerBeat;

  const barsToBeats = (bars: number, beatsPerBar: number): number => bars * beatsPerBar;

  const beatsToBars = (beats: number, beatsPerBar: number): number => beatsPerBar === 0 ? 0 : beats / beatsPerBar;

  const roundTo = (value: number, precision = 1e-6): number => Math.round(value / precision) * precision;

  const formatBeatPosition = (beat: number, beatsPerBar = 4, stepsPerBeat = 4): string => {
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

  const formatClockTime = (beat: number, bpm: number): string => {
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

  const getSubdivisionForSnap = (snapSetting: string, beatsPerBar = 4, stepsPerBeat = 4): number => {
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

  const buildRulerTicks = ({ totalBeats, beatsPerBar = 4 }: BuildRulerTicksOptions): RulerTick[] => {
    const ticks: RulerTick[] = [];
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
  }: BuildGridLinesOptions): GridLine[] => {
    const lines: GridLine[] = [];
    const subdivision = getSubdivisionForSnap(snapSetting, beatsPerBar, stepsPerBeat);
    const increment = Math.min(subdivision, 1 / stepsPerBeat);
    for (let beat = 0; beat <= totalBeats + 1e-6; beat += increment) {
      const roundedBeat = roundTo(beat);
      const isBar = Math.abs(roundedBeat % beatsPerBar) < 1e-6;
      const isBeat = Math.abs(roundedBeat % 1) < 1e-6;
      const type: GridLine['type'] = isBar ? 'bar' : isBeat ? 'beat' : 'sub';
      if (snapSetting === 'bar' && !isBar) continue;
      if (snapSetting === 'beat' && type === 'sub') continue;
      lines.push({ beat: roundedBeat, type });
    }
    return lines;
  };

  const generateDefaultMarkers = (lengthBars: number, beatsPerBar = 4): Marker[] => {
    const markers: Marker[] = [];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).timelineUtils = timelineUtils;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { timelineUtils };
}

export { timelineUtils };
export type { RulerTick, GridLine, Marker, BuildRulerTicksOptions, BuildGridLinesOptions };

