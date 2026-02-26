import { DatabaseAdapter } from '../DatabaseAdapter';

export class RedisAdapter implements DatabaseAdapter {
  private client: unknown = null;
  private connected = false;

  async connect(url: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { default: Redis } = await import('ioredis' as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client = new (Redis as any)(url);
      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.client as any).once('ready', () => {
          this.connected = true;
          resolve();
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.client as any).once('error', reject);
      });
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        (e as { code?: string }).code === 'MODULE_NOT_FOUND'
      ) {
        throw new Error('Redis adapter requires ioredis. Run: npm install ioredis');
      }
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).quit();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getClient(): unknown {
    if (!this.client) throw new Error('Redis client not initialized');
    return this.client;
  }
}
