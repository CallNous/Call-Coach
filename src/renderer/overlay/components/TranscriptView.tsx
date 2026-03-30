import React, { useRef, useEffect } from 'react';
import type { TranscriptEntry } from '../../../shared/types';

interface Props {
  entries: TranscriptEntry[];
  maxVisible?: number;
}

export default function TranscriptView({ entries, maxVisible = 6 }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Show only recent final + current interim entries
  const visible = entries.slice(-maxVisible);

  if (visible.length === 0) {
    return (
      <div className="rounded-lg bg-black/70 px-3 py-2 text-xs text-white/30 italic">
        Waiting for speech...
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-col gap-1 rounded-lg bg-black/70 px-3 py-2 max-h-40 overflow-y-auto"
    >
      {visible.map((entry, i) => (
        <div
          key={`${entry.timestamp}-${i}`}
          className={`text-xs leading-relaxed ${
            entry.isFinal ? 'text-white/80' : 'text-white/40 italic'
          }`}
        >
          <span
            className={`font-semibold ${
              entry.speaker === 'you' ? 'text-blue-400' : 'text-emerald-400'
            }`}
          >
            [{entry.speaker === 'you' ? 'You' : 'Them'}]
          </span>{' '}
          {entry.text}
        </div>
      ))}
    </div>
  );
}
