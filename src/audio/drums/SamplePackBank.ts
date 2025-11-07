/**
 * SamplePackBank - Manages pre-generated drum samplepacks
 * Loads samples from embedded module and caches in memory for offline access
 * @module audio/drums/SamplePackBank
 */

import type { SoundItem } from '../../types/FLStudio.types';

/**
 * Sample data structure
 */
export interface SampleData {
  metadata: {
    name: string;
    type: 'kick' | 'snare' | 'hihat' | 'openhat' | 'crash' | 'ride' | 'rimshot' | 'clap';
    category: string;
    velocity?: 'soft' | 'medium' | 'hard';
    description?: string;
  };
  wavBase64: string;
}

/**
 * Cached sample with AudioBuffer
 */
interface CachedSample {
  metadata: SampleData['metadata'];
  buffer: AudioBuffer;
}

/**
 * Sample pack bank manager
 */
export class SamplePackBank {
  private audioContext: AudioContext;
  private samples: Map<string, CachedSample>;
  private initialized: boolean;

  /**
   * Create a new SamplePackBank
   * @param audioContext - Web Audio API AudioContext
   */
  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.samples = new Map();
    this.initialized = false;
  }

  /**
   * Initialize and load all samples from embedded module
   * @returns Promise that resolves when all samples are loaded
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Dynamically import the generated samples module
      const samplesModule = await import('./generated/909-samples');
      const drumSamples = samplesModule.DRUM_SAMPLES as SampleData[];

      // Load all samples into memory
      const loadPromises = drumSamples.map(async (sampleData) => {
        try {
          // Convert base64 WAV to ArrayBuffer
          const binaryString = atob(sampleData.wavBase64);
          const arrayBuffer = new ArrayBuffer(binaryString.length);
          const uint8Array = new Uint8Array(arrayBuffer);
          
          for (let i = 0; i < binaryString.length; i += 1) {
            uint8Array[i] = binaryString.charCodeAt(i);
          }

          // Decode audio data
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

          // Cache the sample
          const key = this.getSampleKey(sampleData.metadata);
          this.samples.set(key, {
            metadata: sampleData.metadata,
            buffer: audioBuffer,
          });
        } catch (error) {
           
          console.error(`[DEBUG] SamplePackBank: Failed to load sample ${sampleData.metadata.name}`, error);
        }
      });

      await Promise.all(loadPromises);
      this.initialized = true;
    } catch (error) {
       
      console.error('[DEBUG] SamplePackBank: Failed to initialize', error);
      throw new Error(`SamplePackBank: Failed to initialize - ${error}`);
    }
  }

  /**
   * Get sample key from metadata
   */
  private getSampleKey(metadata: SampleData['metadata']): string {
    return `${metadata.category}:${metadata.name}`;
  }

  /**
   * Get a sample by name and category
   * @param name - Sample name
   * @param category - Sample category
   * @returns AudioBuffer or null if not found
   */
  getSample(name: string, category: string): AudioBuffer | null {
    const key = `${category}:${name}`;
    const cached = this.samples.get(key);
    return cached ? cached.buffer : null;
  }

  /**
   * Get all samples as SoundItems for browser
   * @returns Array of SoundItems
   */
  getAllSoundItems(): SoundItem[] {
    const soundItems: SoundItem[] = [];

    this.samples.forEach((cached) => {
      soundItems.push({
        name: cached.metadata.name,
        type: 'sample',
        icon: this.getIconForType(cached.metadata.type),
      });
    });

    return soundItems;
  }

  /**
   * Get samples by category
   * @param category - Category name
   * @returns Array of SoundItems
   */
  getSamplesByCategory(category: string): SoundItem[] {
    const soundItems: SoundItem[] = [];

    this.samples.forEach((cached) => {
      if (cached.metadata.category === category) {
        soundItems.push({
          name: cached.metadata.name,
          type: 'sample',
          icon: this.getIconForType(cached.metadata.type),
        });
      }
    });

    return soundItems;
  }

  /**
   * Get samples by type
   * @param type - Sample type
   * @returns Array of cached samples
   */
  getSamplesByType(type: SampleData['metadata']['type']): CachedSample[] {
    const results: CachedSample[] = [];

    this.samples.forEach((cached) => {
      if (cached.metadata.type === type) {
        results.push(cached);
      }
    });

    return results;
  }

  /**
   * Get icon for sample type
   */
  private getIconForType(type: SampleData['metadata']['type']): string {
    const iconMap: Record<SampleData['metadata']['type'], string> = {
      kick: '🥁',
      snare: '🥁',
      hihat: '🥁',
      openhat: '🥁',
      crash: '🥁',
      ride: '🥁',
      rimshot: '🥁',
      clap: '👏',
    };

    return iconMap[type] || '🎵';
  }

  /**
   * Get sample metadata
   * @param name - Sample name
   * @param category - Sample category
   * @returns Metadata or null if not found
   */
  getSampleMetadata(name: string, category: string): SampleData['metadata'] | null {
    const key = `${category}:${name}`;
    const cached = this.samples.get(key);
    return cached ? cached.metadata : null;
  }

  /**
   * Get all categories
   * @returns Array of unique category names
   */
  getCategories(): string[] {
    const categories = new Set<string>();

    this.samples.forEach((cached) => {
      categories.add(cached.metadata.category);
    });

    return Array.from(categories).sort();
  }

  /**
   * Check if initialized
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get total sample count
   * @returns Number of loaded samples
   */
  getSampleCount(): number {
    return this.samples.size;
  }

  /**
   * Get all cached samples
   * @returns Map of all cached samples
   */
  getAllSamples(): Map<string, CachedSample> {
    return new Map(this.samples);
  }
}

