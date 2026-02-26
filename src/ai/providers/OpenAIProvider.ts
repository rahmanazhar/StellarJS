/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { AIProvider, AICompletionOptions, AICompletionResult } from './AIProvider';

export interface OpenAIProviderOptions {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: any;
  private defaultModel: string;

  constructor(options: OpenAIProviderOptions) {
    this.defaultModel = options.defaultModel || 'gpt-4o';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: OpenAI } = require('openai');
      this.client = new OpenAI({ apiKey: options.apiKey, baseURL: options.baseURL });
    } catch (e: any) {
      if (e.code === 'MODULE_NOT_FOUND') {
        throw new Error('OpenAI provider requires the openai package. Run: npm install openai');
      }
      throw e;
    }
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const messages = this.buildMessages(options);
    const response = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature ?? 0.7,
      stream: false,
    });

    const choice = response.choices[0];
    return {
      content: choice.message.content || '',
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }

  async *stream(options: AICompletionOptions): AsyncIterable<string> {
    const messages = this.buildMessages(options);
    const stream = await this.client.chat.completions.create({
      model: options.model || this.defaultModel,
      messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature ?? 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  async listModels(): Promise<string[]> {
    const response = await this.client.models.list();
    return response.data.map((m: any) => m.id).filter((id: string) => id.startsWith('gpt'));
  }

  private buildMessages(options: AICompletionOptions): AICompletionOptions['messages'] {
    const messages = [...options.messages];
    if (options.systemPrompt && messages[0]?.role !== 'system') {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }
    return messages;
  }
}
