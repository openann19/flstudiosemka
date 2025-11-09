# Troubleshooting Guide

Common issues and their solutions for the FL Studio Web DAW.

## Build Issues

### Problem: npm install fails

**Symptoms:**
- Installation errors
- Peer dependency conflicts
- Missing packages

**Solutions:**

1. Use legacy peer deps flag:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

3. Check Node.js version:
   ```bash
   node --version  # Should be 18.x or 20.x
   ```

### Problem: Build fails with TypeScript errors

**Symptoms:**
- `npm run build` fails
- Type checking errors

**Solutions:**

1. Run type check to see all errors:
   ```bash
   npm run type-check
   ```

2. Check tsconfig.json is correct

3. Ensure all dependencies are installed:
   ```bash
   npm ci --legacy-peer-deps
   ```

### Problem: Sample generation fails

**Symptoms:**
- prebuild script fails
- Missing 909-samples.ts file

**Solutions:**

1. Manually generate samples:
   ```bash
   npm run generate-samples
   ```

2. Check scripts directory exists:
   ```bash
   ls scripts/generate-909-samples.ts
   ```

## Audio Issues

### Problem: No audio playback

**Symptoms:**
- Pressing play button produces no sound
- Audio context not starting

**Solutions:**

1. **Check HTTPS**: Web Audio API requires secure context
   - Use `https://` or `localhost`
   - Don't use plain `http://` on remote servers

2. **Browser compatibility**: Check browser support
   - Chrome 89+
   - Firefox 88+
   - Safari 14+
   - Edge 89+

3. **User interaction required**: Click anywhere on the page first
   - Web Audio API requires user gesture to start

4. **Check browser console** for errors:
   ```javascript
   // Should show 'running'
   console.log(audioContext.state);
   ```

5. **Resume audio context**:
   ```javascript
   audioContext.resume();
   ```

### Problem: Audio crackling or stuttering

**Symptoms:**
- Choppy playback
- Glitches in audio
- High CPU usage

**Solutions:**

1. Increase buffer size in audio settings

2. Close other browser tabs

3. Disable browser extensions

4. Check CPU usage:
   - Reduce number of active tracks
   - Disable heavy effects
   - Lower sample rate

5. Use Chrome's audio debugging:
   ```
   chrome://media-internals/
   ```

### Problem: MIDI not working

**Symptoms:**
- MIDI keyboard not detected
- MIDI input not working

**Solutions:**

1. **Grant MIDI permissions**:
   - Check browser permissions
   - Allow MIDI access when prompted

2. **Check MIDI device connection**:
   ```javascript
   navigator.requestMIDIAccess().then(access => {
     console.log(access.inputs);
   });
   ```

3. **Reconnect device**:
   - Unplug and replug MIDI keyboard
   - Refresh page after connecting

4. **Browser support**:
   - Chrome/Edge: Full support
   - Firefox: Limited support
   - Safari: Requires flag

## Performance Issues

### Problem: Slow UI rendering

**Symptoms:**
- Laggy interface
- Slow pattern editing
- Frame drops

**Solutions:**

1. **Disable animations** (if option available)

2. **Reduce visual effects**

3. **Clear browser cache**:
   ```
   Ctrl+Shift+Delete (Windows/Linux)
   Cmd+Shift+Delete (Mac)
   ```

4. **Use hardware acceleration**:
   - Enable in browser settings
   - Chrome: `chrome://settings/system`

5. **Close DevTools** when not debugging

### Problem: High memory usage

**Symptoms:**
- Browser using too much RAM
- Tab crashes
- System slow

**Solutions:**

1. **Limit number of patterns**

2. **Clear unused tracks**

3. **Export and reload project**

4. **Check memory usage**:
   ```
   Chrome DevTools → Performance Monitor
   ```

5. **Restart browser** periodically

## Development Issues

### Problem: Hot reload not working

**Symptoms:**
- Changes not reflecting
- Need manual refresh

**Solutions:**

1. Check dev server is running:
   ```bash
   npm run dev
   ```

2. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```

3. Restart dev server

4. Hard refresh browser:
   ```
   Ctrl+Shift+R (Windows/Linux)
   Cmd+Shift+R (Mac)
   ```

### Problem: ESLint errors

**Symptoms:**
- Linting fails
- TypeScript errors

**Solutions:**

1. Run lint in soft mode:
   ```bash
   npm run lint:soft
   ```

2. Auto-fix issues:
   ```bash
   npm run lint:fix
   ```

3. Check .eslintrc configuration

4. Clear ESLint cache:
   ```bash
   rm .eslintcache
   ```

### Problem: Tests failing

**Symptoms:**
- `npm test` fails
- Test errors

**Solutions:**

1. Update test snapshots:
   ```bash
   npm test -- -u
   ```

2. Run specific test:
   ```bash
   npm test -- path/to/test.test.ts
   ```

3. Check test setup:
   ```bash
   cat tests/setup.ts
   ```

4. Clear Jest cache:
   ```bash
   npm test -- --clearCache
   ```

## Deployment Issues

### Problem: Docker build fails

**Symptoms:**
- Docker image build errors
- Container won't start

**Solutions:**

1. Check Dockerfile syntax

2. Build with no cache:
   ```bash
   docker build --no-cache -t fl-studio-web .
   ```

3. Check logs:
   ```bash
   docker logs fl-studio
   ```

4. Verify Node version in Dockerfile

### Problem: Nginx 404 errors

**Symptoms:**
- Routes not working
- 404 on refresh

**Solutions:**

1. **Check nginx.conf** has SPA routing:
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }
   ```

2. **Reload Nginx**:
   ```bash
   sudo nginx -s reload
   ```

3. **Check Nginx logs**:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

### Problem: Assets not loading

**Symptoms:**
- Missing styles
- Broken images
- 404 on assets

**Solutions:**

1. **Check base URL** in vite.config.ts

2. **Verify asset paths**:
   - Use relative paths
   - Check build output

3. **CORS issues**:
   - Configure Nginx CORS headers
   - Check browser console

4. **Cache issues**:
   - Clear browser cache
   - Check cache headers

## Browser Compatibility

### Chrome/Edge Issues

1. **Audio worklets**: Fully supported
2. **MIDI**: Fully supported
3. **File System**: Use download/upload APIs

### Firefox Issues

1. **Audio worklets**: Supported in 76+
2. **MIDI**: Limited support, may need flag
3. **Performance**: Generally good

### Safari Issues

1. **Audio context**: Requires user interaction
2. **MIDI**: Requires experimental flag
3. **Web Audio**: Some features limited

**Solutions:**
- Detect browser and show warnings
- Provide fallbacks
- Test in target browsers

## Data Issues

### Problem: Project won't load

**Symptoms:**
- Import fails
- Corrupted project
- Parse errors

**Solutions:**

1. **Check JSON format**:
   ```bash
   cat project.json | jq .
   ```

2. **Validate project structure**

3. **Try older version** of project

4. **Check browser console** for errors

### Problem: Project won't save

**Symptoms:**
- Export fails
- Download doesn't start
- Incomplete file

**Solutions:**

1. **Check browser storage**:
   - localStorage available
   - Not in incognito mode

2. **Check file size**:
   - May be too large for browser
   - Split into smaller projects

3. **Try different format**:
   - WAV instead of MP3
   - Lower quality settings

## Getting Help

If you can't resolve your issue:

1. **Check GitHub Issues**: Search for similar problems
2. **Create New Issue**: Include:
   - Browser and version
   - Operating system
   - Steps to reproduce
   - Error messages
   - Console logs
3. **Check Documentation**: README.md, DEPLOYMENT.md
4. **Community**: Ask in discussions

## Debug Mode

Enable debug mode for more information:

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Check Application tab for storage
5. Use Performance tab for profiling

## Logging

Check logs in different places:

- **Browser Console**: Client-side errors
- **Network Tab**: API requests
- **Application Tab**: localStorage, IndexedDB
- **Nginx Logs**: Server-side errors (production)
- **Docker Logs**: Container issues

## Performance Profiling

1. Open DevTools → Performance
2. Start recording
3. Perform actions
4. Stop recording
5. Analyze results:
   - JavaScript execution time
   - Rendering performance
   - Memory allocation

## Common Error Messages

### "AudioContext was not allowed to start"

**Solution**: User must interact with page first. Click anywhere.

### "Cannot read property of undefined"

**Solution**: Check if audio context is initialized. Wait for user interaction.

### "Failed to fetch"

**Solution**: Network error or CORS issue. Check API endpoint.

### "Out of memory"

**Solution**: Too many audio buffers. Reduce project size.

### "SecurityError"

**Solution**: Use HTTPS or localhost. Web Audio requires secure context.

---

Still having issues? Open a GitHub issue with details!
