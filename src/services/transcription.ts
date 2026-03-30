/**
 * Deepgram streaming transcription service.
 * Manages two WebSocket connections — one for "you" (mic) and one for "them" (system audio).
 * Receives 16-bit PCM at 16kHz and streams back real-time transcripts.
 */

import type { TranscriptEntry } from '../shared/types';

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  punctuated_word?: string;
}

interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
}

interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
}

interface DeepgramResult {
  channel: DeepgramChannel;
  is_final: boolean;
  speech_final: boolean;
  from_finalize?: boolean;
}

interface DeepgramMessage {
  type: string;
  channel_index?: number[];
  duration?: number;
  start?: number;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: DeepgramChannel;
}

export type TranscriptHandler = (entry: TranscriptEntry) => void;

interface ConnectionState {
  ws: WebSocket | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  reconnectAttempts: number;
  isClosing: boolean;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY_MS = 1000;

export class TranscriptionService {
  private apiKey: string = '';
  private micConn: ConnectionState = this.emptyState();
  private systemConn: ConnectionState = this.emptyState();
  private onTranscript: TranscriptHandler | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setHandler(handler: TranscriptHandler) {
    this.onTranscript = handler;
  }

  async startMic(): Promise<void> {
    this.micConn = await this.connect('you', this.micConn);
  }

  async startSystem(): Promise<void> {
    this.systemConn = await this.connect('them', this.systemConn);
  }

  sendMicAudio(pcmBuffer: ArrayBuffer): void {
    this.sendAudio(this.micConn, pcmBuffer);
  }

  sendSystemAudio(pcmBuffer: ArrayBuffer): void {
    this.sendAudio(this.systemConn, pcmBuffer);
  }

  stopMic(): void {
    this.close(this.micConn);
    this.micConn = this.emptyState();
  }

  stopSystem(): void {
    this.close(this.systemConn);
    this.systemConn = this.emptyState();
  }

  stopAll(): void {
    this.stopMic();
    this.stopSystem();
  }

  get isMicConnected(): boolean {
    return this.micConn.ws?.readyState === WebSocket.OPEN;
  }

  get isSystemConnected(): boolean {
    return this.systemConn.ws?.readyState === WebSocket.OPEN;
  }

  private emptyState(): ConnectionState {
    return { ws: null, reconnectTimer: null, reconnectAttempts: 0, isClosing: false };
  }

  private buildUrl(): string {
    const params = new URLSearchParams({
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '1',
      model: 'nova-3',
      punctuate: 'true',
      interim_results: 'true',
      utterance_end_ms: '1500',
      smart_format: 'true',
    });
    return `${DEEPGRAM_WS_URL}?${params.toString()}`;
  }

  private async connect(
    speaker: 'you' | 'them',
    state: ConnectionState
  ): Promise<ConnectionState> {
    this.close(state);

    if (!this.apiKey) {
      console.error('Deepgram API key not set');
      return this.emptyState();
    }

    const newState: ConnectionState = {
      ws: null,
      reconnectTimer: null,
      reconnectAttempts: 0,
      isClosing: false,
    };

    return new Promise((resolve) => {
      const url = this.buildUrl();
      const ws = new WebSocket(url, ['token', this.apiKey]);

      ws.onopen = () => {
        newState.reconnectAttempts = 0;
        newState.ws = ws;
        resolve(newState);
      };

      ws.onmessage = (event) => {
        try {
          const msg: DeepgramMessage = JSON.parse(event.data as string);
          if (msg.type === 'Results' && msg.channel) {
            const alt = msg.channel.alternatives[0];
            if (alt && alt.transcript) {
              this.onTranscript?.({
                speaker,
                text: alt.transcript,
                timestamp: Date.now(),
                isFinal: msg.is_final ?? false,
              });
            }
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = (err) => {
        console.error(`Deepgram [${speaker}] error:`, err);
      };

      ws.onclose = () => {
        if (!newState.isClosing) {
          this.scheduleReconnect(speaker, newState);
        }
      };

      // Timeout if connection takes too long
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          resolve(newState);
        }
      }, 5000);
    });
  }

  private scheduleReconnect(speaker: 'you' | 'them', state: ConnectionState): void {
    if (state.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Deepgram [${speaker}] max reconnect attempts reached`);
      return;
    }

    const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, state.reconnectAttempts);
    state.reconnectAttempts++;

    state.reconnectTimer = setTimeout(async () => {
      const newState = await this.connect(speaker, state);
      if (speaker === 'you') {
        this.micConn = newState;
      } else {
        this.systemConn = newState;
      }
    }, delay);
  }

  private sendAudio(state: ConnectionState, pcmBuffer: ArrayBuffer): void {
    if (state.ws?.readyState === WebSocket.OPEN) {
      state.ws.send(pcmBuffer);
    }
  }

  private close(state: ConnectionState): void {
    state.isClosing = true;
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
    }
    if (state.ws) {
      if (state.ws.readyState === WebSocket.OPEN) {
        // Send close message per Deepgram protocol
        state.ws.send(JSON.stringify({ type: 'CloseStream' }));
      }
      state.ws.close();
    }
  }
}

export const transcriptionService = new TranscriptionService();
