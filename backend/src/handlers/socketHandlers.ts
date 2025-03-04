import { Server, Socket } from 'socket.io';
import redisService from '../services/redisService';
import roomService from '../services/roomService';
import saveService from '../services/saveService';
import { ObjectModel, Message } from '../models';
import { JoinRoomData, ObjectData, MessageData } from '../types';
import config from '../configs/config';

// Класс для ограничения скорости запросов
class RateLimiter {
  private requests: Record<string, { count: number, timestamp: number }> = {};
  private readonly WINDOW_MS = config.rateLimiter?.windowMs || 1000; // Окно времени из конфигурации
  private readonly MAX_REQUESTS = config.rateLimiter?.maxRequestsPerSecond || 50; // Максимальное количество запросов в окне

  isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests[clientId];

    if (!clientRequests) {
      this.requests[clientId] = { count: 1, timestamp: now };
      return false;
    }

    // Если прошло больше времени, чем окно, сбрасываем счетчик
    if (now - clientRequests.timestamp > this.WINDOW_MS) {
      this.requests[clientId] = { count: 1, timestamp: now };
      return false;
    }

    // Увеличиваем счетчик запросов
    clientRequests.count++;

    // Проверяем, не превышен ли лимит
    return clientRequests.count > this.MAX_REQUESTS;
  }

  // Очистка старых записей
  cleanup(): void {
    const now = Date.now();
    for (const clientId in this.requests) {
      if (now - this.requests[clientId].timestamp > this.WINDOW_MS * 10) {
        delete this.requests[clientId];
      }
    }
  }

  // Сброс счетчика запросов для конкретного клиента
  resetClientCounter(clientId: string): void {
    delete this.requests[clientId];
  }
}

class SocketHandlers {
  private io: Server;
  private rateLimiter: RateLimiter;
  private cleanupInterval: NodeJS.Timeout;

  constructor(io: Server) {
    this.io = io;
    this.rateLimiter = new RateLimiter();
    
    // Периодическая очистка данных о запросах
    this.cleanupInterval = setInterval(() => {
      this.rateLimiter.cleanup();
    }, 60000); // Каждую минуту
  }

  // Метод для очистки ресурсов при завершении работы
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  // Проверка ограничения скорости запросов
  private checkRateLimit(socket: Socket): boolean {
    const clientId = socket.id;
    if (this.rateLimiter.isRateLimited(clientId)) {
      socket.emit('error', { 
        message: 'Rate limit exceeded', 
        details: 'Too many requests, please slow down' 
      });
      return true;
    }
    return false;
  }

  // Сброс счетчика запросов для клиента
  resetRateLimit(socketId: string): void {
    this.rateLimiter.resetClientCounter(socketId);
  }

