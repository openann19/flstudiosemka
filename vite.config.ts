/**
 * Vite configuration for FL Studio Web DAW
 * Strict TypeScript implementation
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8000,
    open: true,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          'audio-engine': [
            './src/audio/Synthesizer',
            './src/audio/InstrumentManager',
            './src/audio/SamplePlayer',
          ],
          'effects': [
            './src/effects/EffectChain',
            './src/effects/EQ',
            './src/effects/Compressor',
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lodash-es'],
  },
  assetsInclude: ['**/*.wav', '**/*.mp3', '**/*.ogg', '**/*.flac'],
});

