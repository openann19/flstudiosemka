/**
 * BrowserService - Sound library and browser logic
 * Strict TypeScript implementation with comprehensive error handling
 */

import type { SoundLibrary, SoundItem } from '../types/FLStudio.types';
import type { SamplePackBank } from '../audio/drums/SamplePackBank';

export class BrowserService {
  private soundLibrary: SoundLibrary;
  private samplePackBank: SamplePackBank | null;

  constructor(samplePackBank?: SamplePackBank | null) {
    this.samplePackBank = samplePackBank || null;
    this.soundLibrary = this.generateSoundLibrary();
  }

  /**
   * Set sample pack bank
   */
  setSamplePackBank(samplePackBank: SamplePackBank | null): void {
    this.samplePackBank = samplePackBank;
    // Regenerate sound library to include 909 samples
    this.soundLibrary = this.generateSoundLibrary();
  }

  /**
   * Generate default sound library
   */
  generateSoundLibrary(): SoundLibrary {
    return {
      presets: {
        Drums: [
          { name: 'Kick 01', type: 'drum', icon: '🥁' },
          { name: 'Snare 01', type: 'drum', icon: '🥁' },
          { name: 'Hi-Hat 01', type: 'drum', icon: '🥁' },
          { name: 'Clap 01', type: 'drum', icon: '👏' },
          { name: 'Crash 01', type: 'drum', icon: '🥁' },
        ],
        Synths: [
          { name: 'Bass Synth 01', type: 'synth', icon: '🎹' },
          { name: 'Lead Synth 01', type: 'synth', icon: '🎹' },
          { name: 'Pad Synth 01', type: 'synth', icon: '🎹' },
          { name: 'Pluck Synth 01', type: 'synth', icon: '🎸' },
        ],
        Effects: [
          { name: 'Reverb Hall', type: 'effect', icon: '🌊' },
          { name: 'Delay 1/8', type: 'effect', icon: '⏰' },
          { name: 'Chorus', type: 'effect', icon: '🌊' },
          { name: 'Distortion', type: 'effect', icon: '⚡' },
        ],
      },
      samples: {
        Kicks: [
          { name: '808 Kick', type: 'sample', icon: '🥁' },
          { name: '909 Kick', type: 'sample', icon: '🥁' },
          { name: 'Acoustic Kick', type: 'sample', icon: '🥁' },
        ],
        Snares: [
          { name: '808 Snare', type: 'sample', icon: '🥁' },
          { name: '909 Snare', type: 'sample', icon: '🥁' },
          { name: 'Piccolo Snare', type: 'sample', icon: '🥁' },
        ],
        HiHats: [
          { name: 'Closed HH', type: 'sample', icon: '🥁' },
          { name: 'Open HH', type: 'sample', icon: '🥁' },
          { name: 'Pedal HH', type: 'sample', icon: '🥁' },
        ],
        // 909 Techno Pack - populated from SamplePackBank if available
        ...(this.samplePackBank && this.samplePackBank.isInitialized()
          ? this.get909TechnoPackSamples()
          : {}),
      },
      plugins: [
        { name: 'Fruity Reverb', type: 'plugin', icon: '🔊' },
        { name: 'EQ', type: 'plugin', icon: '📊' },
        { name: 'Compressor', type: 'plugin', icon: '⚙️' },
        { name: 'Distortion', type: 'plugin', icon: '⚡' },
        { name: 'Delay', type: 'plugin', icon: '⏰' },
      ],
    };
  }

  /**
   * Get sound library
   */
  getSoundLibrary(): SoundLibrary {
    return this.soundLibrary;
  }

  /**
   * Search sounds by query
   */
  searchSounds(
    query: string,
    selectedCategory: string | null,
    selectedFolder: string | null
  ): SoundItem[] {
    let sounds: SoundItem[] = [];

    if (selectedCategory && selectedFolder) {
      const category = this.soundLibrary[selectedCategory as keyof SoundLibrary];
      if (category && typeof category === 'object' && !Array.isArray(category)) {
        const folder = (category as { [key: string]: SoundItem[] })[selectedFolder];
        sounds = folder || [];
      }
    } else if (selectedCategory === 'plugins') {
      sounds = this.soundLibrary.plugins;
    } else if (selectedCategory && !selectedFolder) {
      const category = this.soundLibrary[selectedCategory as keyof SoundLibrary];
      if (category && typeof category === 'object' && !Array.isArray(category)) {
        Object.values(category).forEach((folder) => {
          if (Array.isArray(folder)) {
            sounds = sounds.concat(folder);
          }
        });
      }
    }

    if (query) {
      const queryLower = query.toLowerCase();
      sounds = sounds.filter((sound) => sound.name.toLowerCase().includes(queryLower));
    }

    return sounds;
  }

