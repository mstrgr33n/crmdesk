const Redis = require('redis');
const config = require('../configs/config');

class RedisService {
  constructor() {
    this.client = Redis.createClient({
      url: config.redis.url
    });
    
    this.client.on('error', (err) => console.log('Redis Client Error', err));
  }

  async connect() {
    await this.client.connect();
  }

  async setLock(objectId, userName) {
    await this.client.set(`lock:${objectId}`, userName, { EX: 60 * 5 });
  }

  async removeLock(objectId) {
    await this.client.del(`lock:${objectId}`);
  }

  async getLocks(pattern = 'lock:*') {
    return await this.client.keys(pattern);
  }

  async getLockOwner(key) {
    return await this.client.get(key);
  }
 
  async getKeys(pattern) {
    return await this.client.keys(pattern);
  }

  async get(key) {
    return await this.client.get(key);
  }

  async set(key, value) {
    await this.client.set(key, value);
  }

  async remove(key) {
    return await this.client.del(key);
  }
}

module.exports = new RedisService();