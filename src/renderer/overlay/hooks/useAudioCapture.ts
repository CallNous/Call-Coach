import { useState, useEffect, useCallback, useRef } from 'react';
import { audioCaptureService, AudioSource } from '../../../services/audio-capture';

export interface AudioState {
  isMicActive: boolean;
  isSystemActive: boolean;
  micLevel: number;
  systemLevel: number;
}

export function useAudioCapture(onPCM?: (source: AudioSource, buffer: ArrayBuffer) => void) {
  const [state, setState] = useState<AudioState>({
    isMicActive: false,
    isSystemActive: false,
    micLevel: 0,
    systemLevel: 0,
  });

  const onPCMRef = useRef(onPCM);
  onPCMRef.current = onPCM;

  useEffect(() => {
    audioCaptureService.setHandler((source, buffer) => {
      // Calculate RMS level for UI
      const pcm = new Int16Array(buffer);
      let sum = 0;
      for (let i = 0; i < pcm.length; i++) {
        const normalized = pcm[i] / 32768;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / pcm.length);
      const level = Math.min(1, rms * 5); // amplify for visual

      setState((prev) => ({
        ...prev,
        [source === 'mic' ? 'micLevel' : 'systemLevel']: level,
      }));

      onPCMRef.current?.(source, buffer);
    });

    return () => {
      audioCaptureService.stopAll();
    };
  }, []);

  const startAll = useCallback(async (micDeviceId?: string) => {
    try {
      await audioCaptureService.startMic(micDeviceId);
      setState((prev) => ({ ...prev, isMicActive: true }));
    } catch (err) {
      console.error('Failed to start mic:', err);
    }

    try {
      await audioCaptureService.startSystemAudio();
      setState((prev) => ({ ...prev, isSystemActive: true }));
    } catch (err) {
      console.error('Failed to start system audio:', err);
    }
  }, []);

  const stopAll = useCallback(async () => {
    await audioCaptureService.stopAll();
    setState({ isMicActive: false, isSystemActive: false, micLevel: 0, systemLevel: 0 });
  }, []);

  return { ...state, startAll, stopAll };
}