  async handleJoinRoom(socket: Socket, { roomId, userName }: JoinRoomData): Promise<{ room: any; roomId: string; userName: string }> {
    try {
      if (this.checkRateLimit(socket)) {
        throw new Error('Rate limit exceeded');
      }

      if (!roomId || !userName) {
        throw new Error('Missing required fields: roomId or userName');
      }

      const room = await roomService.findOrCreateRoom(roomId);
      socket.join(roomId);

      // Принудительно обновляем кеш из базы данных
      const objects = await ObjectModel.findAll({
        where: { room_id: roomId }
      });
      
      // Обновляем кеш в roomService
      roomService.cache[roomId] = objects;
      
      socket.emit('initialState', objects);
      socket.broadcast.to(roomId).emit('userJoined', { userName });
      return { room, roomId, userName };
    } catch (error: any) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room', details: error.message });
      throw error;
    }
  }

  async handleCreateObject(socket: Socket, data: ObjectData, roomId: string, userName: string): Promise<any> {
    try {
      if (this.checkRateLimit(socket)) {
        throw new Error('Rate limit exceeded');
      }

      // Проверяем наличие необходимых данных
      if (!data.id || !data.type) {
        throw new Error('Missing required fields: id or type');
      }
      
      // Сохраняем в Redis для быстрого доступа
      await redisService.set(`object:${data.id}`, JSON.stringify(data));
      
      // Добавляем объект в кеш roomService
      await roomService.updateCache(roomId, data.id, data);
      
      // Добавляем в очередь на сохранение в БД с дебаунсингом
      saveService.queueObjectForSave(data.id, roomId, data);
      
      // Отправляем событие другим клиентам
      socket.broadcast.to(roomId).emit('objectCreated', data);

      return data;
    } catch (error: any) {
      console.error('Error creating object:', error);
      socket.emit('error', { message: 'Failed to create object', details: error.message });
      throw error;
    }
  }

  async handleUpdateObject(socket: Socket, data: ObjectData, roomId: string): Promise<void> {
    try {
      if (this.checkRateLimit(socket)) {
        // Добавляем задержку перед следующим запросом
        setTimeout(() => {
          this.resetRateLimit(socket.id);
          socket.emit('rateLimitReset', { message: 'Rate limit has been reset' });
        }, 2000); // Задержка 2 секунды
        
        throw new Error('Rate limit exceeded');
      }

      // Проверяем наличие необходимых данных
      if (!data.id || !data.type) {
        throw new Error('Missing required fields: id or type');
      }
      
      // Обновляем в Redis
      await redisService.set(`object:${data.id}`, JSON.stringify(data));
      
      // Обновляем кеш
      await roomService.updateCache(roomId, data.id, data);
      
      // Добавляем в очередь на сохранение в БД с дебаунсингом
      saveService.queueObjectForSave(data.id, roomId, data);
      
      // Отправляем обновление другим клиентам
      socket.broadcast.to(roomId).emit('objectUpdated', data);
    } catch (error: any) {
      console.error('Error updating object:', error);
      socket.emit('error', { message: 'Failed to update object', details: error.message });
      throw error;
    }
  }

  async handleDeleteObject(socket: Socket, data: string, roomId: string): Promise<void> {
    try {
      if (this.checkRateLimit(socket)) {
        throw new Error('Rate limit exceeded');
      }

      // Проверяем наличие ID объекта
      if (!data) {
        throw new Error('Missing object ID');
      }
      
      // Удаляем объект из Redis
      await redisService.remove(`object:${data}`);
      
      // Удаляем объект из кеша
      await roomService.removeFromCache(roomId, data);
      
      // Удаляем объект из базы данных
      await ObjectModel.destroy({ where: { id: data } });
      
      // Отправляем событие другим клиентам
      socket.broadcast.to(roomId).emit('objectDeleted', data);
    } catch (error: any) {
      console.error('Error deleting object:', error);
      socket.emit('error', { message: 'Failed to delete object', details: error.message });
      throw error;
    }
  }

  async handleDisconnect(socket: Socket, roomId: string, userName: string): Promise<void> {
    try {
      this.io.to(roomId).emit('userDisconnected', { userName });
      
      // Разблокируем все объекты, заблокированные этим пользователем
      await this.unlockUserObjects(roomId, userName);
      
      const roomSockets = await this.io.in(roomId).allSockets();
      if (roomSockets.size === 0) {
        // Если в комнате не осталось пользователей, сохраняем все данные
        await saveService.saveAllObjects(roomId);
      }
    } catch (error: any) {
      console.error('Error handling disconnect:', error);
      throw error;
    }
  }
  
  // Метод для разблокировки всех объектов пользователя при отключении
  private async unlockUserObjects(roomId: string, userName: string): Promise<void> {
    try {
      // Получаем все блокировки
      const locks = await redisService.getLocks();
      
      // Проверяем каждую блокировку
      for (const lockKey of locks) {
        const lockOwner = await redisService.getLockOwner(lockKey);
        
        // Если блокировка принадлежит отключившемуся пользователю
        if (lockOwner === userName) {
          // Получаем ID объекта из ключа (формат: lock:objectId)
          const objectId = lockKey.split(':')[1];
          
          // Удаляем блокировку
          await redisService.removeLock(objectId);
          
          // Отправляем событие разблокировки всем клиентам в комнате
          this.io.to(roomId).emit('objectUnlocked', { id: objectId, userName });
          
          console.log(`Object ${objectId} unlocked due to user ${userName} disconnection`);
        }
      }
    } catch (error) {
      console.error('Error unlocking user objects:', error);
    }
  }

  async handleMessage(socket: Socket, data: MessageData, roomId: string): Promise<void> {
    try {
      if (this.checkRateLimit(socket)) {
        throw new Error('Rate limit exceeded');
      }

      if (!data.user || !data.content) {
        throw new Error('Missing required fields: user or content');
      }

      const message = await Message.create({
        room_id: roomId,
        user_name: data.user,
        message: data.content,
      });
      socket.broadcast.to(roomId).emit('newMessage', message);
    } catch (error: any) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message', details: error.message });
      throw error;
    }
  }

  async handleLockObject(socket: Socket, data: { id: string, userName: string }, roomId: string): Promise<void> {
    try {
      if (this.checkRateLimit(socket)) {
        throw new Error('Rate limit exceeded');
      }

      // Проверяем наличие необходимых данных
      if (!data.id || !data.userName) {
        throw new Error('Missing required fields: id or userName');
      }
      
      // Проверяем, не заблокирован ли уже объект другим пользователем
      const lockOwner = await redisService.getLockOwner(`lock:${data.id}`);
      if (lockOwner && lockOwner !== data.userName) {
        socket.emit('error', { 
          message: 'Object already locked', 
          details: `Object is locked by ${lockOwner}` 
        });
        return;
      }
      
      // Устанавливаем блокировку в Redis
      await redisService.setLock(data.id, data.userName);
      
      // Отправляем событие другим клиентам
      const lockData = { id: data.id, userName: data.userName };
      socket.broadcast.to(roomId).emit('objectLocked', lockData);
      
      console.log(`Object ${data.id} locked by ${data.userName}`);
    } catch (error: any) {
      console.error('Error locking object:', error);
      socket.emit('error', { message: 'Failed to lock object', details: error.message });
      throw error;
    }
  }

  async handleUnlockObject(socket: Socket, data: { id: string, userName: string }, roomId: string): Promise<void> {
    try {
      if (this.checkRateLimit(socket)) {
        throw new Error('Rate limit exceeded');
      }

      // Проверяем наличие необходимых данных
      if (!data.id || !data.userName) {
        throw new Error('Missing required fields: id or userName');
      }
      
      // Проверяем, заблокирован ли объект текущим пользователем
      const lockOwner = await redisService.getLockOwner(`lock:${data.id}`);
      if (lockOwner && lockOwner !== data.userName) {
        socket.emit('error', { 
          message: 'Cannot unlock object', 
          details: `Object is locked by ${lockOwner}` 
        });
        return;
      }
      
      // Удаляем блокировку из Redis
      await redisService.removeLock(data.id);
      
      // Отправляем событие другим клиентам
      const unlockData = { id: data.id, userName: data.userName };
      socket.broadcast.to(roomId).emit('objectUnlocked', unlockData);
      
      console.log(`Object ${data.id} unlocked by ${data.userName}`);
    } catch (error: any) {
      console.error('Error unlocking object:', error);
      socket.emit('error', { message: 'Failed to unlock object', details: error.message });
      throw error;
    }
  }
}

export default SocketHandlers; 