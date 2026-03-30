import type { LLMProvider, CoachingParams } from './provider';

export class ClaudeProvider implements LLMProvider {
  name = 'Claude Haiku';

  constructor(private apiKey: string) {}

  async *streamCoaching(params: CoachingParams): AsyncIterable<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        stream: true,
        system: params.systemPrompt,
        messages: [
          {
            role: 'user',
            content: `${params.transcript}\n\n[${params.speaker === 'you' ? 'You' : 'Them'}]: "${params.latestUtterance}"\n\nCoach now:`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                yield parsed.delta.text;
              }
            } catch {}
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
