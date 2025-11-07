<!-- d08e06ee-f7b2-4dbb-b80a-e53c1809f711 08157417-5912-406c-ad05-c63ad80bc7b4 -->
# FL Studio Workflow UX Implementation Plan

## Overview

Implement FL Studio's comprehensive workflow UX including keyboard shortcuts, mouse interactions, window management, visual feedback systems, and workflow enhancements to create a professional DAW experience.

## Current State Analysis

- Basic keyboard shortcuts exist (F5-F10, Space, Ctrl+S/Z/Y) in `app.js` and `New folder/app.js`
- Context menu system exists in `src/ui/ContextMenu.js` but needs enhancement
- React/TypeScript architecture with hooks in `src/components/FLStudioApp.tsx`
- No comprehensive keyboard shortcut management system
- Limited mouse interaction support (basic click handlers)
- No window management system for floating/detachable panels
- Missing hint panels and advanced visual feedback

## Implementation Strategy

### 1. Keyboard Shortcuts System

**Files to create/modify:**

- `src/services/KeyboardShortcutService.ts` - Centralized shortcut management
- `src/hooks/useKeyboardShortcuts.tsx` - React hook for shortcuts
- `src/types/shortcuts.d.ts` - Type definitions for shortcuts

**Features:**

- Navigation shortcuts (F5-F10 for window toggling)
- Editing shortcuts (Ctrl+C/V/X, Ctrl+Z/Y, Ctrl+A, Ctrl+D for duplicate)
- Playback controls (Space, L for pattern/song mode toggle)
- Tool switching (1-9 number keys for tools)
- Customizable shortcut mapping with user preferences
- Context-aware shortcuts (different in Piano Roll vs Playlist)
- Shortcut conflict detection and resolution

### 2. Mouse Interactions System

**Files to create/modify:**

- `src/services/MouseInteractionService.ts` - Mouse gesture and interaction handler
- `src/hooks/useMouseInteractions.tsx` - React hook for mouse events
- Enhance `src/ui/ContextMenu.js` → `src/ui/ContextMenu.tsx` with TypeScript

**Features:**

- Right-click context menus for all interactive elements
- Channel Rack: Track options, pattern operations, channel settings
- Piano Roll: Note editing, quantization, velocity editing
- Playlist: Clip operations, automation creation
- Mixer: Effect chain, routing, automation
- Scroll wheel interactions:
- Ctrl+Scroll: Zoom in/out (Piano Roll, Playlist)
- Scroll on faders/knobs: Adjust values
- Scroll on timeline: Horizontal scrolling
- Middle mouse button:
- Click+hold: Pan view (Piano Roll, Playlist)
- Click: Quick tool switching menu
- Drag & drop:
- Drag notes in Piano Roll
- Drag clips in Playlist
- Drag samples from Browser to Channel Rack
- Drag effects from Browser to Mixer slots

### 3. Window Management System

**Files to create/modify:**

- `src/services/WindowManagerService.ts` - Window state and layout management
- `src/hooks/useWindowManager.tsx` - React hook for window management
- `src/components/windows/` - Detachable window components
- `src/types/windows.d.ts` - Window type definitions

**Features:**

- Floating/detachable windows for all main panels
- Window docking system (dock to edges, tabbed groups)
- Multi-monitor support (detach to separate displays)
- Window state persistence (save/restore layouts)
- Quick window toggle (F5-F10) with show/hide behavior
- Window focus management and z-index handling

### 4. Visual Feedback Systems

**Files to create/modify:**

- `src/ui/HintPanel.tsx` - Hint panel component (shows control info on hover)
- `src/ui/Tooltip.tsx` - Enhanced tooltip system (already exists, enhance)
- `src/services/VisualFeedbackService.ts` - Centralized feedback management

**Features:**

- Hint panel: Shows control name, description, current value, and range on hover
- Ghost notes in Piano Roll (show notes from other channels)
- Visual feedback for:
- Active tool indicator
- Selection highlighting
- Automation curve preview
- Real-time parameter values
- Status indicators (LED-style dots for audio engine, CPU, memory)

### 5. Workflow Enhancements

**Files to create/modify:**

- `src/services/ToolManagerService.ts` - Tool switching and management
- `src/hooks/useTools.tsx` - Tool state management
- Enhance `src/pianoRoll/PianoRollEditor.js` with ghost notes
- `src/services/AutomationService.ts` - Automation clip creation workflow

**Features:**

- Tool switching system:
- Draw tool (default)
- Paint tool (brush mode)
- Select tool (marquee selection)
- Slip tool (time-stretch)
- Delete tool
- Mute tool
- Slice tool
- Pattern/Song mode toggle (L key)
- Ghost notes in Piano Roll (show notes from other channels with transparency)
- Quick automation creation (right-click parameter → "Create automation clip")
- Arpeggiator integration
- Quantize tool with grid alignment

### 6. Integration Points

**Files to modify:**

- `src/components/FLStudioApp.tsx` - Integrate all new hooks and services
- `src/hooks/usePlayback.tsx` - Add pattern/song mode support
- `src/hooks/useTracks.tsx` - Add context menu support
- `src/hooks/usePlaylist.tsx` - Add drag & drop, tool support
- `src/hooks/useMixer.tsx` - Add context menus, automation creation

## Implementation Order

1. **Phase 1: Core Infrastructure**

- Keyboard shortcut service and hook
- Mouse interaction service and hook
- Enhanced context menu system

2. **Phase 2: Window Management**

- Window manager service
- Detachable window components
- Layout persistence

3. **Phase 3: Visual Feedback**

- Hint panel component
- Enhanced tooltips
- Ghost notes in Piano Roll

4. **Phase 4: Workflow Features**

- Tool switching system
- Pattern/Song mode toggle
- Automation workflow enhancements

5. **Phase 5: Polish & Integration**

- Integrate all systems into main app
- User preferences for shortcuts and layouts
- Comprehensive testing

## Technical Considerations

- All new code must be strict TypeScript with explicit types
- Follow existing React hooks pattern
- Use modular architecture (services + hooks + components)
- Maintain accessibility (keyboard navigation, ARIA labels)
- Performance: Debounce scroll events, throttle mouse move handlers
- Error handling: Comprehensive try-catch with custom error types
- Testing: Unit tests for services, integration tests for hooks

### To-dos

- [ ] Create KeyboardShortcutService.ts with centralized shortcut management, conflict detection, and customizable mapping
- [ ] Create useKeyboardShortcuts.tsx hook to integrate shortcuts into React components
- [ ] Create MouseInteractionService.ts for scroll wheel, middle mouse, and drag & drop handling
- [ ] Convert ContextMenu.js to TypeScript and enhance with context-aware menus for all panels
- [ ] Create WindowManagerService.ts for floating/detachable windows, docking, and layout persistence
- [ ] Create detachable window components in src/components/windows/ for all main panels
- [ ] Create HintPanel.tsx component to show control information on hover with current values
- [ ] Implement ghost notes feature in PianoRollEditor to show notes from other channels
- [ ] Create ToolManagerService.ts for tool switching (draw, paint, select, slip, delete, mute, slice)
- [ ] Add pattern/song mode toggle (L key) to usePlayback hook and transport controls
- [ ] Enhance automation creation workflow with right-click context menu integration
- [ ] Integrate all new systems into FLStudioApp.tsx and ensure proper coordination between services
- [ ] Add user preferences system for custom keyboard shortcuts and window layouts