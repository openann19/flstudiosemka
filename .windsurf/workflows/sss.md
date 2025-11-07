---
description: sss
auto_execution_mode: 3
---

A pixel-perfect recreation of FL Studio's iconic digital audio workstation interface, delivering professional music production tools through an authentic, no-compromise UI that matches the real application's look and feel.

Experience Qualities:
1. Authentic - Exact recreation of FL Studio's visual design language with gray metal panels, orange accent colors, beveled buttons, and characteristic spacing
2. Professional - Industry-standard workflow and control layout that professional producers instantly recognize and can use efficiently
3. Precise - Tight, compact interface with minimal wasted space, professional-grade step sequencer, and accurate visual feedback

Complexity Level: Complex Application (professional-grade DAW)
  - Full-featured music production environment with FL Studio's signature Channel Rack step sequencer, pattern-based workflow, multi-track support, real-time audio synthesis, effects processing, and project management

## Essential Features

### FL Studio Channel Rack
- Functionality: Classic FL Studio step sequencer grid showing all instruments vertically with 16 steps horizontally, immediate visual feedback with orange glow on active steps, mute buttons per channel, compact efficient layout
- Purpose: FL Studio's signature pattern creation workflow where all tracks are visible simultaneously for fast composition
- Trigger: Default view on app load, showing complete pattern overview
- Progression: View all tracks → Click steps to activate → See orange glow → Steps pulse on playback → Quick mute channels → Build patterns efficiently
- Success criteria: Exact FL Studio visual match, instant step activation, smooth playback animation, familiar controls for FL Studio users

