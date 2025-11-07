/**
 * ProjectExporter - Export project in various formats
 * Handles project, stems, MIDI, and audio export
 */
class ProjectExporter {
  constructor(audioContext, project) {
    this.audioContext = audioContext;
    this.project = project;
    this.renderer = new AudioRenderer(audioContext);
  }

  /**
   * Export project as JSON
   * @param {string} filename - Filename
   */
  exportProject(filename = 'project.json') {
    const data = JSON.stringify(this.project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export individual track stems
   * @param {Array} trackIds - Track IDs to export (empty = all)
   * @param {boolean} withEffects - Include effects
   * @returns {Promise<Array>} Array of {trackId, buffer}
   */
  async exportStems(trackIds = [], withEffects = true) {
    const tracks = trackIds.length > 0
      ? this.project.tracks.filter(t => trackIds.includes(t.id))
      : this.project.tracks;

    const stems = [];

    for (const track of tracks) {
      const buffer = await this._renderTrack(track, withEffects);
      stems.push({
        trackId: track.id,
        trackName: track.name,
        buffer
      });
    }

    return stems;
  }

  /**
   * Export stems as WAV files
   * @param {Array} trackIds - Track IDs to export
   * @param {boolean} withEffects - Include effects
   */
  async exportStemsAsWAV(trackIds = [], withEffects = true) {
    const stems = await this.exportStems(trackIds, withEffects);
    
    stems.forEach(({ trackId, trackName, buffer }) => {
      const filename = `${trackName || trackId}.wav`;
      this.renderer.exportWAV(buffer, filename);
    });
  }

  /**
   * Export MIDI
   * @param {string} filename - Filename
   */
  exportMIDI(filename = 'project.mid') {
    // MIDI export would require MIDI file format encoding
    // This is a placeholder - actual implementation would need MIDI library
    console.warn('MIDI export not yet implemented');
  }

  /**
   * Export full mix as audio
   * @param {string} filename - Filename
   * @param {string} format - Format ('wav' or 'mp3')
   * @param {boolean} withEffects - Include effects
   */
  async exportAudio(filename = 'mix.wav', format = 'wav', withEffects = true) {
    const duration = this.project.duration || 60;
    const buffer = await this.renderer.renderProject(this.project, 0, duration);

    if (format === 'mp3') {
      await this.renderer.exportMP3(buffer, filename);
    } else {
      this.renderer.exportWAV(buffer, filename);
    }
  }

  /**
   * Render single track
   * @private
   */
  async _renderTrack(track, withEffects) {
    // This would render a single track with or without effects
    // Implementation depends on project structure
    const duration = track.duration || 60;
    
    return await this.renderer.render(async (offlineContext) => {
      // Set up track audio graph
      const trackGain = offlineContext.createGain();
      trackGain.connect(offlineContext.destination);
      
      // Render track audio
      // This would play back track's audio clips, patterns, etc.
      
    }, duration);
  }

  /**
   * Export audio without effects
   * @param {string} filename - Filename
   */
  async exportAudioDry(filename = 'mix-dry.wav') {
    await this.exportAudio(filename, 'wav', false);
  }

  /**
   * Batch export options
   * @param {Object} options - Export options
   */
  async batchExport(options = {}) {
    const {
      stems = false,
      stemsWithEffects = true,
      fullMix = true,
      fullMixFormat = 'wav',
      projectJSON = false
    } = options;

    if (projectJSON) {
      this.exportProject('project.json');
    }

    if (stems) {
      await this.exportStemsAsWAV([], stemsWithEffects);
    }

    if (fullMix) {
      await this.exportAudio('mix.wav', fullMixFormat, true);
    }
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProjectExporter };
}

// Export to window for browser
if (typeof window !== 'undefined') {
  window.ProjectExporter = ProjectExporter;
}

