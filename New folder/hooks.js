// Simple plugin registration for FLStudio web app
(function(){
  if (typeof window === 'undefined') return;
  window.__flPlugins = window.__flPlugins || [];
  window.registerFLPlugin = function registerFLPlugin(pluginFn){
    if (typeof pluginFn === 'function') {
      window.__flPlugins.push(pluginFn);
      // If app already exists, init immediately
      if (window.flStudio) {
        try { pluginFn(window.flStudio); } catch (e) { console.error('Plugin failed', e); }
      }
    }
  };
})();