### Authentic FL Studio UI Design
- Functionality: Gray gradient panels with subtle bevels, orange (#E86C2B) active states, dark gray backgrounds, compact toolbar buttons, metal-style separators, professional typography
- Purpose: Provide the exact look and feel of FL Studio that producers know and trust
- Trigger: Entire application visual design
- Progression: User opens app → Instantly recognizes FL Studio interface → Feels at home → Navigates with muscle memory
- Success criteria: Indistinguishable from real FL Studio screenshots, correct color palette, proper button styles, authentic spacing

### Transport Controls
- Functionality: Classic play/pause/stop/record buttons with FL Studio styling, BPM control with spinner buttons, pattern selector, time display
- Purpose: Standard DAW transport matching FL Studio's exact layout and appearance
- Trigger: Always visible in dedicated transport bar below header
- Progression: Click play → Button glows orange → Music starts → BPM adjustable with arrows → Time updates
- Success criteria: Buttons match FL Studio style exactly, orange glow on play, smooth BPM adjustment, accurate timing

### Step Sequencer Grid
- Functionality: 16-step grid per track with FL Studio's distinctive 3D beveled step buttons, inactive (dark gray recessed), active (orange gradient raised), current step pulse animation
- Purpose: Iconic FL Studio step programming interface
- Trigger: Default Channel Rack view
- Progression: Click step → Button raises with orange glow → Playback hits step → Pulse animation → Visual and audio feedback
- Success criteria: Perfect button bevel reproduction, exact orange color (#E86C2B), smooth animations, satisfying click feedback
thedeviltwin DramaBoy, [7.11.2025 г. 2:39]
### Professional Audio Engine
- Functionality: Real-time Web Audio synthesis for drums and melodic instruments, accurate timing based on BPM, track effects (volume, pan, mute, solo)
- Purpose: Professional-quality sound generation and playback
- Trigger: Play button or space bar
- Progression: Start playback → Audio context initializes → Sounds trigger on steps → Smooth looping → Effects applied in real-time
- Success criteria: Zero audio glitches, perfect timing, smooth 16-step loops, professional sound quality

### Project Management
- Functionality: Save/load projects to persistent storage, auto-save every 30 seconds, project browser, export functionality
- Purpose: Reliable project workflow with no data loss
- Trigger: Save button, auto-save timer, projects dialog
- Progression: Create pattern → Auto-saves → Browse projects → Load instantly → Continue working
- Success criteria: Never lose work, instant saves, fast loading, reliable storage

### Track Management
- Functionality: Add new drum or synth tracks, mute/solo controls matching FL Studio's green LED style, delete tracks, rename instruments
- Purpose: Manage multiple instruments in a pattern
- Trigger: Add track button in Channel Rack
- Progression: Click add → New track appears → Click mute LED → Track silenced → Build complex arrangements
- Success criteria: FL Studio-style LED indicators, instant mute/solo, smooth track adding

## Edge Case Handling
- Audio context suspended: Toast notification prompting user to click play to initialize audio
- Browser compatibility: Works best in Chrome/Edge with Web Audio API support
- Many tracks: Virtual scrolling in Channel Rack maintains performance
- Fast clicking: Debounced to prevent audio glitches while remaining responsive
- Project corruption: Validation and fallback to default project
- Rapid BPM changes: Smooth tempo transitions without audio artifacts

## Design Direction
The interface must be an exact visual recreation of FL Studio - industrial gray metal panels with subtle gradients, orange (#E86C2B) for all active/selected states, dark backgrounds, compact spacing, beveled 3D buttons, and professional typography. Every pixel should match the real application.

## Color Selection
FL Studio's authentic color palette - industrial grays with signature orange accents

- Primary Color: FL Orange (oklch(0.65 0.19 45)) - All active states, lit buttons, selected items, playback indicators
- Secondary Colors: 
  - Panel Gray (oklch(0.35 0.01 264)) for main panels
  - Dark Gray (oklch(0.28 0.01 264)) for backgrounds
  - Light Gray (oklch(0.42 0.01 264)) for raised elements
- Accent Color: FL Green (oklch(0.70 0.22 135)) for mute LEDs and success states
- Foreground/Background Pairings:
  - Background (oklch(0.30 0.01 264)): Light text (oklch(0.95 0 0)) - Ratio 14.2:1 ✓
  - Panel (oklch(0.35 0.01 264)): Light text (oklch(0.95 0 0)) - Ratio 12.8:1 ✓
  - Primary Orange (oklch(0.65 0.19 45)): Dark text (oklch(0.15 0 0)) - Ratio 8.9:1 ✓
  - Muted (oklch(0.25 0.01 264)): Mid text (oklch(0.60 0 0)) - Ratio 4.8:1 ✓

## Font Selection
System fonts matching FL Studio's utilitarian approach - Segoe UI for Windows-style UI consistency

- Typographic Hierarchy:
  - H1 (Branding): Bold/14px/wide tracking - "FL STUDIO"
  - H2 (Section Headers): Bold/12px - Panel titles
  - Body (Controls): Regular/11px - Default UI text
  - Mono (Values): Courier New/11px - BPM, timing values
  - Micro (Labels): Bold/10px/wide - Small caps labels

## Animations
Subtle, professional animations matching FL Studio's efficient style - no unnecessary flourish

thedeviltwin DramaBoy, [7.11.2025 г. 2:39]
- Purposeful Meaning: 
  - Active steps glow orange immediately on click
  - Current playback step pulses smoothly
  - Buttons have subtle press states
  - LED indicators snap on/off crisply
  - Minimal motion, maximum clarity
- Hierarchy of Movement: 
  - Critical: Playback position (smooth 60fps)
  - High: Step activation (instant visual feedback)
  - Medium: Button presses (50ms subtle press)
  - Low: Hover states (minimal glow change)

## Component Selection
- Components: 
  - Custom FL-style buttons with beveled gradients and press states
  - Channel Rack grid with 3D step buttons
  - Transport controls with orange active states
  - Custom scrollbars matching FL Studio
  - Panel system with authentic gray gradients
  - LED-style mute/solo indicators
  - Spinner controls for numeric values
- Customizations: 
  - .fl-panel - gradient panel background
  - .fl-button - 3D beveled button
  - .fl-button-active - orange glow active state
  - .fl-step-inactive - dark recessed step
  - .fl-step-active - orange raised step
  - .fl-step-current - pulsing playback indicator
  - .fl-track-header - channel name area
  - .fl-scrollbar - custom scrollbar styling
- States: 
  - Steps: inactive (dark recessed), active (orange raised), current (pulsing)
  - Buttons: default (gray gradient), hover (lighter), active (pressed), selected (orange glow)
  - Tracks: normal, muted (dimmed), playing (animated)
  - Transport: stopped, playing (orange glow), paused
- Icon Selection: 
  - Phosphor Icons for all UI elements
  - Play/Pause/Stop/Record for transport
  - Plus for adding tracks
  - Folder/Save icons for file operations
  - Gear for settings
  - LED-style circles for mute/solo
- Spacing: 
  - Minimal: 2px between steps for tight grid
  - Small: 4-8px within controls
  - Medium: 12px between sections
  - Compact throughout to match FL Studio density
- Mobile: 
  - Responsive at 768px breakpoint
  - Channel Rack becomes scrollable horizontally
  - Transport controls remain accessible
  - Touch targets 44px minimum
  - Pinch to zoom on step grid

Experience Qualities:
1. Luxurious & Refined - Ultra-smooth animations with spring physics, subtle hover effects, and micro-interactions that communicate premium quality and meticulous attention to detail
2. Intuitive Power - Complex professional features presented through clear visual hierarchy with smooth state transitions, contextual controls that appear when needed, and progressive disclosure that guides users naturally
3. Immersive & Responsive - Seamless audio-visual integration with buttery 60fps animations, zero-latency visual feedback, satisfying tactile interactions, and elegant loading states that maintain flow

Complexity Level: Complex Application (professional-grade production environment)
  - Advanced synthesis engine with waveform morphing, multi-mode filters with envelope control, stereo effects chains, AI-powered pattern generation, smart quantization, automation recording, stem export, collaborative sharing, and intelligent mixing suggestions representing a cloud-native professional DAW with FL Studio-style modular layout featuring Browser, Mixer, Playlist, Channel Rack, and Pattern Editor views

## Essential Features

thedeviltwin DramaBoy, [7.11.2025 г. 2:39]
### FL Studio-Style Modular Layout
- Functionality: Professional multi-view workspace with Browser (sound library & presets), Channel Rack (quick step sequencer), Playlist (arrangement timeline), Mixer (multi-track mixing console), and Pattern Editor (detailed note editing); collapsible panels with memory of user preferences, smooth view transitions, independent scrolling per panel
- Purpose: Provide industry-standard workflow familiar to professional producers, maximize screen real estate, enable multiple simultaneous workflows
- Trigger: Tab buttons in top toolbar, panel collapse buttons, keyboard shortcuts (F5-F9)
- Progression: Select view tab → Panel slides in with fade → Previous state restored → Work in view → Switch seamlessly → Layout preferences auto-save
- Success criteria: Zero layout shift flicker, smooth 60fps transitions, instant panel switching (<100ms), state persistence across sessions, responsive at all screen sizes

### Browser Panel (Sound Library)
- Functionality: Hierarchical folder-based organization (Presets/Samples/Plugins), search with tag filtering, expandable categories, drag-to-add sounds to tracks, visual icons for sound types, favorites system, AI-powered sound suggestions
- Purpose: Quick access to all available sounds and instruments for composition
- Trigger: Browser tab in left panel, searchable and filterable
- Progression: Open browser → Browse/search → Preview sound → Drag to channel rack or double-click → Track created automatically
- Success criteria: Search returns results instantly, categories expand smoothly, drag-drop feels natural, preview plays immediate