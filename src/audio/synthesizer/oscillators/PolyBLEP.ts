/**
 * PolyBLEP - Polynomial Band-Limited Step function
 * Anti-aliasing algorithm for sawtooth, square, and pulse waveforms
 * @module audio/synthesizer/oscillators/PolyBLEP
 */

/**
 * PolyBLEP correction for sawtooth waveform
 * @param t - Normalized phase (0 to 1)
 * @param dt - Phase increment per sample
 * @returns Correction value to add to sawtooth
 */
export function polyBLEPSawtooth(t: number, dt: number): number {
  let correction = 0;

  // Left discontinuity
  if (t < dt) {
    const tDivDt = t / dt;
    correction -= (2 * tDivDt - tDivDt * tDivDt - 1);
  }

  // Right discontinuity
  if (t > 1 - dt) {
    const tDivDt = (t - 1) / dt;
    correction += (2 * tDivDt + tDivDt * tDivDt + 1);
  }

  return correction;
}

/**
 * PolyBLEP correction for square waveform
 * @param t - Normalized phase (0 to 1)
 * @param dt - Phase increment per sample
 * @returns Correction value to add to square
 */
export function polyBLEPSquare(t: number, dt: number): number {
  let correction = 0;

  // Rising edge
  if (t < dt) {
    const tDivDt = t / dt;
    correction -= (2 * tDivDt - tDivDt * tDivDt - 1);
  } else if (t > 1 - dt) {
    const tDivDt = (t - 1) / dt;
    correction -= (2 * tDivDt + tDivDt * tDivDt + 1);
  }

  // Falling edge (at 0.5)
  if (t < 0.5 && t > 0.5 - dt) {
    const tDivDt = (t - 0.5) / dt;
    correction += (2 * tDivDt - tDivDt * tDivDt - 1);
  } else if (t > 0.5 && t < 0.5 + dt) {
    const tDivDt = (t - 0.5) / dt;
    correction += (2 * tDivDt + tDivDt * tDivDt + 1);
  }

  return correction;
}

/**
 * PolyBLEP correction for pulse waveform
 * @param t - Normalized phase (0 to 1)
 * @param dt - Phase increment per sample
 * @param pulseWidth - Pulse width (0 to 1)
 * @returns Correction value to add to pulse
 */
export function polyBLEPPulse(t: number, dt: number, pulseWidth: number): number {
  let correction = 0;
  const width = Math.max(0.01, Math.min(0.99, pulseWidth));

  // Rising edge at 0
  if (t < dt) {
    const tDivDt = t / dt;
    correction -= (2 * tDivDt - tDivDt * tDivDt - 1);
  } else if (t > 1 - dt) {
    const tDivDt = (t - 1) / dt;
    correction -= (2 * tDivDt + tDivDt * tDivDt + 1);
  }

  // Falling edge at pulseWidth
  if (t < width && t > width - dt) {
    const tDivDt = (t - width) / dt;
    correction += (2 * tDivDt - tDivDt * tDivDt - 1);
  } else if (t > width && t < width + dt) {
    const tDivDt = (t - width) / dt;
    correction += (2 * tDivDt + tDivDt * tDivDt + 1);
  }

  return correction;
}

/**
 * Generate band-limited sawtooth with PolyBLEP
 * @param phase - Current phase (0 to 1)
 * @param phaseIncrement - Phase increment per sample
 * @returns Band-limited sawtooth value (-1 to 1)
 */
export function generateBandLimitedSawtooth(phase: number, phaseIncrement: number): number {
  const normalizedPhase = phase % 1;
  const rawSawtooth = normalizedPhase * 2 - 1;
  const correction = polyBLEPSawtooth(normalizedPhase, phaseIncrement);
  return Math.max(-1, Math.min(1, rawSawtooth + correction));
}

/**
 * Generate band-limited square with PolyBLEP
 * @param phase - Current phase (0 to 1)
 * @param phaseIncrement - Phase increment per sample
 * @returns Band-limited square value (-1 to 1)
 */
export function generateBandLimitedSquare(phase: number, phaseIncrement: number): number {
  const normalizedPhase = phase % 1;
  const rawSquare = normalizedPhase < 0.5 ? 1 : -1;
  const correction = polyBLEPSquare(normalizedPhase, phaseIncrement);
  return Math.max(-1, Math.min(1, rawSquare + correction));
}

/**
 * Generate band-limited pulse with PolyBLEP
 * @param phase - Current phase (0 to 1)
 * @param phaseIncrement - Phase increment per sample
 * @param pulseWidth - Pulse width (0 to 1)
 * @returns Band-limited pulse value (-1 to 1)
 */
export function generateBandLimitedPulse(
  phase: number,
  phaseIncrement: number,
  pulseWidth: number
): number {
  const normalizedPhase = phase % 1;
  const width = Math.max(0.01, Math.min(0.99, pulseWidth));
  const rawPulse = normalizedPhase < width ? 1 : -1;
  const correction = polyBLEPPulse(normalizedPhase, phaseIncrement, width);
  return Math.max(-1, Math.min(1, rawPulse + correction));
}

