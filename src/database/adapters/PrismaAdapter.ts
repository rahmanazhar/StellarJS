import { DatabaseAdapter } from '../DatabaseAdapter';

export class PrismaAdapter implements DatabaseAdapter {
  private client: unknown = null;
  private connected = false;

  async connect(_url: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { PrismaClient } = await import('@prisma/client' as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.client = new (PrismaClient as any)();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).$connect();
      this.connected = true;
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        (e as { code?: string }).code === 'MODULE_NOT_FOUND'
      ) {
        throw new Error(
          'Prisma adapter requires @prisma/client. Run: npm install @prisma/client && npx prisma generate'
        );
      }
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).$disconnect();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getClient(): unknown {
    if (!this.client) throw new Error('Prisma client not initialized');
    return this.client;
  }
}
