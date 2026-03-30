/**
 * Common interface for all LLM providers.
 * Each provider implements streamCoaching() which returns an async iterable of text chunks.
 */

export interface CoachingParams {
  systemPrompt: string;
  transcript: string;
  latestUtterance: string;
  speaker: 'you' | 'them';
}

export interface LLMProvider {
  name: string;
  streamCoaching(params: CoachingParams): AsyncIterable<string>;
}

/** Helper to create an SSE/streaming reader from a fetch Response */
export async function* readSSEStream(response: Response): AsyncIterable<string> {
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
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data);
            const content = extractContent(parsed);
            if (content) yield content;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function extractContent(parsed: any): string | null {
  // OpenAI / Grok format
  if (parsed.choices?.[0]?.delta?.content) {
    return parsed.choices[0].delta.content;
  }
  // Gemini format
  if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
    return parsed.candidates[0].content.parts[0].text;
  }
  // Claude format
  if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
    return parsed.delta.text;
  }
  return null;
}
