import { useState, useCallback, useRef } from 'react';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface UseAIOptions {
  /** Endpoint to POST messages to (default: /api/ai/chat) */
  endpoint?: string;
  /** Initial system prompt */
  systemPrompt?: string;
  /** Model to use */
  model?: string;
  /** Called when streaming starts */
  onStart?: () => void;
  /** Called with each streamed chunk */
  onChunk?: (chunk: string) => void;
  /** Called when generation completes */
  onComplete?: (fullResponse: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

export interface UseAIReturn {
  messages: AIMessage[];
  isStreaming: boolean;
  error: Error | null;
  send: (content: string) => Promise<void>;
  reset: () => void;
  abort: () => void;
}

export const useAI = (options: UseAIOptions = {}): UseAIReturn => {
  const {
    endpoint = '/api/ai/chat',
    systemPrompt,
    model,
    onStart,
    onChunk,
    onComplete,
    onError,
  } = options;

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (content: string): Promise<void> => {
      if (isStreaming) return;

      const userMessage: AIMessage = { role: 'user', content };
      const newMessages = [...messages, userMessage];

      setMessages(newMessages);
      setIsStreaming(true);
      setError(null);
      onStart?.();

      abortControllerRef.current = new AbortController();

      try {
        const payload: Record<string, unknown> = { messages: newMessages };
        if (model) payload.model = model;

        const messagesWithSystem: AIMessage[] = systemPrompt
          ? [{ role: 'system', content: systemPrompt }, ...newMessages]
          : newMessages;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messagesWithSystem, model }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.statusText}`);
        }

        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('text/event-stream')) {
          // Handle SSE streaming
          if (!response.body) throw new Error('Response body is null');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let assistantContent = '';

          setMessages([...newMessages, { role: 'assistant', content: '' }]);

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data) as { content?: string };
                  if (parsed.content) {
                    assistantContent += parsed.content;
                    onChunk?.(parsed.content);
                    setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
                  }
                } catch {
                  // skip malformed SSE events
                }
              }
            }
          }

          onComplete?.(assistantContent);
        } else {
          // Non-streaming JSON response
          const data = (await response.json()) as { content?: string };
          const assistantContent = data.content || '';
          setMessages([...newMessages, { role: 'assistant', content: assistantContent }]);
          onComplete?.(assistantContent);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isStreaming, endpoint, model, systemPrompt, onStart, onChunk, onComplete, onError]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, send, reset, abort };
};
