import { Room, ObjectModel, sequelize } from '../models';
import { IObject } from '../types';
import redisService from './redisService';

class RoomService {
  private _cache: Record<string, any[]>;
  private readonly MAX_CACHE_SIZE = 100; // Максимальное количество комнат в кеше
  private readonly CACHE_TTL = 30 * 60 * 1000; // Время жизни кеша (30 минут)
  private _lastAccess: Record<string, number> = {}; // Время последнего доступа к комнате

  constructor() {
    this._cache = {};
    
    // Запускаем периодическую очистку кеша
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Каждые 5 минут
  }

  // Геттер для доступа к кешу
  get cache(): Record<string, any[]> {
    return this._cache;
  }

  // Сеттер для установки кеша
  set cache(value: Record<string, any[]>) {
    this._cache = value;
  }

  /**
   * Очищает устаревшие данные из кеша
   */
  private cleanupCache(): void {
    const now = Date.now();
    const roomIds = Object.keys(this._cache);
    
    // Если количество комнат в кеше превышает максимальное или есть устаревшие данные
    if (roomIds.length > this.MAX_CACHE_SIZE) {
      console.log(`Cache cleanup: ${roomIds.length} rooms in cache, max is ${this.MAX_CACHE_SIZE}`);
      
      // Сортируем комнаты по времени последнего доступа
      const sortedRooms = roomIds
        .map(roomId => ({ roomId, lastAccess: this._lastAccess[roomId] || 0 }))
        .sort((a, b) => a.lastAccess - b.lastAccess);
      
      // Удаляем самые старые комнаты, оставляя только MAX_CACHE_SIZE/2
      const roomsToRemove = sortedRooms.slice(0, roomIds.length - Math.floor(this.MAX_CACHE_SIZE / 2));
      
      for (const { roomId } of roomsToRemove) {
        delete this._cache[roomId];
        delete this._lastAccess[roomId];
        console.log(`Removed room ${roomId} from cache due to cache size limit`);
      }
    }
    
    // Удаляем устаревшие данные
    for (const roomId of roomIds) {
      const lastAccess = this._lastAccess[roomId] || 0;
      if (now - lastAccess > this.CACHE_TTL) {
        delete this._cache[roomId];
        delete this._lastAccess[roomId];
        console.log(`Removed room ${roomId} from cache due to TTL expiration`);
      }
    }
  }

  /**
   * Обновляет время последнего доступа к комнате
   */
  private updateLastAccess(roomId: string): void {
    this._lastAccess[roomId] = Date.now();
  }

  async findOrCreateRoom(roomId: string): Promise<any> {
    let room = await Room.findByPk(roomId);
    if (!room) {
      room = await Room.create({ id: roomId, name: `Room ${roomId}` });
    }
    
    // Сохраняем информацию о комнате в Redis
    await this.saveRoomToRedis(roomId);
    
    // Обновляем время последнего доступа
    this.updateLastAccess(roomId);
    
    return room;
  }

  /**
   * Сохраняет информацию о комнате в Redis
   */
  private async saveRoomToRedis(roomId: string): Promise<void> {
    await redisService.set(`room:${roomId}`, roomId);
  }

  async getCachedObjects(roomId: string): Promise<any[]> {
    // Обновляем время последнего доступа
    this.updateLastAccess(roomId);
    
    if (!this._cache[roomId]) {
      const objects = await ObjectModel.findAll({
        where: { room_id: roomId },
        order: [[sequelize.literal(`(data->>'z')::INTEGER`), 'ASC']]
      });
    
      this._cache[roomId] = objects;
    }
    return this._cache[roomId];
  }

  async updateCache(roomId: string, objectId: string, data: any): Promise<void> {
    // Обновляем время последнего доступа
    this.updateLastAccess(roomId);
    
    if (!this._cache[roomId]) {
      this._cache[roomId] = [];
    }
    
    const objectIndex = this._cache[roomId].findIndex(obj => obj.id === objectId);
    if (objectIndex !== -1) {
      this._cache[roomId][objectIndex].data = data;
    } else {
      // Если объект не найден в кеше, добавляем его
      this._cache[roomId].push({
        id: objectId,
        room_id: roomId,
        data: data,
        type: data.type
      });
    }
  }

  async removeFromCache(roomId: string, objectId: string): Promise<void> {
    // Обновляем время последнего доступа
    this.updateLastAccess(roomId);
    
    if (this._cache[roomId]) {
      this._cache[roomId] = this._cache[roomId].filter(obj => obj.id !== objectId);
    }
  }

  /**
   * Очищает кеш при завершении работы
   */
  cleanup(): void {
    this._cache = {};
    this._lastAccess = {};
    console.log('Room service cache cleared');
  }
}

export default new RoomService(); 