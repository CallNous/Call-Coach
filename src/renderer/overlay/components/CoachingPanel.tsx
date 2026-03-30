import React from 'react';
import CoachingCard from './CoachingCard';
import type { CoachingSuggestion } from '../../../shared/types';

interface Props {
  suggestions: CoachingSuggestion[];
  isThinking: boolean;
}

export default function CoachingPanel({ suggestions, isThinking }: Props) {
  if (suggestions.length === 0 && !isThinking) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {suggestions.map((suggestion) => (
        <CoachingCard key={suggestion.id} suggestion={suggestion} />
      ))}
      {isThinking && suggestions.length === 0 && (
        <div className="rounded-lg bg-black/85 px-4 py-3 text-white/40 text-xs animate-pulse">
          Thinking...
        </div>
      )}
    </div>
  );
}
