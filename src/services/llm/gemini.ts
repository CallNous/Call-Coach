import type { LLMProvider, CoachingParams } from './provider';

export class GeminiProvider implements LLMProvider {
  name = 'Gemini Flash-Lite';

  constructor(private apiKey: string) {}

  async *streamCoaching(params: CoachingParams): AsyncIterable<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${params.systemPrompt}\n\n${params.transcript}\n\n[${params.speaker === 'you' ? 'You' : 'Them'}]: "${params.latestUtterance}"\n\nCoach now:` }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
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
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) yield text;
            } catch {}
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
