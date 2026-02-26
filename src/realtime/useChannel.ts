/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseChannelOptions {
  /** WebSocket server URL (default: window.location.origin) */
  url?: string;
  /** Auth token */
  token?: string;
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Auto-reconnect on disconnect (default: true) */
  reconnect?: boolean;
  /** Reconnect delay in ms (default: 2000) */
  reconnectDelay?: number;
}

export interface UseChannelReturn<T = any> {
  isConnected: boolean;
  messages: T[];
  send: (event: string, data: any) => void;
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
  connect: () => void;
  disconnect: () => void;
  error: Error | null;
}

export const useChannel = <T = any>(
  channelName: string,
  options: UseChannelOptions = {}
): UseChannelReturn<T> => {
  const { url, token, autoConnect = true, reconnect = true, reconnectDelay = 2000 } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<any>(null);
  const handlersRef = useRef<Map<string, Array<(data: any) => void>>>(new Map());

  const connect = useCallback(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { io } = require('socket.io-client');
      const serverUrl =
        url || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

      socketRef.current = io(serverUrl, {
        auth: token ? { token } : undefined,
        reconnection: reconnect,
        reconnectionDelay: reconnectDelay,
        transports: ['websocket', 'polling'],
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        setError(null);
        socketRef.current.emit('join', channelName);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });

      socketRef.current.on('error', (err: any) => {
        setError(new Error(err.message || 'WebSocket error'));
      });

      socketRef.current.on('message', (data: T) => {
        setMessages((prev) => [...prev, data]);
      });

      // Re-attach any handlers registered before connect
      handlersRef.current.forEach((handlers, event) => {
        handlers.forEach((handler) => socketRef.current.on(event, handler));
      });
    } catch (e: any) {
      if (e.code === 'MODULE_NOT_FOUND') {
        setError(
          new Error('useChannel requires socket.io-client. Run: npm install socket.io-client')
        );
      } else {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  }, [channelName, url, token, reconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    if (!handlersRef.current.has(event)) handlersRef.current.set(event, []);
    const handlers = handlersRef.current.get(event);
    if (handlers) handlers.push(handler);
    if (socketRef.current) socketRef.current.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (data: any) => void) => {
    const handlers = handlersRef.current.get(event) || [];
    handlersRef.current.set(
      event,
      handlers.filter((h) => h !== handler)
    );
    if (socketRef.current) socketRef.current.off(event, handler);
  }, []);

  useEffect(() => {
    if (autoConnect) connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isConnected, messages, send, on, off, connect, disconnect, error };
};
