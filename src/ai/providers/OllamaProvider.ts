/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { AIProvider, AICompletionOptions, AICompletionResult } from './AIProvider';

export interface OllamaProviderOptions {
  baseURL?: string;
  defaultModel?: string;
}

export class OllamaProvider implements AIProvider {
  name = 'ollama';
  private baseURL: string;
  private defaultModel: string;

  constructor(options: OllamaProviderOptions = {}) {
    this.baseURL = options.baseURL || 'http://localhost:11434';
    this.defaultModel = options.defaultModel || 'llama3.2';
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const messages = this.buildMessages(options);
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages,
        stream: false,
        options: { temperature: options.temperature ?? 0.7 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = (await response.json()) as any;
    return {
      content: data.message?.content || '',
      model: data.model,
    };
  }

  async *stream(options: AICompletionOptions): AsyncIterable<string> {
    const messages = this.buildMessages(options);
    const response = await fetch(`${this.baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages,
        stream: true,
        options: { temperature: options.temperature ?? 0.7 },
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama stream error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      for (const line of text.split('\n').filter(Boolean)) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) yield parsed.message.content;
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseURL}/api/tags`);
    const data = (await response.json()) as any;
    return (data.models || []).map((m: any) => m.name);
  }

  private buildMessages(options: AICompletionOptions): Array<{ role: string; content: string }> {
    const messages = [...options.messages];
    if (options.systemPrompt && messages[0]?.role !== 'system') {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }
    return messages;
  }
}
