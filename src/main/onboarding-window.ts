import { BrowserWindow } from 'electron';
import path from 'path';

export function createOnboardingWindow(isDev: boolean): BrowserWindow {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    title: 'Call Coach Setup',
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173/onboarding.html');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/onboarding.html'));
  }

  return win;
}
