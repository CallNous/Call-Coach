import React from 'react';

interface Props {
  isActive: boolean;
  isRecording: boolean;
  micLevel?: number;
  systemLevel?: number;
  methodology?: string;
}

function LevelBar({ level, label }: { level: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-white/40 w-7">{label}</span>
      <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-green-500 transition-all duration-75"
          style={{ width: `${Math.round(level * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function StatusIndicator({ isActive, isRecording, micLevel = 0, systemLevel = 0, methodology }: Props) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-black/80 px-3 py-2 text-xs text-white/70">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            isRecording ? 'bg-red-500 animate-pulse' : isActive ? 'bg-green-500' : 'bg-gray-500'
          }`}
        />
        <span>
          {isRecording ? 'Recording' : isActive ? 'Coaching Active' : 'Paused'}
        </span>
      </div>
      {methodology && isActive && (
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
          {methodology}
        </span>
      )}
      {isRecording && (
        <div className="flex gap-3 ml-auto">
          <LevelBar level={micLevel} label="You" />
          <LevelBar level={systemLevel} label="Them" />
        </div>
      )}
    </div>
  );
}
