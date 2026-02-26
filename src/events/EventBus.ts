import { EventEmitter } from 'events';

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface TypedEventMap {
  [event: string]: unknown;
}

export class EventBus<TEvents extends TypedEventMap = TypedEventMap> {
  private emitter: EventEmitter;
  private static instance: EventBus;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void {
    this.emitter.on(event as string, handler);
    return () => this.emitter.off(event as string, handler);
  }

  once<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    this.emitter.once(event as string, handler);
  }

  emit<K extends keyof TEvents>(event: K, payload?: TEvents[K]): void {
    this.emitter.emit(event as string, payload);
  }

  off<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void {
    this.emitter.off(event as string, handler);
  }

  removeAllListeners(event?: keyof TEvents): void {
    this.emitter.removeAllListeners(event as string | undefined);
  }

  listenerCount(event: keyof TEvents): number {
    return this.emitter.listenerCount(event as string);
  }
}

let globalEventBus: EventBus | null = null;

export const initEventBus = (): EventBus => {
  globalEventBus = EventBus.getInstance();
  return globalEventBus;
};

export const getEventBus = (): EventBus => {
  if (!globalEventBus) {
    globalEventBus = EventBus.getInstance();
  }
  return globalEventBus;
};

// Convenience helpers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stellarOn = <T = any>(event: string, handler: EventHandler<T>): (() => void) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEventBus().on(event, handler as EventHandler<any>);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const stellarEmit = <T = any>(event: string, payload?: T): void =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getEventBus().emit(event, payload as any);
