import { globalShortcut, BrowserWindow } from 'electron';
import { SHORTCUTS } from '../shared/constants';

export function registerShortcuts(
  overlayWindow: BrowserWindow,
  openSettings: () => void
) {
  globalShortcut.register(SHORTCUTS.toggleOverlay, () => {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
    } else {
      overlayWindow.show();
    }
  });

  globalShortcut.register(SHORTCUTS.toggleCoaching, () => {
    overlayWindow.webContents.send('coaching:toggle');
  });

  globalShortcut.register(SHORTCUTS.cycleMethodology, () => {
    overlayWindow.webContents.send('methodology:cycle');
  });

  globalShortcut.register(SHORTCUTS.toggleRecording, () => {
    overlayWindow.webContents.send('recording:toggle');
  });

  globalShortcut.register(SHORTCUTS.openSettings, () => {
    openSettings();
  });
}
