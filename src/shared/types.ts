export interface CoachingSuggestion {
  id: string;
  bullets: string[];
  timestamp: number;
  methodology: string;
}

export interface TranscriptEntry {
  speaker: 'you' | 'them';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface MethodologyConfig {
  id: string;
  name: string;
  description: string;
  phases: MethodologyPhase[];
  outputFormat: string;
}

export interface MethodologyPhase {
  name: string;
  keywords: string[];
  guidance: string;
}

export interface AppSettings {
  llmProvider: 'gemini' | 'grok' | 'claude' | 'openai';
  apiKeys: {
    deepgram?: string;
    gemini?: string;
    grok?: string;
    claude?: string;
    openai?: string;
  };
  methodology: string;
  overlay: OverlaySettings;
  audio: AudioSettings;
}

export interface OverlaySettings {
  opacity: number;
  position: { x: number; y: number };
  maxSuggestions: number;
  bulletMaxWords: number;
  displayDurationMs: number;
}

export interface AudioSettings {
  micDeviceId?: string;
  systemAudioEnabled: boolean;
}

export type IpcChannels =
  | 'coaching:suggestion'
  | 'coaching:toggle'
  | 'transcript:entry'
  | 'settings:get'
  | 'settings:set'
  | 'overlay:toggle'
  | 'audio:devices'
  | 'audio:select-mic'
  | 'methodology:list'
  | 'methodology:select';
