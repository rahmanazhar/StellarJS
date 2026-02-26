export interface DatabaseAdapter {
  connect(url: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getClient(): unknown;
}

export interface DatabaseConfig {
  adapter: 'mongoose' | 'prisma' | 'redis' | 'drizzle';
  url: string;
  options?: Record<string, unknown>;
}

let globalAdapter: DatabaseAdapter | null = null;

export const initDatabaseAdapter = async (config: DatabaseConfig): Promise<DatabaseAdapter> => {
  let adapter: DatabaseAdapter;

  switch (config.adapter) {
    case 'mongoose': {
      const { MongooseAdapter } = await import('./adapters/MongooseAdapter');
      adapter = new MongooseAdapter();
      break;
    }
    case 'prisma': {
      const { PrismaAdapter } = await import('./adapters/PrismaAdapter');
      adapter = new PrismaAdapter();
      break;
    }
    case 'redis': {
      const { RedisAdapter } = await import('./adapters/RedisAdapter');
      adapter = new RedisAdapter();
      break;
    }
    default:
      throw new Error(`Unknown database adapter: ${config.adapter}`);
  }

  await adapter.connect(config.url);
  globalAdapter = adapter;
  return adapter;
};

export const getDatabaseAdapter = (): DatabaseAdapter => {
  if (!globalAdapter)
    throw new Error('Database adapter not initialized. Call initDatabaseAdapter first.');
  return globalAdapter;
};
