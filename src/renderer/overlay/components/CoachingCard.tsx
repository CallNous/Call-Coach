import React from 'react';
import type { CoachingSuggestion } from '../../../shared/types';

interface Props {
  suggestion: CoachingSuggestion;
}

export default function CoachingCard({ suggestion }: Props) {
  return (
    <div className="rounded-lg bg-black/85 px-4 py-3 text-white shadow-lg animate-in fade-in duration-300">
      <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
        {suggestion.methodology}
      </div>
      <ul className="space-y-1">
        {suggestion.bullets.map((bullet, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-snug">
            <span className="mt-1 text-blue-400">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
