/**
 * CoachingService orchestrates LLM calls for real-time coaching.
 * - Triggers on each finalized utterance, debounced to max once per 3s
 * - Streams LLM responses to the UI
 * - Cancels in-flight requests when a new utterance arrives
 */

import type { LLMProvider } from './llm/provider';
import type { CoachingSuggestion, TranscriptEntry } from '../shared/types';
import { GeminiProvider } from './llm/gemini';
import { GrokProvider } from './llm/grok';
import { ClaudeProvider } from './llm/claude';
import { OpenAIProvider } from './llm/openai';
import { COACHING_DEBOUNCE_MS } from '../shared/constants';

export type SuggestionHandler = (suggestion: CoachingSuggestion, isStreaming: boolean) => void;

interface ProviderConfig {
  provider: string;
  apiKeys: Record<string, string>;
}

export class CoachingService {
  private provider: LLMProvider | null = null;
  private methodology: string = 'general';
  private methodologyPrompt: string = '';
  private onSuggestion: SuggestionHandler | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private lastCallTime = 0;
  private suggestionId = 0;

  setHandler(handler: SuggestionHandler) {
    this.onSuggestion = handler;
  }

  setMethodology(name: string, prompt: string) {
    this.methodology = name;
    this.methodologyPrompt = prompt;
  }

  configure(config: ProviderConfig) {
    const { provider, apiKeys } = config;
    switch (provider) {
      case 'gemini':
        this.provider = apiKeys.gemini ? new GeminiProvider(apiKeys.gemini) : null;
        break;
      case 'grok':
        this.provider = apiKeys.grok ? new GrokProvider(apiKeys.grok) : null;
        break;
      case 'claude':
        this.provider = apiKeys.claude ? new ClaudeProvider(apiKeys.claude) : null;
        break;
      case 'openai':
        this.provider = apiKeys.openai ? new OpenAIProvider(apiKeys.openai) : null;
        break;
      default:
        this.provider = null;
    }
  }

  /**
   * Called when a new finalized utterance arrives.
   * Debounces to avoid flooding the LLM.
   */
  onUtterance(entry: TranscriptEntry, formattedTranscript: string) {
    if (!entry.isFinal || !this.provider) return;

    // Cancel any pending debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const timeSinceLastCall = Date.now() - this.lastCallTime;
    const delay = Math.max(0, COACHING_DEBOUNCE_MS - timeSinceLastCall);

    this.debounceTimer = setTimeout(() => {
      this.callLLM(entry, formattedTranscript);
    }, delay);
  }

  /** Cancel any in-flight LLM request */
  cancel() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  private async callLLM(entry: TranscriptEntry, formattedTranscript: string) {
    if (!this.provider) return;

    // Cancel previous in-flight request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    this.lastCallTime = Date.now();

    const systemPrompt = this.buildSystemPrompt();
    const id = String(++this.suggestionId);

    const suggestion: CoachingSuggestion = {
      id,
      bullets: [],
      timestamp: Date.now(),
      methodology: this.methodology,
    };

    let accumulated = '';

    try {
      const stream = this.provider.streamCoaching({
        systemPrompt,
        transcript: formattedTranscript,
        latestUtterance: entry.text,
        speaker: entry.speaker,
      });

      for await (const chunk of stream) {
        if (this.abortController?.signal.aborted) return;

        accumulated += chunk;
        // Parse bullets from accumulated text
        suggestion.bullets = this.parseBullets(accumulated);
        this.onSuggestion?.({ ...suggestion }, true);
      }

      // Final emit
      suggestion.bullets = this.parseBullets(accumulated);
      if (suggestion.bullets.length > 0) {
        this.onSuggestion?.({ ...suggestion }, false);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Coaching LLM error:', err);
    }
  }

  private buildSystemPrompt(): string {
    const base = `You are a real-time conversation coach using the ${this.methodology} methodology.

Rules:
- Respond with 2-4 bullet points only
- Each bullet must be max 12 words
- Focus on what to ASK or DO next
- Be specific and actionable
- Do not repeat previous suggestions`;

    if (this.methodologyPrompt) {
      return `${base}\n\nMethodology details:\n${this.methodologyPrompt}`;
    }
    return base;
  }

  /** Parse bullet points from streamed text. Handles •, -, *, numbered formats. */
  private parseBullets(text: string): string[] {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    const bullets: string[] = [];

    for (const line of lines) {
      // Strip bullet markers: •, -, *, 1., 1)
      const cleaned = line
        .replace(/^[\•\-\*]\s*/, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .trim();

      if (cleaned.length > 0) {
        bullets.push(cleaned);
      }
    }

    return bullets.slice(0, 4); // max 4 bullets
  }
}

export const coachingService = new CoachingService();
