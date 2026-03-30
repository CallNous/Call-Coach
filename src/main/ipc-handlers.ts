import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';

const store = new Store({
  name: 'call-coach-settings',
  defaults: {
    'llmProvider': 'gemini',
    'apiKeys.deepgram': '',
    'apiKeys.gemini': '',
    'apiKeys.grok': '',
    'apiKeys.claude': '',
    'apiKeys.openai': '',
    'methodology': 'meddic',
    'audio.micDeviceId': '',
    'audio.systemAudioEnabled': true,
    'overlay.opacity': 0.85,
    'overlay.maxSuggestions': 4,
    'overlay.displayDurationMs': 15000,
  },
});

export function registerIpcHandlers(overlayWindow: BrowserWindow) {
  ipcMain.handle('settings:get', async (_event, key: string) => {
    return store.get(key);
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: unknown) => {
    store.set(key, value);
    // Notify overlay of settings changes
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('settings:changed', key, value);
    }
    return true;
  });

  ipcMain.on('overlay:set-ignore-mouse', (_event, ignore: boolean) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });
}
