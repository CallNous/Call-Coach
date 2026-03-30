import { BrowserWindow } from 'electron';
import path from 'path';

export function createSettingsWindow(isDev: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 700,
    height: 550,
    title: 'Call Coach Settings',
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173/settings.html');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/settings.html'));
  }

  return win;
}
