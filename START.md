# 🚀 Quick Start Guide

## Starting the Application

### Method 1: Direct Browser Opening
1. Navigate to the `NewProjectNov` folder
2. Double-click `index.html` to open in your default browser
3. Allow microphone permissions when prompted (for Vocal Studio)

### Method 2: Local Server (Recommended)
Open a terminal in the `NewProjectNov` directory and run:

**Python:**
```bash
python -m http.server 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000`

## 🎤 Using Premium Autotune Features

### Activating Premium
1. Click the **🎤** button (bottom-right corner) to open Vocal Studio
2. Click **"ACTIVATE PREMIUM"** button in the header
3. Premium badge will appear and features will unlock

### Premium Features Available:
- ✅ **Live Recording** - Real-time recording with autotune processing
- ✅ **Formant Shift** - Adjust vocal formants (-50% to +50%)
- ✅ **Humanize Mode** - Add natural variation to pitch correction
- ✅ **Enhanced Pitch Detection** - Improved accuracy with harmonic validation
- ✅ **Multiple Export Formats** - WAV, MP3, OGG (in addition to WEBM)
- ✅ **Enhanced Waveform** - Premium visualization with frequency spectrum

### Recording with Premium
1. Activate Premium (see above)
2. Click **"Start Recording"** button
3. You'll see **"LIVE RECORDING ACTIVE"** indicator
4. Sing into your microphone - autotune processes in real-time
5. Click **"Stop"** to finish recording
6. Select export format (WEBM, WAV, MP3, or OGG)
7. Click **"Download"** to save your recording

### Advanced Autotune Controls (Premium)
- **Formant Shift**: Adjusts vocal character while maintaining pitch
- **Humanize Mode**: Adds subtle pitch variations for more natural sound
- **Humanize Amount**: Controls the intensity of humanization
- **Enhanced Pitch Detection**: More accurate pitch tracking with harmonic validation

## 🎛️ Basic Features (Free)

Even without premium, you get:
- Basic autotune with strength and speed controls
- Key and scale selection
- Reverb and delay effects
- Double tracking
- De-esser
- Standard recording (post-processing)
- WEBM export

## 🔧 Troubleshooting

### Microphone Not Working
- Check browser permissions (click the lock icon in address bar)
- Ensure microphone is connected and not muted
- Try refreshing the page

### Premium Features Not Unlocking
- Check browser console for errors (F12)
- Verify `premiumService.js` is loaded
- Try deactivating and reactivating premium

### Audio Not Playing
- Click anywhere on the page first (browser audio unlock)
- Check browser audio settings
- Ensure speakers/headphones are connected

### Build Verification
Open browser console (F12) and check for:
- ✅ Build verification messages
- ✅ "Vocal Studio Pro ready" message
- ✅ No red error messages

## 📝 Testing Premium Features

Open browser console (F12) and run:
```javascript
// Test premium service
window.premiumService.activatePremium();
console.log('Premium active:', window.premiumService.isPremiumActive());

// Run test suite
if (window.premiumAutotuneTests) {
  window.premiumAutotuneTests.run();
}
```

## 🎯 Quick Tips

1. **Best Results**: Use a quiet environment with a good microphone
2. **Real-time Monitoring**: Enable "Monitor" toggle to hear autotune in real-time
3. **Presets**: Try different presets (Trap Auto, Hard Tune, Melodic, etc.)
4. **Key Selection**: Match the key to your backing track for best results
5. **Strength Control**: Lower strength (30-50%) for subtle correction, higher (80-100%) for obvious autotune effect

## 🎵 Example Workflow

1. Open Vocal Studio (🎤 button)
2. Activate Premium
3. Select key and scale matching your song
4. Adjust autotune strength (start with 70-80%)
5. Enable Enhanced Pitch Detection (premium)
6. Start Live Recording
7. Sing your part
8. Stop recording
9. Select WAV format (premium)
10. Download your autotuned vocal

---

**Enjoy creating professional autotuned vocals! 🎤✨**

