import type { LLMProvider, CoachingParams } from './provider';
import { readSSEStream } from './provider';

export class OpenAIProvider implements LLMProvider {
  name = 'GPT Mini';

  constructor(private apiKey: string) {}

  async *streamCoaching(params: CoachingParams): AsyncIterable<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    yield* readSSEStream(response);
  }
}
