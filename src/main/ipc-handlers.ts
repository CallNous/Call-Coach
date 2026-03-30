import { ipcMain, BrowserWindow } from 'electron';

export function registerIpcHandlers(overlayWindow: BrowserWindow) {
  ipcMain.handle('settings:get', async (_event, key: string) => {
    // TODO: integrate electron-store
    return null;
  });

  ipcMain.handle('settings:set', async (_event, key: string, value: unknown) => {
    // TODO: integrate electron-store
    return true;
  });

  ipcMain.on('overlay:set-ignore-mouse', (_event, ignore: boolean) => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });
}
