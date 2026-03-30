import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { createOverlayWindow } from './overlay-window';
import { createSettingsWindow } from './settings-window';
import { registerShortcuts } from './shortcuts';
import { setupTray } from './tray';
import { registerIpcHandlers } from './ipc-handlers';

let overlayWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindows() {
  overlayWindow = createOverlayWindow(isDev);
  registerIpcHandlers(overlayWindow);
  registerShortcuts(overlayWindow, () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.focus();
    } else {
      settingsWindow = createSettingsWindow(isDev);
      settingsWindow.on('closed', () => {
        settingsWindow = null;
      });
    }
  });
  setupTray(overlayWindow, () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.focus();
    } else {
      settingsWindow = createSettingsWindow(isDev);
      settingsWindow.on('closed', () => {
        settingsWindow = null;
      });
    }
  });
}

app.whenReady().then(createWindows);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindows();
  }
});
