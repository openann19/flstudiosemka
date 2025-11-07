/**
 * BrowserWindow - File browser window with search, preview, and drag & drop
 * Implements FL Studio-style browser with categories, favorites, and audio preview
 * @module components/windows/BrowserWindow
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useHintPanel } from '../ui/HintPanel';
import { useContextMenu } from '../../hooks/useContextMenu';
import { contextMenuService } from '../../services/ContextMenuService';
import type { SoundItem, SoundLibrary, TrackType } from '../../types/FLStudio.types';
import type { SamplePackBank } from '../../audio/drums/SamplePackBank';

/**
 * BrowserWindow component props
 */
export interface BrowserWindowProps {
  soundLibrary?: SoundLibrary;
  onLoadSound?: (sound: SoundItem) => void;
  samplePackBank?: SamplePackBank | null;
  audioContext?: AudioContext | null;
  onEditDrum?: (sound: SoundItem) => void;
}

/**
 * Browser category
 */
type BrowserCategory = 'all' | 'drums' | 'synths' | 'samples' | 'presets' | 'projects';

/**
 * Browser window component
 */
export function BrowserWindow({ 
  soundLibrary, 
  onLoadSound,
  samplePackBank,
  audioContext,
  onEditDrum,
}: BrowserWindowProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<BrowserCategory>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<SoundItem | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [sampleMetadata, setSampleMetadata] = useState<{ duration: string; sampleRate: string; bitDepth: string } | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const hintPanel = useHintPanel();
  const contextMenu = useContextMenu();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const soundItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  /**
   * Get filtered sounds
   */
  const getFilteredSounds = useCallback((): SoundItem[] => {
    if (!soundLibrary) {
      return [];
    }

    let allSounds: SoundItem[] = [];

    // Collect sounds based on selected category and folder
    if (selectedCategory === 'samples' && selectedFolder) {
      const folderSounds = soundLibrary.samples?.[selectedFolder];
      if (folderSounds) {
        allSounds = folderSounds;
      }
    } else if (selectedCategory === 'presets' && selectedFolder) {
      const folderPresets = soundLibrary.presets?.[selectedFolder];
      if (folderPresets) {
        allSounds = folderPresets;
      }
    } else {
      // Collect all sounds
      Object.values(soundLibrary.presets || {}).forEach((presets) => {
        allSounds = allSounds.concat(presets);
      });
      Object.values(soundLibrary.samples || {}).forEach((samples) => {
        allSounds = allSounds.concat(samples);
      });
      allSounds = allSounds.concat(soundLibrary.plugins || []);
    }

    // Filter by category
    if (selectedCategory !== 'all' && !selectedFolder) {
      const categoryMap: Record<BrowserCategory, TrackType[]> = {
        all: [],
        drums: ['drum'],
        synths: ['synth'],
        samples: ['sample'],
        presets: [],
        projects: [],
      };

      const allowedTypes = categoryMap[selectedCategory];
      if (allowedTypes.length > 0) {
        allSounds = allSounds.filter((sound) => allowedTypes.includes(sound.type));
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      allSounds = allSounds.filter(
        (sound) =>
          sound.name.toLowerCase().includes(query) ||
          sound.type.toLowerCase().includes(query) ||
          sound.icon?.toLowerCase().includes(query)
      );
    }

    return allSounds;
  }, [soundLibrary, selectedCategory, selectedFolder, searchQuery]);

  /**
   * Get folder structure for file tree
   */
  const getFolderStructure = useCallback((): Record<string, string[]> => {
    if (!soundLibrary) {
      return {};
    }

    const folders: Record<string, string[]> = {};

    if (selectedCategory === 'samples' || selectedCategory === 'all') {
      Object.keys(soundLibrary.samples || {}).forEach((folder) => {
        if (!folders.samples) {
          folders.samples = [];
        }
        folders.samples.push(folder);
      });
    }

    if (selectedCategory === 'presets' || selectedCategory === 'all') {
      Object.keys(soundLibrary.presets || {}).forEach((folder) => {
        if (!folders.presets) {
          folders.presets = [];
        }
        folders.presets.push(folder);
      });
    }

    return folders;
  }, [soundLibrary, selectedCategory]);

  /**
   * Toggle favorite
   */
  const toggleFavorite = useCallback((itemName: string): void => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(itemName)) {
        next.delete(itemName);
      } else {
        next.add(itemName);
      }
      return next;
    });
  }, []);

  /**
   * Handle item click
   */
  const handleItemClick = useCallback(
    (item: SoundItem): void => {
      setSelectedItem(item);
      if (onLoadSound) {
        onLoadSound(item);
      }
    },
    [onLoadSound]
  );

  /**
   * Handle item drag start
   */
  const handleItemDragStart = useCallback((e: React.DragEvent, item: SoundItem): void => {
    e.dataTransfer.setData('application/fl-studio-sound', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  /**
   * Preview audio
   */
  const previewSound = useCallback(
    async (item: SoundItem): Promise<void> => {
      // Stop any existing preview
      if (previewSourceRef.current) {
        try {
          previewSourceRef.current.stop();
        } catch {
          // Already stopped
        }
        previewSourceRef.current = null;
      }

      // Stop any existing HTML audio preview (if needed in future)

      setSelectedItem(item);
      setIsPreviewing(false);
      setSampleMetadata(null);

      // Try to load from SamplePackBank
      if (samplePackBank && audioContext && item.type === 'sample') {
        try {
          // Find the sample in the sample pack bank
          const categories = samplePackBank.getCategories();
          let buffer: AudioBuffer | null = null;

          for (const category of categories) {
            const found = samplePackBank.getSample(item.name, category);
            if (found) {
              buffer = found;
              break;
            }
          }

          if (buffer) {
            // Play the sample
            const source = audioContext.createBufferSource();
            const gainNode = audioContext.createGain();
            
            source.buffer = buffer;
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.value = 0.7;
            
            source.onended = (): void => {
              setIsPreviewing(false);
              previewSourceRef.current = null;
            };

            source.start(0);
            previewSourceRef.current = source;
            setIsPreviewing(true);

            // Set metadata
            const duration = buffer.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            setSampleMetadata({
              duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
              sampleRate: `${buffer.sampleRate} Hz`,
              bitDepth: '16-bit',
            });
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[DEBUG] BrowserWindow: Failed to preview sample', error);
        }
      }
    },
    [samplePackBank, audioContext]
  );

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = e.target.files;
      if (!files || files.length === 0 || !audioContext) {
        return;
      }

      try {
        // Import FileUploadService dynamically
        const { FileUploadService } = await import('../../services/FileUploadService');
        const uploadService = new FileUploadService({ audioContext });

        // Process files
        const results = await uploadService.processFiles(Array.from(files));

        // Add to sound library
        // Note: This would require an onSoundLibraryUpdate callback prop
        // to properly update the parent's sound library state
        // For now, we'll just process the files without updating the library
        // Files are processed and can be used, but library update
        // should be handled by parent component via callback
        if (results.length > 0) {
          // Files uploaded successfully
        }
      } catch (error) {
        // Handle error - could show user notification
        if (error instanceof Error) {
          // Error handling
        }
      }
    },
    [audioContext]
  );

  const filteredSounds = getFilteredSounds();

  /**
   * Setup context menu for sound items
   */
  useEffect(() => {
    soundItemRefs.current.forEach((element, soundKey) => {
      const sound = filteredSounds.find((s, idx) => `${s.name}-${idx}` === soundKey);
      if (!sound) return;

      const is909Sample = samplePackBank && sound.type === 'sample' && samplePackBank.getSample(sound.name, selectedFolder || '') !== null;
      
      if (is909Sample && onEditDrum) {
        const menuItems = contextMenuService.getBrowserSoundMenu({
          onEdit: () => {
            onEditDrum(sound);
          },
          onPreview: () => {
            previewSound(sound);
          },
          onAddToFavorites: () => {
            toggleFavorite(sound.name);
          },
          onRemoveFromFavorites: () => {
            toggleFavorite(sound.name);
          },
          isFavorite: favorites.has(sound.name),
        });
        contextMenu.attach(element, menuItems);
      }
    });

    return () => {
      soundItemRefs.current.forEach((element) => {
        contextMenu.detach(element);
      });
    };
  }, [filteredSounds, samplePackBank, selectedFolder, onEditDrum, contextMenu, favorites, previewSound, toggleFavorite]);

  return (
    <div
      className="browser-window"
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--fl-bg-dark)',
        overflow: 'hidden',
      }}
    >
      {/* Left Panel - Categories and File Tree */}
      <div
        style={{
          width: '200px',
          borderRight: '1px solid var(--fl-border-dark)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--fl-bg-darker)',
        }}
      >
        {/* Search */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--fl-border-dark)',
          }}
        >
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 8px',
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* File Tree - Categories and Folders */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '4px 0',
          }}
        >
          {(['all', 'drums', 'synths', 'samples', 'presets', 'projects'] as BrowserCategory[]).map((category) => {
            const isSelected = selectedCategory === category;
            const folders = getFolderStructure();
            const categoryFolders = folders[category] || [];

            return (
              <div key={category}>
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedFolder(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: isSelected && !selectedFolder ? 'var(--fl-bg-dark)' : 'transparent',
                    border: 'none',
                    color: isSelected ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
                    fontSize: '10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {categoryFolders.length > 0 && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        const newExpanded = new Set(expandedFolders);
                        if (newExpanded.has(category)) {
                          newExpanded.delete(category);
                        } else {
                          newExpanded.add(category);
                        }
                        setExpandedFolders(newExpanded);
                      }}
                      style={{
                        fontSize: '8px',
                        cursor: 'pointer',
                        width: '12px',
                        display: 'inline-block',
                      }}
                    >
                      {expandedFolders.has(category) ? '▼' : '▶'}
                    </span>
                  )}
                  {category}
                </button>
                {isSelected && expandedFolders.has(category) && categoryFolders.length > 0 && (
                  <div style={{ paddingLeft: '16px' }}>
                    {categoryFolders.map((folder) => (
                      <button
                        key={folder}
                        onClick={() => {
                          setSelectedFolder(folder);
                        }}
                        style={{
                          width: '100%',
                          padding: '4px 12px',
                          background: selectedFolder === folder ? 'var(--fl-bg-dark)' : 'transparent',
                          border: 'none',
                          color: selectedFolder === folder ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
                          fontSize: '9px',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upload Button */}
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid var(--fl-border-dark)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '6px',
              background: 'var(--fl-bg-dark)',
              border: '1px solid var(--fl-border)',
              color: 'var(--fl-text-primary)',
              fontSize: '10px',
              cursor: 'pointer',
            }}
          >
            Upload Files
          </button>
        </div>
      </div>

      {/* Middle Panel - Sound Grid */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '8px',
            borderBottom: '1px solid var(--fl-border-dark)',
            fontSize: '10px',
            color: 'var(--fl-text-secondary)',
            fontWeight: 600,
          }}
        >
          {selectedCategory.toUpperCase()} ({filteredSounds.length})
        </div>

        {/* Sound Grid */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '8px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '8px',
          }}
        >
          {filteredSounds.map((sound, idx) => {
            const soundKey = `${sound.name}-${idx}`;

            return (
              <div
                key={soundKey}
                ref={(el) => {
                  if (el) {
                    soundItemRefs.current.set(soundKey, el);
                  } else {
                    soundItemRefs.current.delete(soundKey);
                  }
                }}
                draggable
                onDragStart={(e) => handleItemDragStart(e, sound)}
                onClick={() => handleItemClick(sound)}
                onDoubleClick={() => previewSound(sound)}
                style={{
                  padding: '8px',
                  background: selectedItem?.name === sound.name ? 'var(--fl-bg-darker)' : 'var(--fl-bg-dark)',
                  border: `1px solid ${selectedItem?.name === sound.name ? 'var(--fl-orange)' : 'var(--fl-border-dark)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  position: 'relative',
                }}
                onMouseEnter={(e) =>
                  hintPanel.showHint(
                    {
                      name: sound.name,
                      description: sound.type,
                      value: sound.icon,
                    },
                    e.clientX + 10,
                    e.clientY + 10
                  )
                }
                onMouseLeave={() => hintPanel.hideHint()}
              >
              <div
                style={{
                  fontSize: '24px',
                }}
              >
                {sound.icon || '🎵'}
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--fl-text-primary)',
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                }}
                title={sound.name}
              >
                {sound.name}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(sound.name);
                }}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: favorites.has(sound.name) ? '#FFD700' : 'var(--fl-text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title={favorites.has(sound.name) ? 'Remove from favorites' : 'Add to favorites'}
              >
                ★
              </button>
            </div>
            );
          })}

          {filteredSounds.length === 0 && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '32px',
                color: 'var(--fl-text-secondary)',
                fontSize: '11px',
              }}
            >
              No sounds found
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      {selectedItem && (
        <div
          style={{
            width: '250px',
            borderLeft: '1px solid var(--fl-border-dark)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--fl-bg-darker)',
          }}
        >
          {/* Preview Header */}
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid var(--fl-border-dark)',
              fontSize: '10px',
              color: 'var(--fl-text-secondary)',
              fontWeight: 600,
            }}
          >
            PREVIEW
          </div>

          {/* Preview Content */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '48px',
              }}
            >
              {selectedItem.icon || '🎵'}
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--fl-text-primary)',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              {selectedItem.name}
            </div>

            <div
              style={{
                fontSize: '10px',
                color: 'var(--fl-text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              {selectedItem.type}
            </div>

            <button
              onClick={() => previewSound(selectedItem)}
              disabled={isPreviewing}
              style={{
                padding: '8px 16px',
                background: isPreviewing ? 'var(--fl-bg-dark)' : 'var(--fl-orange)',
                border: 'none',
                color: isPreviewing ? 'var(--fl-text-secondary)' : '#000',
                fontSize: '10px',
                fontWeight: 600,
                cursor: isPreviewing ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                opacity: isPreviewing ? 0.6 : 1,
              }}
            >
              {isPreviewing ? '⏸ Playing...' : '▶ Preview'}
            </button>

            <div
              style={{
                width: '100%',
                fontSize: '9px',
                color: 'var(--fl-text-secondary)',
              }}
            >
              <div>Duration: {sampleMetadata?.duration || '--:--'}</div>
              <div>Sample Rate: {sampleMetadata?.sampleRate || '--'}</div>
              <div>Bit Depth: {sampleMetadata?.bitDepth || '--'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

