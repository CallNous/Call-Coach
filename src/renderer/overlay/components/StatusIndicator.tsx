import React from 'react';

interface Props {
  isActive: boolean;
  isRecording: boolean;
}

export default function StatusIndicator({ isActive, isRecording }: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-black/80 px-3 py-2 text-xs text-white/70">
      <span
        className={`h-2 w-2 rounded-full ${
          isRecording ? 'bg-red-500 animate-pulse' : isActive ? 'bg-green-500' : 'bg-gray-500'
        }`}
      />
      <span>
        {isRecording ? 'Recording' : isActive ? 'Coaching Active' : 'Paused'}
      </span>
    </div>
  );
}
