/**
 * SpectrumAnalyzer - FFT-based frequency spectrum analyzer
 * Displays real-time frequency visualization
 * @module components/ui/SpectrumAnalyzer
 */

import { useRef, useEffect, type ReactElement } from 'react';

/**
 * SpectrumAnalyzer component props
 */
export interface SpectrumAnalyzerProps {
  audioContext: AudioContext | null;
  sourceNode?: AudioNode | null;
  width?: number;
  height?: number;
  fftSize?: number;
  smoothingTimeConstant?: number;
}

/**
 * Spectrum analyzer component
 */
export function SpectrumAnalyzer({
  audioContext,
  sourceNode,
  width = 400,
  height = 200,
  fftSize = 2048,
  smoothingTimeConstant = 0.8,
}: SpectrumAnalyzerProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  /**
   * Setup analyser
   */
  useEffect(() => {
    if (!audioContext || !sourceNode) {
      return;
    }

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;
    analyser.smoothingTimeConstant = smoothingTimeConstant;

    sourceNode.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    return () => {
      try {
        sourceNode.disconnect(analyser);
      } catch {
        // Already disconnected
      }
    };
  }, [audioContext, sourceNode, fftSize, smoothingTimeConstant]);

  /**
   * Draw spectrum
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!canvas || !analyser || !dataArray) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const draw = (): void => {
      const buffer = dataArray.buffer instanceof ArrayBuffer 
        ? dataArray.buffer 
        : new ArrayBuffer(dataArray.byteLength);
      const typedArray = new Uint8Array(buffer, dataArray.byteOffset, dataArray.length);
      analyser.getByteFrequencyData(typedArray);
      // Copy back to original array for rendering
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = typedArray[i] ?? 0;
      }

      ctx.fillStyle = '#1E1E1E';
      ctx.fillRect(0, 0, width, height);

      const barWidth = width / dataArray.length;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i];
        if (value === undefined) {
          continue;
        }
        const barHeight = (value / 255) * height;

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#00FF00');
        gradient.addColorStop(0.5, '#FFFF00');
        gradient.addColorStop(1, '#FF0000');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, analyserRef, dataArrayRef]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    />
  );
}

