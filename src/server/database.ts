import mongoose, { Connection, ConnectOptions } from 'mongoose';
import { createLogger } from '../utils/helpers';

const logger = createLogger('Database');

/**
 * Database configuration
 */
export interface DatabaseConfig {
  uri: string;
  options?: ConnectOptions;
  autoConnect?: boolean;
}

/**
 * Database connection manager
 */
export class DatabaseManager {
  private connection: Connection | null = null;
  private isConnecting: boolean = false;

  constructor(private config: DatabaseConfig) {}

  /**
   * Connect to the database
   */
  async connect(): Promise<Connection> {
    if (this.connection?.readyState === 1) {
      logger.info('Database already connected');
      return this.connection;
    }

    if (this.isConnecting) {
      logger.info('Connection already in progress, waiting...');
      return this.waitForConnection();
    }

    this.isConnecting = true;

    try {
      logger.info('Connecting to database...');
      
      const options: ConnectOptions = {
        ...this.config.options,
      };

      await mongoose.connect(this.config.uri, options);
      this.connection = mongoose.connection;

      this.setupEventHandlers();

      logger.success('Database connected successfully');
      this.isConnecting = false;

      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect(): Promise<void> {
    if (!this.connection) {
      logger.warn('No database connection to close');
      return;
    }

    try {
      await mongoose.disconnect();
      this.connection = null;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  /**
   * Get the current connection
   */
  getConnection(): Connection | null {
    return this.connection;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.readyState === 1;
  }

  /**
   * Wait for connection to be established
   */
  private waitForConnection(): Promise<Connection> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.connection?.readyState === 1) {
          clearInterval(checkInterval);
          resolve(this.connection);
        } else if (!this.isConnecting) {
          clearInterval(checkInterval);
          reject(new Error('Connection failed'));
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Connection timeout'));
      }, 30000);
    });
  }

  /**
   * Setup event handlers for connection
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('connected', () => {
      logger.info('Mongoose connected to database');
    });

    this.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    this.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from database');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      if (!this.isConnected()) {
        return {
          healthy: false,
          message: 'Database not connected'
        };
      }

      // Ping the database
      await this.connection!.db.admin().ping();

      return {
        healthy: true,
        message: 'Database connection healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

/**
 * Create a database manager instance
 */
export const createDatabaseManager = (config: DatabaseConfig): DatabaseManager => {
  return new DatabaseManager(config);
};

/**
 * Global database manager instance
 */
let globalDbManager: DatabaseManager | null = null;

/**
 * Initialize the global database manager
 */
export const initDatabase = async (config: DatabaseConfig): Promise<DatabaseManager> => {
  if (!globalDbManager) {
    globalDbManager = new DatabaseManager(config);
    
    if (config.autoConnect !== false) {
      await globalDbManager.connect();
    }
  }

  return globalDbManager;
};

/**
 * Get the global database manager
 */
export const getDatabase = (): DatabaseManager => {
  if (!globalDbManager) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return globalDbManager;
};

/**
 * Close the global database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (globalDbManager) {
    await globalDbManager.disconnect();
    globalDbManager = null;
  }
};
