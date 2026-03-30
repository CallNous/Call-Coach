import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { initMain } from 'electron-audio-loopback';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import path from 'path';
import { createOverlayWindow } from './overlay-window';
import { createSettingsWindow } from './settings-window';
import { createOnboardingWindow } from './onboarding-window';
import { registerShortcuts } from './shortcuts';
import { setupTray } from './tray';
import { registerIpcHandlers } from './ipc-handlers';

// Must be called BEFORE app.ready() for system audio loopback
initMain();

let overlayWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

const appStore = new Store({
  name: 'call-coach-app',
  defaults: { 'onboardingComplete': false },
});

function launchMainApp() {
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

  // Check for updates (silent, non-intrusive)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

function createWindows() {
  const isFirstRun = !appStore.get('onboardingComplete');

  // Handle finish-onboarding IPC from onboarding window
  ipcMain.on('onboarding:finish', () => {
    appStore.set('onboardingComplete', true);
    if (onboardingWindow && !onboardingWindow.isDestroyed()) {
      onboardingWindow.close();
    }
    onboardingWindow = null;
    launchMainApp();
  });

  if (isFirstRun) {
    onboardingWindow = createOnboardingWindow(isDev);
    onboardingWindow.on('closed', () => {
      // If closed without finishing, quit the app
      if (!appStore.get('onboardingComplete')) {
        app.quit();
      }
    });
  } else {
    launchMainApp();
  }
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
