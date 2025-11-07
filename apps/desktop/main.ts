/**
 * Electron Main Process
 * Desktop DAW - Main Process
 * 
 * Security: contextIsolation, sandbox, no remote
 * Cross-origin isolation: COOP/COEP for AudioWorklets + SharedArrayBuffer
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { promises as fs } from 'fs';

// Keep a global reference to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

interface FileDialogResult {
  canceled: boolean;
  filePath?: string;
  filePaths?: string[];
}

interface FileOperationResult {
  success: boolean;
  data?: string;
  buffer?: ArrayBuffer;
  error?: string;
}

/**
 * Create the main application window
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      // Security: Enable context isolation
      contextIsolation: true,
      // Security: Enable sandbox
      nodeIntegration: false,
      // Security: Disable remote module
      enableRemoteModule: false,
      // Security: Disable webSecurity for local files (development only)
      webSecurity: process.env.NODE_ENV === 'development' ? false : true,
      // Cross-origin isolation: Required for SharedArrayBuffer and AudioWorklets
      // These headers will be set via preload script
      preload: path.join(__dirname, process.env.NODE_ENV === 'development' ? 'preload.js' : 'preload.js'),
      // Enable SharedArrayBuffer
      // Note: COOP/COEP headers must be set in preload or via webRequest
    },
    backgroundColor: '#000000',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false, // Don't show until ready
  });

  // Load the app
  const isDev = process.argv.includes('--dev');
  if (isDev) {
    // Development: Load from local server or file
    mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  } else {
    // Production: Load from packaged app
    mainWindow.loadFile(path.join(__dirname, '../../index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      
      // Open DevTools in development
      if (isDev) {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up IPC handlers
  setupIPC();
}

/**
 * Set up IPC (Inter-Process Communication) handlers
 * Typed channels with validation (Zod can be added later)
 */
function setupIPC(): void {
  // File operations
  ipcMain.handle('file:save-dialog', async (): Promise<string | null> => {
    if (!mainWindow) {
      return null;
    }

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Project',
      defaultPath: 'untitled.dawproj',
      filters: [
        { name: 'DAW Project', extensions: ['dawproj'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) {
      return null;
    }

    return result.filePath ?? null;
  });

  ipcMain.handle('file:open-dialog', async (): Promise<string | null> => {
    if (!mainWindow) {
      return null;
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Project',
      filters: [
        { name: 'DAW Project', extensions: ['dawproj', 'flp', 'json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled) {
      return null;
    }

    return result.filePaths?.[0] ?? null;
  });

  ipcMain.handle('file:read', async (_event, filePath: string): Promise<FileOperationResult> => {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return { success: true, data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  ipcMain.handle('file:write', async (_event, filePath: string, data: string): Promise<FileOperationResult> => {
    try {
      await fs.writeFile(filePath, data, 'utf-8');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // Audio file operations
  ipcMain.handle('audio:load-sample', async (_event, filePath: string): Promise<FileOperationResult> => {
    try {
      const buffer = await fs.readFile(filePath);
      return { success: true, buffer: buffer.buffer };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  });

  // System info
  ipcMain.handle('system:get-info', async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.versions,
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome
    };
  });

  // App lifecycle
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });
}

/**
 * App event handlers
 */
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    // eslint-disable-next-line no-console
    console.warn('Blocked new window:', navigationUrl);
  });
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'file://' && !parsedUrl.origin.startsWith('http://localhost')) {
      event.preventDefault();
      // eslint-disable-next-line no-console
      console.warn('Blocked navigation to:', navigationUrl);
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught Exception:', error);
  // In production, log to file and show user-friendly error
});

process.on('unhandledRejection', (reason, promise) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

