import React, { useState, useEffect } from 'react';
import CoachingPanel from './components/CoachingPanel';
import StatusIndicator from './components/StatusIndicator';

declare global {
  interface Window {
    callCoach: {
      setIgnoreMouseEvents: (ignore: boolean) => void;
      onCoachingToggle: (cb: () => void) => () => void;
      onRecordingToggle: (cb: () => void) => () => void;
      onMethodologyCycle: (cb: () => void) => () => void;
    };
  }
}

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

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

  return (
    <div
      className="h-screen w-screen select-none"
      onMouseEnter={() => window.callCoach.setIgnoreMouseEvents(false)}
      onMouseLeave={() => window.callCoach.setIgnoreMouseEvents(true)}
    >
      <div className="flex flex-col gap-3 p-4">
        <StatusIndicator isActive={isActive} isRecording={isRecording} />
        {isActive && <CoachingPanel />}
      </div>
    </div>
  );
}
