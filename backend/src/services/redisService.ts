import { createClient, RedisClientType } from 'redis';
import config from '../configs/config';

class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: config.redis.url
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  /**
   * Закрывает соединение с Redis
   */
  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async setLock(objectId: string, userName: string): Promise<void> {
    await this.client.set(`lock:${objectId}`, userName);
  }

  async removeLock(objectId: string): Promise<void> {
    await this.client.del(`lock:${objectId}`);
  }

  async getLocks(pattern: string = 'lock:*'): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async getLockOwner(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
 
  async getKeys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async remove(key: string): Promise<number> {
    return await this.client.del(key);
  }
}

export default new RedisService(); 