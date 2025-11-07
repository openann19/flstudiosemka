# 🎹 Channel Settings Window - Ultra Professional Mode

## Overview
A complete FL Studio-style channel settings window that opens when you click on any track's icon or name. Features 7 comprehensive tabs with professional parameter controls and real-time visual feedback.

## How to Open
**Click on any track's icon (🎵/🥁) or track name** in the Channel Rack to open the full Channel Settings window.

## Window Features

### 🎨 Professional UI
- **Backdrop blur overlay** - Smooth, modern modal with blur effect
- **FL Studio theme** - Orange gradients (#FF7800), dark backgrounds
- **Smooth animations** - Window slide-up entrance, tab fade transitions
- **Draggable header** - Orange gradient header with track icon and name
- **Quick close** - Click X button, click outside overlay, or press **Esc**

### 📑 Seven Complete Tabs

#### 🎹 **1. INSTRUMENT Tab**
- **Waveform Selector** - Visual buttons for Sine (∿), Sawtooth (⩘), Square (⊓), Triangle (△)
- **Tuning Section**:
  - Coarse Pitch (-24 to +24 semitones)
  - Fine Tune (-100 to +100 cents)
  - Unison Voices (1-7 voices for thick sound)
  - Unison Detune (0-50 cents between voices)
- **Mixing Section**:
  - Volume (0-200%)
  - Pan (L 100% - Center - R 100%)

#### 📊 **2. ENVELOPE Tab**
- **Visual Canvas** - Real-time ADSR curve visualization
- **ADSR Controls**:
  - Attack (0-2000ms) - Time to reach peak
  - Decay (0-2000ms) - Time to reach sustain level
  - Sustain (0-100%) - Held amplitude level
  - Release (0-3000ms) - Fade-out time
- **Envelope Modulation**:
  - Attack Tension (-100 to +100) - Curve shape
  - Decay Tension (-100 to +100) - Curve shape
- **Live Visualization** - Canvas updates as you adjust parameters

#### 🎚 **3. FILTER Tab**
- **Filter Type Dropdown**:
  - Low Pass (default) - Removes high frequencies
  - High Pass - Removes low frequencies
  - Band Pass - Isolates frequency range
  - Notch - Removes specific frequency
  - All Pass - Phase manipulation
  - Peaking - Boost/cut specific frequency
  - Low Shelf - Boost/cut all lows
  - High Shelf - Boost/cut all highs
- **Filter Parameters**:
  - Cutoff (20-20,000 Hz) - Center frequency
  - Resonance (0.1-20 Q) - Emphasis at cutoff
  - Gain (-24 to +24 dB) - For shelf/peaking filters
- **Filter Envelope**:
  - Envelope Amount (-100 to +100) - Cutoff modulation
  - Velocity Amount (0-100) - Velocity sensitivity

#### 〰️ **4. LFO Tab**
- **LFO 1 Settings**:
  - Shape (Sine, Triangle, Square, Sawtooth, Random S&H)
  - Rate (0.1-20 Hz) - Modulation speed
  - Depth (0-100%) - Modulation intensity
  - Phase (0-360°) - Starting position
- **Modulation Destinations**:
  - → Pitch Amount (-100 to +100) - Vibrato
  - → Filter Amount (-100 to +100) - Wah effect
  - → Volume Amount (0-100) - Tremolo
  - → Pan Amount (0-100) - Auto-pan

#### ✨ **5. FX Tab**
- **FX Sends**:
  - Reverb Send (0-100%) - Spatial depth
  - Delay Send (0-100%) - Echo effect
  - Chorus Send (0-100%) - Thickening
  - Distortion (0-100%) - Saturation/drive
- **3-Band EQ**:
  - Low (100Hz) - Bass control (-12 to +12 dB)
  - Mid (1kHz) - Body control (-12 to +12 dB)
  - High (8kHz) - Brightness control (-12 to +12 dB)

#### 🎼 **6. ARPEGGIATOR Tab**
- **Arp Enable Toggle** - On/off switch with animation
- **Pattern Selector**:
  - Up - Ascending notes
  - Down - Descending notes
  - Up/Down - Bouncing pattern
  - Random - Unpredictable sequence
  - Chord - All notes together
- **Timing**:
  - Rate (1/4, 1/8, 1/16, 1/32 notes)
  - Gate (10-100%) - Note length
- **Range**:
  - Octave Range (1-4 octaves)

#### ⚙️ **7. MISC Tab**
- **General Settings**:
  - Polyphony (1-32 voices) - Max simultaneous notes
  - Portamento (0-500ms) - Pitch glide between notes
  - Velocity Sensitivity (0-200%) - Touch response
- **Track Color Picker** - Visual color selector for track identification
- **Track Notes** - Text area for production notes and ideas

## Controls & Interaction

### Sliders
- **Drag** to adjust values
- **Hover** for scale effect and glow
- **Live value display** updates above each slider
- **Orange thumb** with shadow for professional look

### Waveform Buttons
- **Click** to select waveform
- **Active state** with orange highlight
- **Visual symbols** for each waveform type

### Toggle Switches
- **Click** to toggle on/off
- **Smooth animation** with sliding circle
- **Orange active state**

### Dropdowns
- **Click** to expand options
- **Professional styling** matching FL Studio theme

## Keyboard Shortcuts
- **Esc** - Close settings window
- **Tab** - Navigate between controls (standard browser behavior)

## Visual Feedback

### Envelope Visualizer
- **Real-time canvas drawing** of ADSR curve
- **Orange line with gradient fill**
- **Grid lines** for reference
- **Updates instantly** as you adjust ADSR parameters

### Parameter Displays
- **Large orange numbers** above each slider
- **Formatted units**: %, ms, Hz, dB, °, semitones
- **"Center"** display for pan at 0
- **Left/Right indicators** for negative/positive pan

### Window Animations
- **Slide-up entrance** with scale effect
- **Tab fade-in** when switching tabs
- **Smooth transitions** on all interactions
- **Backdrop blur** for depth

## Technical Details

### File: `channelSettingsWindow.js`
- **Self-contained module** with all HTML, CSS, and JS
- **Waits for app initialization** with retry logic
- **Click detection** on `.track-icon` and `.track-name` elements
- **Non-blocking** - Can have multiple tabs open (future enhancement)
- **Professional styling** injected into `<head>`

### Integration
- **Auto-loads** after app.js and other plugins
- **No modification** needed to existing track rendering
- **Backward compatible** with existing features
- **Lightweight** - No external dependencies

## Usage Tips

1. **Quick Edit**: Click track icon/name for instant access to all parameters
2. **Visual Feedback**: Watch the envelope visualizer as you shape your sound
3. **Experimentation**: All changes update displays in real-time
4. **Organization**: Use track colors and notes for better project organization
5. **Professional Workflow**: Mimics FL Studio's channel settings for familiar experience

## Future Enhancements
- Parameter automation recording
- Preset management (save/load channel presets)
- Copy/paste settings between tracks
- Advanced modulation matrix
- Real-time spectrum analyzer per track
- Knob drag controls (circular motion)

## Current Status
✅ **Complete** - Fully functional with all 7 tabs
✅ **Professional styling** matching FL Studio 21
✅ **Real-time visualizations** (envelope canvas)
✅ **All parameter categories** implemented
✅ **Keyboard shortcuts** (Esc to close)
✅ **Smooth animations** throughout

---

**Enjoy ultra-professional channel editing! 🎵✨**
