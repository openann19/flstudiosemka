/**
 * ProjectBrowser - Project browser component
 * Displays project list, templates, and recent projects
 * @module components/ProjectBrowser
 */

import { useState, useCallback } from 'react';
import { useHintPanel } from './ui/HintPanel';

/**
 * Project metadata
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  bpm: number;
  tracks: number;
  date: string;
  thumbnail?: string;
}

/**
 * ProjectBrowser component props
 */
export interface ProjectBrowserProps {
  projects: ProjectMetadata[];
  templates: ProjectMetadata[];
  recentProjects: ProjectMetadata[];
  onProjectSelect: (projectId: string) => void;
  onProjectCreate: (templateId?: string) => void;
  onProjectDelete?: (projectId: string) => void;
}

/**
 * Project browser component
 */
export function ProjectBrowser({
  projects,
  templates,
  recentProjects,
  onProjectSelect,
  onProjectCreate,
  onProjectDelete,
}: ProjectBrowserProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'recent'>('projects');
  const hintPanel = useHintPanel();

  /**
   * Format date
   */
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }, []);

  const currentList = activeTab === 'projects' ? projects : activeTab === 'templates' ? templates : recentProjects;

  return (
    <div
      className="project-browser"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--fl-bg-dark)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        <div
          style={{
            fontSize: '14px',
            color: 'var(--fl-text-primary)',
            fontWeight: 600,
            marginBottom: '8px',
          }}
        >
          Project Browser
        </div>
        <button
          onClick={() => onProjectCreate()}
          style={{
            padding: '8px 16px',
            background: 'var(--fl-orange)',
            border: 'none',
            color: '#000',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            borderRadius: '4px',
          }}
        >
          + New Project
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--fl-border-dark)',
          background: 'var(--fl-bg-darker)',
        }}
      >
        {(['projects', 'templates', 'recent'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'var(--fl-bg-dark)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--fl-orange)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--fl-text-primary)' : 'var(--fl-text-secondary)',
              fontSize: '10px',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Project List */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {currentList.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectSelect(project.id)}
            style={{
              padding: '12px',
              background: 'var(--fl-bg-darker)',
              border: '1px solid var(--fl-border-dark)',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
            onMouseEnter={(e) =>
              hintPanel.showHint(
                {
                  name: project.name,
                  description: `${project.tracks} tracks, ${project.bpm} BPM`,
                  value: formatDate(project.date),
                },
                e.clientX + 10,
                e.clientY + 10
              )
            }
            onMouseLeave={() => hintPanel.hideHint()}
          >
            {/* Thumbnail */}
            <div
              style={{
                width: '100%',
                height: '120px',
                background: 'var(--fl-bg-dark)',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: 'var(--fl-text-secondary)',
              }}
            >
              {project.thumbnail || '🎵'}
            </div>

            {/* Project Info */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--fl-text-primary)',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}
              >
                {project.name}
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--fl-text-secondary)',
                }}
              >
                {project.tracks} tracks • {project.bpm} BPM
              </div>
              <div
                style={{
                  fontSize: '9px',
                  color: 'var(--fl-text-secondary)',
                }}
              >
                {formatDate(project.date)}
              </div>
            </div>

            {/* Delete Button */}
            {onProjectDelete && activeTab === 'projects' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectDelete(project.id);
                }}
                style={{
                  padding: '4px 8px',
                  background: 'var(--fl-bg-dark)',
                  border: '1px solid var(--fl-border)',
                  color: 'var(--fl-text-secondary)',
                  fontSize: '9px',
                  cursor: 'pointer',
                  alignSelf: 'flex-start',
                }}
              >
                Delete
              </button>
            )}
          </div>
        ))}

        {currentList.length === 0 && (
          <div
            style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '32px',
              color: 'var(--fl-text-secondary)',
              fontSize: '11px',
            }}
          >
            No {activeTab} found
          </div>
        )}
      </div>
    </div>
  );
}

