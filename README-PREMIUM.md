# 🎤 Premium Autotune Features - Complete Guide

## Overview

The Vocal Studio now includes **professional premium autotune features** with live recording capabilities. All features can be activated/deactivated via the premium toggle button.

## ✨ Premium Features

### 1. Live Recording
- **Real-time autotune processing** during recording
- Low-latency pipeline (100ms timeslice)
- Continuous buffer management
- Visual indicator during live recording

### 2. Advanced Autotune Controls

#### Formant Shift
- Range: -50% to +50%
- Adjusts vocal character while maintaining pitch
- Creates different vocal timbres (deeper/higher voice character)

#### Humanize Mode
- Adds natural pitch variations
- Prevents robotic autotune sound
- Adjustable intensity (0-100%)
- Creates more organic-sounding pitch correction

#### Enhanced Pitch Detection
- Improved YIN algorithm with harmonic validation
- Better accuracy for complex vocal passages
- Frequency range validation (80-1000 Hz)
- Reduces false pitch detections

### 3. Multiple Export Formats
- **WEBM** (default, free)
- **WAV** (premium) - Uncompressed, highest quality
- **MP3** (premium) - Compressed, smaller file size
- **OGG** (premium) - Open format, good compression

### 4. Enhanced Waveform Visualization
- Premium gold styling
- Real-time frequency spectrum overlay
- Enhanced visualization during live recording
- Gradient backgrounds

## 🎯 How to Use

### Activating Premium
1. Open Vocal Studio (click 🎤 button)
2. Click **"ACTIVATE PREMIUM"** in the header
3. Premium badge appears
4. All premium features unlock

### Recording with Live Autotune
1. **Activate Premium** (if not already active)
2. **Select Key & Scale** matching your song
3. **Adjust Autotune Strength** (70-100% for strong effect)
4. **Enable Enhanced Pitch Detection** (premium feature)
5. **Click "Start Recording"**
6. **See "LIVE RECORDING ACTIVE"** indicator
7. **Sing into microphone** - autotune processes in real-time
8. **Click Stop** when done
9. **Select export format** (WAV recommended for quality)
10. **Download** your recording

### Using Advanced Controls

#### Formant Shift
- **Negative values** (-50% to 0%): Deeper, more masculine sound
- **Positive values** (0% to +50%): Higher, more feminine sound
- **0%**: Natural formants (default)

#### Humanize Mode
- **Enable** for natural variation
- **Amount 0-30%**: Subtle variation (recommended)
- **Amount 30-70%**: Moderate variation
- **Amount 70-100%**: Strong variation (may sound pitchy)

#### Enhanced Pitch Detection
- **Enable** for better accuracy
- Especially useful for:
  - Complex vocal passages
  - Background noise
  - Multiple voices
  - Low-quality microphones

## 🎛️ Preset Recommendations

### Trap Auto (Default)
- Strength: 80%
- Speed: 50ms
- Good for: Modern trap/hip-hop vocals

### Hard Tune
- Strength: 100%
- Speed: 1ms
- **Enable Enhanced Pitch Detection**
- Good for: Strong autotune effect (T-Pain style)

### Melodic
- Strength: 60%
- Speed: 100ms
- **Enable Humanize Mode** (30% amount)
- Good for: Smooth, natural-sounding correction

### Dark
- Strength: 70%
- Speed: 30ms
- **Formant Shift: -20%**
- Good for: Deeper, darker vocal character

## 🔧 Technical Details

### Live Recording Architecture
- Uses MediaRecorder API with 100ms timeslice
- Real-time audio processing pipeline
- Low-latency buffer management
- Continuous chunk handling

### Enhanced Pitch Detection Algorithm
- Improved YIN algorithm
- Harmonic validation (2nd, 3rd, 4th harmonics)
- Frequency range validation
- Lower threshold (0.05 vs 0.1) for better sensitivity

### Formant Shifting
- Applied as pitch ratio multiplier
- Range: -50% to +50%
- Factor: `1 + (formantShift * 0.05)`
- Affects vocal character without changing fundamental pitch

### Humanize Mode
- Random variation: `(Math.random() - 0.5) * humanizeAmount * 0.1`
- Applied to pitch ratio
- Creates natural pitch fluctuations
- Prevents robotic sound

## 📊 Feature Comparison

| Feature | Free | Premium |
|---------|------|---------|
| Basic Autotune | ✅ | ✅ |
| Standard Recording | ✅ | ✅ |
| Live Recording | ❌ | ✅ |
| Formant Shift | ❌ | ✅ |
| Humanize Mode | ❌ | ✅ |
| Enhanced Detection | ❌ | ✅ |
| Export Formats | WEBM only | WEBM, WAV, MP3, OGG |
| Waveform Visualization | Basic | Enhanced |

## 🎵 Best Practices

1. **Microphone Quality**: Better mic = better results
2. **Environment**: Record in quiet space
3. **Key Matching**: Match key to your backing track
4. **Strength Settings**: 
   - Subtle: 30-50%
   - Moderate: 50-80%
   - Strong: 80-100%
5. **Humanize**: Use 20-40% for natural sound
6. **Formant Shift**: Use sparingly (-10% to +10% for subtle effect)

## 🐛 Troubleshooting

### Premium Not Activating
- Check browser console for errors
- Verify `premiumService.js` is loaded
- Try refreshing the page

### Live Recording Not Working
- Ensure premium is activated
- Check microphone permissions
- Verify browser supports MediaRecorder API

### Export Formats Not Available
- Premium must be active
- Check format selector is visible
- Some formats may require browser support

### Enhanced Pitch Detection Issues
- May reject very low/high frequencies
- Adjust microphone gain if needed
- Try disabling if causing issues

## 🔐 Premium Service API

The premium service is accessible via:
```javascript
// Check premium status
window.premiumService.isPremiumActive()

// Activate premium
window.premiumService.activatePremium()

// Deactivate premium
window.premiumService.deactivatePremium()

// Check specific feature
window.premiumService.hasFeature('liveRecording')

// Subscribe to changes
window.premiumService.onStateChange((state) => {
  console.log('Premium status:', state.active);
})
```

## 📝 State Persistence

All premium settings are saved to localStorage:
- Premium activation status
- Formant shift value
- Humanize mode state
- Humanize amount
- Enhanced pitch detection state
- Export format preference

Settings persist across browser sessions.

---

**Enjoy professional autotune features! 🎤✨**