  /**
   * Get browser title for current selection
   */
  getBrowserTitle(
    selectedCategory: string | null,
    selectedFolder: string | null,
    searchQuery: string
  ): string {
    if (searchQuery) {
      return `Search results for "${searchQuery}"`;
    }

    if (selectedCategory && selectedFolder) {
      return `${selectedCategory} > ${selectedFolder}`;
    }

    if (selectedCategory === 'plugins') {
      return 'Plugins';
    }

    if (selectedCategory && !selectedFolder) {
      return selectedCategory;
    }

    return 'Select a category to browse sounds';
  }

  /**
   * Handle sound drag start event
   */
  handleSoundDragStart(event: DragEvent, sound: SoundItem): void {
    try {
      if (!event.dataTransfer) {
        throw new Error('BrowserService: DragEvent dataTransfer is null');
      }

      event.dataTransfer.setData('application/json', JSON.stringify(sound));

      if (event.target && event.target instanceof HTMLElement) {
        event.target.classList.add('dragging');
      }
    } catch {
      throw new Error(`BrowserService: Failed to handle sound drag start - ${error}`);
    }
  }

  /**
   * Parse sound from drag event
   */
  parseSoundFromDragEvent(event: DragEvent): SoundItem | null {
    try {
      if (!event.dataTransfer) {
        return null;
      }

      const data = event.dataTransfer.getData('application/json');
      if (!data) {
        return null;
      }

      const sound = JSON.parse(data) as SoundItem;
      return sound;
    } catch {
      return null;
    }
  }

  /**
   * Validate sound item
   */
  validateSoundItem(sound: unknown): sound is SoundItem {
    if (!sound || typeof sound !== 'object') {
      return false;
    }

    const s = sound as Record<string, unknown>;

    return (
      typeof s.name === 'string' &&
      typeof s.type === 'string' &&
      typeof s.icon === 'string' &&
      ['drum', 'synth', 'sample', 'effect', 'plugin'].includes(s.type as string)
    );
  }

  /**
   * Get sounds by category and folder
   */
  getSoundsByCategory(
    category: string | null,
    folder: string | null
  ): SoundItem[] {
    if (!category) {
      return [];
    }

    try {
      const categoryData = this.soundLibrary[category as keyof SoundLibrary];

      if (!categoryData) {
        return [];
      }

      if (category === 'plugins' && Array.isArray(categoryData)) {
        return categoryData;
      }

      if (typeof categoryData === 'object' && !Array.isArray(categoryData)) {
        if (folder) {
          const folderData = (categoryData as { [key: string]: SoundItem[] })[folder];
          return folderData || [];
        }

        const allSounds: SoundItem[] = [];
        Object.values(categoryData).forEach((folderSounds) => {
          if (Array.isArray(folderSounds)) {
            allSounds.push(...folderSounds);
          }
        });
        return allSounds;
      }

      return [];
    } catch {
      throw new Error(`BrowserService: Failed to get sounds by category - ${error}`);
    }
  }

  /**
   * Add custom sound to library
   */
  addCustomSound(
    category: string,
    folder: string | null,
    sound: SoundItem
  ): void {
    try {
      if (!this.validateSoundItem(sound)) {
        throw new Error('BrowserService: Invalid sound item');
      }

      const categoryData = this.soundLibrary[category as keyof SoundLibrary];

      if (category === 'plugins') {
        if (Array.isArray(categoryData)) {
          categoryData.push(sound);
        }
      } else if (categoryData && typeof categoryData === 'object' && !Array.isArray(categoryData)) {
        if (folder) {
          const folderData = categoryData as { [key: string]: SoundItem[] };
          if (!folderData[folder]) {
            folderData[folder] = [];
          }
          const folderArray = folderData[folder];
          if (folderArray) {
            folderArray.push(sound);
          }
        }
      }
    } catch {
      throw new Error(`BrowserService: Failed to add custom sound - ${error}`);
    }
  }

  /**
   * Get 909 Techno Pack samples organized by category
   */
  private get909TechnoPackSamples(): Record<string, SoundItem[]> {
    if (!this.samplePackBank || !this.samplePackBank.isInitialized()) {
      return {};
    }

    const samples: Record<string, SoundItem[]> = {};
    const categories = this.samplePackBank.getCategories();

    for (const category of categories) {
      samples[category] = this.samplePackBank.getSamplesByCategory(category);
    }

    return samples;
  }

  /**
   * Get sample pack bank instance
   */
  getSamplePackBank(): SamplePackBank | null {
    return this.samplePackBank;
  }
}

