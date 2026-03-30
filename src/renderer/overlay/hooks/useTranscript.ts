import { useState, useEffect, useCallback, useRef } from 'react';
import { transcriptionService } from '../../../services/transcription';
import { transcriptManager } from '../../../services/transcript-manager';
import type { TranscriptEntry } from '../../../shared/types';
import type { AudioSource } from '../../../services/audio-capture';

export interface TranscriptState {
  entries: TranscriptEntry[];
  lastFinal: TranscriptEntry | null;
  isConnected: boolean;
}

export function useTranscript() {
  const [state, setState] = useState<TranscriptState>({
    entries: [],
    lastFinal: null,
    isConnected: false,
  });

  useEffect(() => {
    transcriptionService.setHandler((entry) => {
      transcriptManager.addEntry(entry);
      setState({
        entries: transcriptManager.getRecentEntries(),
        lastFinal: entry.isFinal ? entry : transcriptManager.getLastFinalEntry(),
        isConnected: transcriptionService.isMicConnected || transcriptionService.isSystemConnected,
      });
    });
  }, []);

  const start = useCallback(async (apiKey: string) => {
    transcriptionService.setApiKey(apiKey);
    await Promise.all([
      transcriptionService.startMic(),
      transcriptionService.startSystem(),
    ]);
    setState((prev) => ({ ...prev, isConnected: true }));
  }, []);

  const stop = useCallback(() => {
    transcriptionService.stopAll();
    setState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  /** Route PCM from audio capture to the correct Deepgram connection */
  const handlePCM = useCallback((source: AudioSource, buffer: ArrayBuffer) => {
    if (source === 'mic') {
      transcriptionService.sendMicAudio(buffer);
    } else {
      transcriptionService.sendSystemAudio(buffer);
    }
  }, []);

  const clear = useCallback(() => {
    transcriptManager.clear();
    setState({ entries: [], lastFinal: null, isConnected: state.isConnected });
  }, [state.isConnected]);

  const getFormattedTranscript = useCallback(() => {
    return transcriptManager.getFormattedTranscript();
  }, []);

  return { ...state, start, stop, handlePCM, clear, getFormattedTranscript };
}
