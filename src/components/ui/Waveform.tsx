/**
 * Waveform - Audio waveform visualization component
 * Displays audio waveform with zoomable view
 * @module components/ui/Waveform
 */

import { useRef, useEffect, useState } from 'react';

/**
 * Waveform component props
 */
export interface WaveformProps {
  audioBuffer?: AudioBuffer | null;
  currentTime?: number;
  duration?: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

/**
 * Waveform component
 */
export function Waveform({
  audioBuffer,
  currentTime = 0,
  duration = 0,
  width = 800,
  height = 100,
  color = '#FF9900',
  backgroundColor = '#1E1E1E',
}: WaveformProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [_zoom, _setZoom] = useState<number>(1);

  /**
   * Draw waveform
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    if (!audioBuffer) {
      return;
    }

    const channelData = audioBuffer.getChannelData(0);
    const samples = channelData.length;
    const samplesPerPixel = Math.ceil(samples / (width * _zoom));
    const centerY = height / 2;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const startSample = Math.floor(x * samplesPerPixel);
      const endSample = Math.min(startSample + samplesPerPixel, samples);

      let max = 0;
      let min = 0;

      for (let i = startSample; i < endSample; i++) {
        const value = channelData[i];
        if (value !== undefined) {
          if (value > max) {
            max = value;
          }
          if (value < min) {
            min = value;
          }
        }
      }

      const y1 = centerY - max * centerY;
      const y2 = centerY - min * centerY;

      if (x === 0) {
        ctx.moveTo(x, y1);
      } else {
        ctx.lineTo(x, y1);
        ctx.lineTo(x, y2);
      }
    }

    ctx.stroke();

    // Draw playhead
    if (duration > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }
  }, [audioBuffer, currentTime, duration, width, height, color, backgroundColor, _zoom]);

  return (
    <div
      style={{
        position: 'relative',
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
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
    </div>
  );
}

