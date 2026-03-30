export const DEFAULT_OVERLAY_SETTINGS = {
  opacity: 0.85,
  position: { x: 20, y: 100 },
  maxSuggestions: 4,
  bulletMaxWords: 12,
  displayDurationMs: 15000,
};

export const DEFAULT_AUDIO_SETTINGS = {
  systemAudioEnabled: true,
};

export const COACHING_DEBOUNCE_MS = 3000;
export const TRANSCRIPT_WINDOW_MINUTES = 5;

export const SHORTCUTS = {
  toggleCoaching: 'CmdOrCtrl+Shift+C',
  cycleMethodology: 'CmdOrCtrl+Shift+M',
  toggleOverlay: 'CmdOrCtrl+Shift+H',
  toggleRecording: 'CmdOrCtrl+Shift+P',
  openSettings: 'CmdOrCtrl+Shift+S',
};
