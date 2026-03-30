import type { LLMProvider, CoachingParams } from './provider';
import { readSSEStream } from './provider';

/** Grok uses an OpenAI-compatible API */
export class GrokProvider implements LLMProvider {
  name = 'Grok Fast';

  constructor(private apiKey: string) {}

  async *streamCoaching(params: CoachingParams): AsyncIterable<string> {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        stream: true,
        max_tokens: 200,
        temperature: 0.7,
        messages: [
          { role: 'system', content: params.systemPrompt },
          {
            role: 'user',
            content: `${params.transcript}\n\n[${params.speaker === 'you' ? 'You' : 'Them'}]: "${params.latestUtterance}"\n\nCoach now:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    yield* readSSEStream(response);
  }
}
