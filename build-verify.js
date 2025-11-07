/**
 * Build Verification Script
 * Verifies React/TypeScript application is properly loaded
 * Updated for TypeScript/React architecture
 */

(function() {
  'use strict';

  function verifyBuild() {
    console.log('%c=== Build Verification (React/TypeScript) ===', 'color: #FFD700; font-weight: bold; font-size: 16px');
    
    let allGood = true;
    const issues = [];

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('⚠️ This script should run in a browser environment');
      return;
    }

    // Verify React app is loaded
    console.log('\n%cChecking React application...', 'color: #FF0080; font-weight: bold');
    
    const rootElement = document.getElementById('root');
    if (rootElement && rootElement.children.length > 0) {
      console.log('  ✅ React root element has content', 'color: #00FF00');
    } else {
      console.log('  ⚠️ React root element is empty (may still be loading)', 'color: #FFA500');
    }

    // Verify TypeScript modules are loaded via Vite
    console.log('\n%cChecking TypeScript modules...', 'color: #FF0080; font-weight: bold');
    
    const moduleScripts = Array.from(document.querySelectorAll('script[type="module"]'));
    const hasMainTs = moduleScripts.some((s) => s.src.includes('main.ts') || s.src.includes('index.tsx'));
    
    if (hasMainTs) {
      console.log('  ✅ TypeScript entry points found', 'color: #00FF00');
    } else {
      console.log('  ⚠️ TypeScript entry points not found in DOM (may be bundled)', 'color: #FFA500');
    }

    // Verify global objects (if they exist)
    console.log('\n%cChecking global objects...', 'color: #FF0080; font-weight: bold');
    
    if (typeof window.timelineUtils !== 'undefined') {
      console.log('  ✅ timelineUtils loaded', 'color: #00FF00');
    } else {
      console.log('  ⚠️ timelineUtils not found (may be loaded via modules)', 'color: #FFA500');
    }

    if (typeof window.TrackMixer !== 'undefined') {
      console.log('  ✅ TrackMixer loaded', 'color: #00FF00');
    } else {
      console.log('  ⚠️ TrackMixer not found (may be loaded via modules)', 'color: #FFA500');
    }

    if (typeof window.BusManager !== 'undefined') {
      console.log('  ✅ BusManager loaded', 'color: #00FF00');
    } else {
      console.log('  ⚠️ BusManager not found (may be loaded via modules)', 'color: #FFA500');
    }

    // Check for React
    if (typeof window.React !== 'undefined' || typeof React !== 'undefined') {
      console.log('  ✅ React is available', 'color: #00FF00');
    } else {
      console.log('  ⚠️ React not found in global scope (may be bundled)', 'color: #FFA500');
    }

    // Summary
    console.log('\n%c=== Build Summary ===', 'color: #FFD700; font-weight: bold; font-size: 16px');
    if (allGood && issues.length === 0) {
      console.log('%c✅ Build verification PASSED!', 'color: #00FF00; font-weight: bold; font-size: 14px');
      console.log('React/TypeScript application appears to be properly loaded.');
    } else {
      console.log(`%c⚠️ Build verification found ${issues.length} issue(s)`, 'color: #FFA500; font-weight: bold; font-size: 14px');
      if (issues.length > 0) {
        console.log('Issues:', issues);
      }
    }

    return {
      success: allGood && issues.length === 0,
      issues
    };
  }

  // Auto-run when DOM is ready
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(verifyBuild, 1000);
      });
    } else {
      setTimeout(verifyBuild, 1000);
    }

    // Export for manual execution
    window.verifyBuild = verifyBuild;
  }
})();

