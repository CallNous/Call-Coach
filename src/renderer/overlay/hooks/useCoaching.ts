import { useState, useEffect, useCallback, useRef } from 'react';
import { coachingService } from '../../../services/coaching';
import type { CoachingSuggestion, TranscriptEntry } from '../../../shared/types';

export interface CoachingState {
  suggestions: CoachingSuggestion[];
  isThinking: boolean;
}

const MAX_VISIBLE_SUGGESTIONS = 3;
const SUGGESTION_TTL_MS = 15000;

export function useCoaching() {
  const [state, setState] = useState<CoachingState>({
    suggestions: [],
    isThinking: false,
  });
  const expireTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    coachingService.setHandler((suggestion, isStreaming) => {
      setState((prev) => {
        const existing = prev.suggestions.findIndex((s) => s.id === suggestion.id);
        let next: CoachingSuggestion[];

        if (existing >= 0) {
          next = [...prev.suggestions];
          next[existing] = suggestion;
        } else {
          next = [...prev.suggestions, suggestion].slice(-MAX_VISIBLE_SUGGESTIONS);
        }

        return { suggestions: next, isThinking: isStreaming };
      });

      // Set expiry timer when streaming is done
      if (!isStreaming) {
        const timer = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            suggestions: prev.suggestions.filter((s) => s.id !== suggestion.id),
          }));
          expireTimers.current.delete(suggestion.id);
        }, SUGGESTION_TTL_MS);
        expireTimers.current.set(suggestion.id, timer);
      }
    });

    return () => {
      coachingService.cancel();
      for (const timer of expireTimers.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  /** Configure the coaching service with provider + API keys from settings */
  const configure = useCallback(async () => {
    const provider = (await window.callCoach.getSettings('llmProvider')) as string || 'gemini';
    const apiKeys: Record<string, string> = {};
    for (const key of ['gemini', 'grok', 'claude', 'openai']) {
      apiKeys[key] = (await window.callCoach.getSettings(`apiKeys.${key}`)) as string || '';
    }
    coachingService.configure({ provider, apiKeys });
  }, []);

  /** Feed a finalized transcript entry to the coaching service */
  const onTranscriptEntry = useCallback((entry: TranscriptEntry, formattedTranscript: string) => {
    coachingService.onUtterance(entry, formattedTranscript);
  }, []);

  const cancel = useCallback(() => {
    coachingService.cancel();
    setState({ suggestions: [], isThinking: false });
  }, []);

  return { ...state, configure, onTranscriptEntry, cancel };
}
