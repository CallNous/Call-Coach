import { BrowserWindow, screen } from 'electron';
import path from 'path';

export function createOverlayWindow(isDev: boolean): BrowserWindow {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const overlay = new BrowserWindow({
    width: 400,
    height: 600,
    x: width - 420,
    y: 100,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlay.setIgnoreMouseEvents(true, { forward: true });
  overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    overlay.loadURL('http://localhost:5173');
  } else {
    overlay.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return overlay;
}
