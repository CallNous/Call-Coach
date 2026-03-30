import React, { useState, useEffect, useRef } from 'react';
import CoachingPanel from './components/CoachingPanel';
import StatusIndicator from './components/StatusIndicator';
import TranscriptView from './components/TranscriptView';
import { useAudioCapture } from './hooks/useAudioCapture';
import { useTranscript } from './hooks/useTranscript';
import { useCoaching } from './hooks/useCoaching';

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
  const prevRecording = useRef(false);

  const transcript = useTranscript();
  const audio = useAudioCapture(transcript.handlePCM);
  const coaching = useCoaching();

  // Feed finalized transcript entries to the coaching service
  useEffect(() => {
    if (transcript.lastFinal && isActive) {
      coaching.onTranscriptEntry(
        transcript.lastFinal,
        transcript.getFormattedTranscript()
      );
    }
  }, [transcript.lastFinal, isActive]);

  // Listen for hotkey toggles
  useEffect(() => {
    const unsubCoaching = window.callCoach.onCoachingToggle(() => {
      setIsActive((prev) => !prev);
    });
    const unsubRecording = window.callCoach.onRecordingToggle(() => {
      setIsRecording((prev) => !prev);
    });
    return () => {
      unsubCoaching();
      unsubRecording();
    };
  }, []);

  // React to recording state changes — start/stop audio + transcription + coaching
  useEffect(() => {
    if (isRecording && !prevRecording.current) {
      (async () => {
        // Configure coaching LLM provider
        await coaching.configure();

        // Start audio capture
        audio.startAll();

        // Start transcription
        const apiKey = (await window.callCoach.getSettings('apiKeys.deepgram')) as string;
        if (apiKey) {
          transcript.start(apiKey);
        } else {
          console.warn('No Deepgram API key configured — transcription disabled');
        }

        // Auto-enable coaching when recording starts
        setIsActive(true);
      })();
    } else if (!isRecording && prevRecording.current) {
      audio.stopAll();
      transcript.stop();
      coaching.cancel();
      setIsActive(false);
    }
    prevRecording.current = isRecording;
  }, [isRecording]);

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
        {isRecording && <TranscriptView entries={transcript.entries} />}
        {isActive && (
          <CoachingPanel
            suggestions={coaching.suggestions}
            isThinking={coaching.isThinking}
          />
        )}
      </div>
    </div>
  );
}
