/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { AIProvider, AICompletionOptions, AICompletionResult } from './AIProvider';

export interface AnthropicProviderOptions {
  apiKey: string;
  defaultModel?: string;
}

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: any;
  private defaultModel: string;

  constructor(options: AnthropicProviderOptions) {
    this.defaultModel = options.defaultModel || 'claude-sonnet-4-6';
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { default: Anthropic } = require('@anthropic-ai/sdk');
      this.client = new Anthropic({ apiKey: options.apiKey });
    } catch (e: any) {
      if (e.code === 'MODULE_NOT_FOUND') {
        throw new Error(
          'Anthropic provider requires @anthropic-ai/sdk. Run: npm install @anthropic-ai/sdk'
        );
      }
      throw e;
    }
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const { messages, systemPrompt } = this.buildMessages(options);
    const response = await this.client.messages.create({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages,
      stream: false,
    });

    return {
      content: response.content[0]?.type === 'text' ? response.content[0].text : '',
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  async *stream(options: AICompletionOptions): AsyncIterable<string> {
    const { messages, systemPrompt } = this.buildMessages(options);
    const stream = await this.client.messages.stream({
      model: options.model || this.defaultModel,
      max_tokens: options.maxTokens || 4096,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  private buildMessages(options: AICompletionOptions): {
    messages: Array<{ role: string; content: string }>;
    systemPrompt?: string;
  } {
    let systemPrompt = options.systemPrompt;
    const messages = options.messages.filter((m) => {
      if (m.role === 'system') {
        systemPrompt = m.content;
        return false;
      }
      return true;
    });
    return { messages, systemPrompt };
  }
}
