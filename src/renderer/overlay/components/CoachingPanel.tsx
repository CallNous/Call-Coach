import React from 'react';
import CoachingCard from './CoachingCard';

export default function CoachingPanel() {
  // TODO: wire up real coaching suggestions from the coaching service
  const placeholderSuggestions = [
    {
      id: '1',
      bullets: ['Ask about their timeline for the decision', 'Explore budget constraints'],
      timestamp: Date.now(),
      methodology: 'MEDDIC',
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {placeholderSuggestions.map((suggestion) => (
        <CoachingCard key={suggestion.id} suggestion={suggestion} />
      ))}
    </div>
  );
}
