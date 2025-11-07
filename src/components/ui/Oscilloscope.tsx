/**
 * Oscilloscope - Real-time waveform oscilloscope
 * Displays real-time waveform and Lissajous patterns
 * @module components/ui/Oscilloscope
 */

import { useRef, useEffect } from 'react';

/**
 * Oscilloscope component props
 */
export interface OscilloscopeProps {
  audioContext: AudioContext | null;
  sourceNode?: AudioNode | null;
  width?: number;
  height?: number;
  mode?: 'waveform' | 'lissajous';
}

/**
 * Oscilloscope component
 */
export function Oscilloscope({
  audioContext,
  sourceNode,
  width = 400,
  height = 200,
  mode = 'waveform',
}: OscilloscopeProps): JSX.Element {
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
    analyser.fftSize = 2048;

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
  }, [audioContext, sourceNode]);

  /**
   * Draw oscilloscope
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
      if (!analyser || !dataArray) {
        return;
      }

      const buffer = dataArray.buffer instanceof ArrayBuffer 
        ? dataArray.buffer 
        : new ArrayBuffer(dataArray.byteLength);
      const typedArray = new Uint8Array(buffer, dataArray.byteOffset, dataArray.length);
      analyser.getByteTimeDomainData(typedArray);
      // Copy back to original array for rendering
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = typedArray[i] ?? 0;
      }

      ctx.fillStyle = '#1E1E1E';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#FF9900';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / dataArray.length;
      let x = 0;

      if (mode === 'waveform') {
        for (let i = 0; i < dataArray.length; i++) {
          const value = dataArray[i];
          if (value === undefined) {
            continue;
          }
          const v = value / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
      } else {
        // Lissajous pattern
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < dataArray.length - 1; i += 2) {
          const xValue = dataArray[i];
          const yValue = dataArray[i + 1];
          if (xValue === undefined || yValue === undefined) {
            continue;
          }
          const x1 = (xValue / 128.0) * centerX;
          const y1 = (yValue / 128.0) * centerY;

          if (i === 0) {
            ctx.moveTo(centerX + x1, centerY + y1);
          } else {
            ctx.lineTo(centerX + x1, centerY + y1);
          }
        }
      }

      ctx.stroke();

      // Draw center line for waveform mode
      if (mode === 'waveform') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, mode, analyserRef, dataArrayRef]);

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

