import mongoose from 'mongoose';
import { DatabaseAdapter } from '../DatabaseAdapter';

export class MongooseAdapter implements DatabaseAdapter {
  private connected = false;

  async connect(url: string): Promise<void> {
    await mongoose.connect(url);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    await mongoose.disconnect();
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && mongoose.connection.readyState === 1;
  }

  getClient(): typeof mongoose {
    return mongoose;
  }
}
