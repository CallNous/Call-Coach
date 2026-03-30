import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('callCoach', {
  // Settings
  getSettings: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSettings: (key: string, value: unknown) =>
    ipcRenderer.invoke('settings:set', key, value),

  // Overlay mouse events
  setIgnoreMouseEvents: (ignore: boolean) =>
    ipcRenderer.send('overlay:set-ignore-mouse', ignore),

  // Event listeners
  onCoachingToggle: (callback: () => void) => {
    ipcRenderer.on('coaching:toggle', callback);
    return () => ipcRenderer.removeListener('coaching:toggle', callback);
  },
  onMethodologyCycle: (callback: () => void) => {
    ipcRenderer.on('methodology:cycle', callback);
    return () => ipcRenderer.removeListener('methodology:cycle', callback);
  },
  onRecordingToggle: (callback: () => void) => {
    ipcRenderer.on('recording:toggle', callback);
    return () => ipcRenderer.removeListener('recording:toggle', callback);
  },
});
