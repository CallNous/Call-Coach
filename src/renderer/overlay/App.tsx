import React, { useState, useEffect, useCallback } from 'react';
import CoachingPanel from './components/CoachingPanel';
import StatusIndicator from './components/StatusIndicator';
import { useAudioCapture } from './hooks/useAudioCapture';

declare global {
  interface Window {
    callCoach: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
      getSettings: (key: string) => Promise<unknown>;
      setSettings: (key: string, value: unknown) => Promise<boolean>;
      enableLoopbackAudio: () => Promise<void>;
      disableLoopbackAudio: () => Promise<void>;
      onCoachingToggle: (cb: () => void) => () => void;
      onRecordingToggle: (cb: () => void) => () => void;
      onMethodologyCycle: (cb: () => void) => () => void;
      onAudioLevel: (cb: (data: { source: string; level: number }) => void) => () => void;
    };
  }
}

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handlePCM = useCallback((source: 'mic' | 'system', buffer: ArrayBuffer) => {
    // Will be wired to transcription service in Phase 3
  }, []);

  const audio = useAudioCapture(handlePCM);

  useEffect(() => {
    const unsubCoaching = window.callCoach.onCoachingToggle(() => {
      setIsActive((prev) => !prev);
    });
    const unsubRecording = window.callCoach.onRecordingToggle(() => {
      setIsRecording((prev) => {
        const next = !prev;
        if (next) {
          audio.startAll();
        } else {
          audio.stopAll();
        }
        return next;
      });
    });
    return () => {
      unsubCoaching();
      unsubRecording();
    };
  }, [audio.startAll, audio.stopAll]);

  return (
    <div
      className="h-screen w-screen select-none"
      onMouseEnter={() => window.callCoach.setIgnoreMouseEvents(false)}
      onMouseLeave={() => window.callCoach.setIgnoreMouseEvents(true)}
    >
      <div className="flex flex-col gap-3 p-4">
        <StatusIndicator
          isActive={isActive}
          isRecording={isRecording}
          micLevel={audio.micLevel}
          systemLevel={audio.systemLevel}
        />
        {isActive && <CoachingPanel />}
      </div>
    </div>
  );
}
