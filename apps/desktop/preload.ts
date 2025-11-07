/**
 * Electron Preload Script
 * Runs in isolated context, bridges main process and renderer
 * 
 * Sets up cross-origin isolation headers (COOP/COEP) for SharedArrayBuffer
 */

import { contextBridge, ipcRenderer } from 'electron';

interface ElectronAPI {
  saveDialog: () => Promise<string | null>;
  openDialog: () => Promise<string | null>;
  readFile: (filePath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
  writeFile: (filePath: string, data: string) => Promise<{ success: boolean; error?: string }>;
  loadAudioSample: (filePath: string) => Promise<{ success: boolean; buffer?: ArrayBuffer; error?: string }>;
  getSystemInfo: () => Promise<{
    platform: string;
    arch: string;
    version: NodeJS.ProcessVersions;
    electron: string;
    node: string;
    chrome: string;
  }>;
  getAppVersion: () => Promise<string>;
}

// Expose protected methods that allow the renderer process
// to use ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveDialog: () => ipcRenderer.invoke('file:save-dialog'),
  openDialog: () => ipcRenderer.invoke('file:open-dialog'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, data: string) => ipcRenderer.invoke('file:write', filePath, data),
  
  // Audio file operations
  loadAudioSample: (filePath: string) => ipcRenderer.invoke('audio:load-sample', filePath),
  
  // System info
  getSystemInfo: () => ipcRenderer.invoke('system:get-info'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
} as ElectronAPI);

// Set cross-origin isolation headers via meta tags
// Note: In Electron, we can also set headers via webRequest, but meta tags work too
if (typeof document !== 'undefined') {
  // Add COOP/COEP meta tags to enable SharedArrayBuffer
  const coopMeta = document.createElement('meta');
  coopMeta.httpEquiv = 'Cross-Origin-Opener-Policy';
  coopMeta.content = 'same-origin';
  document.head.appendChild(coopMeta);

  const coepMeta = document.createElement('meta');
  coepMeta.httpEquiv = 'Cross-Origin-Embedder-Policy';
  coepMeta.content = 'require-corp';
  document.head.appendChild(coepMeta);
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

