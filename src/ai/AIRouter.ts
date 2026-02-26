import { Request, Response } from 'express';
import { AIProvider, AIMessage } from './providers/AIProvider';
import { OpenAIProvider, OpenAIProviderOptions } from './providers/OpenAIProvider';
import { AnthropicProvider, AnthropicProviderOptions } from './providers/AnthropicProvider';
import { OllamaProvider, OllamaProviderOptions } from './providers/OllamaProvider';

export type ProviderName = 'openai' | 'anthropic' | 'ollama';

export interface AIRouteOptions {
  /** Provider to use */
  provider?: ProviderName;
  /** Model override */
  model?: string;
  /** System prompt injected before user messages */
  systemPrompt?: string;
  /** Enable SSE streaming (default: true) */
  stream?: boolean;
  /** Max tokens */
  maxTokens?: number;
  /** Temperature (0-1) */
  temperature?: number;
  /** Token usage tracking in audit log */
  trackUsage?: boolean;
  /** Custom middleware to run before handler */
  middleware?: Array<(req: Request, res: Response, next: () => void) => void>;
}

export interface AIManagerOptions {
  defaultProvider?: ProviderName;
  openai?: OpenAIProviderOptions;
  anthropic?: AnthropicProviderOptions;
  ollama?: OllamaProviderOptions;
}

export class AIManager {
  private providers = new Map<string, AIProvider>();
  private defaultProvider: ProviderName;

  constructor(options: AIManagerOptions = {}) {
    this.defaultProvider = options.defaultProvider || 'openai';

    if (options.openai) {
      this.providers.set('openai', new OpenAIProvider(options.openai));
    }
    if (options.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider(options.anthropic));
    }
    if (options.ollama !== undefined) {
      this.providers.set('ollama', new OllamaProvider(options.ollama || {}));
    }
  }

  registerProvider(name: string, provider: AIProvider): void {
    this.providers.set(name, provider);
  }

  getProvider(name?: string): AIProvider {
    const key = name || this.defaultProvider;
    const provider = this.providers.get(key);
    if (!provider) {
      throw new Error(
        `AI provider '${key}' is not configured. Add it to createServer({ ai: { ${key}: { ... } } })`
      );
    }
    return provider;
  }

  /**
   * Creates an Express route handler for chat completions with streaming support.
   * Client sends: { messages: AIMessage[], model?: string }
   * Server returns: SSE stream of text chunks, or JSON for non-streaming.
   */
  createRouteHandler(options: AIRouteOptions = {}): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        const { messages = [], model } = req.body as {
          messages?: AIMessage[];
          model?: string;
        };

        if (!Array.isArray(messages) || messages.length === 0) {
          res.status(400).json({ error: 'messages array is required' });
          return;
        }

        const provider = this.getProvider(options.provider);
        const shouldStream = options.stream !== false;

        const completionOptions = {
          messages,
          model: model || options.model,
          systemPrompt: options.systemPrompt,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
        };

        if (shouldStream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('X-Accel-Buffering', 'no');

          for await (const chunk of provider.stream(completionOptions)) {
            res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
          }

          res.write('data: [DONE]\n\n');
          res.end();
        } else {
          const result = await provider.complete(completionOptions);
          res.json({ success: true, ...result });
        }
      } catch (error: unknown) {
        if (!res.headersSent) {
          const message = error instanceof Error ? error.message : 'AI completion failed';
          res.status(500).json({ error: message });
        }
      }
    };
  }

  /** Programmatic completion (server-side use) */
  async complete(
    messages: AIMessage[],
    options: Omit<AIRouteOptions, 'stream' | 'middleware'> = {}
  ): Promise<string> {
    const provider = this.getProvider(options.provider);
    const result = await provider.complete({
      messages,
      model: options.model,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });
    return result.content;
  }

  /** Programmatic streaming (server-side use) */
  stream(
    messages: AIMessage[],
    options: Omit<AIRouteOptions, 'stream' | 'middleware'> = {}
  ): AsyncIterable<string> {
    const provider = this.getProvider(options.provider);
    return provider.stream({
      messages,
      model: options.model,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });
  }
}

let globalAIManager: AIManager | null = null;

export const initAI = (options: AIManagerOptions): AIManager => {
  globalAIManager = new AIManager(options);
  return globalAIManager;
};

export const getAI = (): AIManager => {
  if (!globalAIManager) throw new Error('AI not initialized. Call initAI() first.');
  return globalAIManager;
};
