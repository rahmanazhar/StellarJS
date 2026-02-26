/* eslint-disable @typescript-eslint/no-explicit-any */
// Dynamic require() for optional peer dependency — types are unavailable at compile time
import { Server as HttpServer } from 'http';
import { createLogger } from '../utils/helpers';

const logger = createLogger('StellarWebSocket');

export interface ChannelOptions {
  /** Require JWT auth to join (default: false) */
  auth?: boolean;
  /** Custom auth validator */
  authValidator?: (token: string) => Promise<boolean>;
  /** Max connections per channel */
  maxConnections?: number;
  /** Namespace (default: '/') */
  namespace?: string;
}

export interface ChannelHandler {
  (socket: any, user?: any): void;
}

export interface WebSocketOptions {
  /** CORS origins */
  cors?: { origin: string | string[]; credentials?: boolean };
  /** Max payload size in bytes */
  maxHttpBufferSize?: number;
  /** Ping interval */
  pingInterval?: number;
  /** Ping timeout */
  pingTimeout?: number;
}

export class StellarWebSocket {
  private io: any;
  private channels = new Map<string, { options: ChannelOptions; handler: ChannelHandler }>();

  constructor(httpServer: HttpServer, options: WebSocketOptions = {}) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Server } = require('socket.io');
      this.io = new Server(httpServer, {
        cors: options.cors || { origin: '*', credentials: true },
        maxHttpBufferSize: options.maxHttpBufferSize || 1e6,
        pingInterval: options.pingInterval || 25000,
        pingTimeout: options.pingTimeout || 20000,
      });

      this.setupGlobalMiddleware();
      logger.info('WebSocket server initialized');
    } catch (e: any) {
      if (e.code === 'MODULE_NOT_FOUND') {
        throw new Error('WebSocket requires socket.io. Run: npm install socket.io');
      }
      throw e;
    }
  }

  private setupGlobalMiddleware(): void {
    this.io.use(async (socket: any, next: (err?: Error) => void) => {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      socket.data.token = token;
      next();
    });

    this.io.on('connection', (socket: any) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join', async (channelName: string) => {
        const channel = this.channels.get(channelName);
        if (!channel) {
          socket.emit('error', { message: `Channel '${channelName}' not found` });
          return;
        }

        if (channel.options.auth) {
          const token = socket.data.token;
          if (!token) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }
          if (channel.options.authValidator) {
            const valid = await channel.options.authValidator(token);
            if (!valid) {
              socket.emit('error', { message: 'Invalid token' });
              return;
            }
          }
        }

        await socket.join(channelName);
        channel.handler(socket, socket.data.user);
        socket.emit('joined', { channel: channelName });
      });

      socket.on('disconnect', (reason: string) => {
        logger.info(`Client disconnected: ${socket.id} (${reason})`);
      });
    });
  }

  /** Register a named channel with a handler */
  createChannel(name: string, options: ChannelOptions, handler: ChannelHandler): void {
    this.channels.set(name, { options, handler });
    logger.info(`Channel '${name}' registered`);
  }

  /** Broadcast to all clients in a channel */
  broadcast(channel: string, event: string, data: any): void {
    this.io.to(channel).emit(event, data);
  }

  /** Emit to all connected clients */
  emit(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /** Get connected client count */
  getConnectionCount(): number {
    return this.io.engine.clientsCount;
  }

  /** Get the raw Socket.IO server instance */
  getIO(): any {
    return this.io;
  }

  getChannelNames(): string[] {
    return Array.from(this.channels.keys());
  }
}

let globalWS: StellarWebSocket | null = null;

export const initWebSocket = (
  httpServer: HttpServer,
  options?: WebSocketOptions
): StellarWebSocket => {
  globalWS = new StellarWebSocket(httpServer, options);
  return globalWS;
};

export const getWebSocket = (): StellarWebSocket => {
  if (!globalWS) throw new Error('WebSocket not initialized. Call initWebSocket() first.');
  return globalWS;
};
