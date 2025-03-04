import { Subject, debounceTime, groupBy, mergeMap, from, Observable, Subscription } from 'rxjs';
import { ObjectModel } from '../models';
import redisService from './redisService';
import { ObjectData } from '../types';

class SaveService {
  private saveSubject: Subject<{ objectId: string; roomId: string; data: ObjectData }>;
  private subscription: Subscription;
  
  constructor() {
    this.saveSubject = new Subject();
    
    // Настраиваем поток для сохранения объектов
    this.subscription = this.saveSubject.pipe(
      // Группируем по ID объекта, чтобы обрабатывать каждый объект отдельно
      groupBy(item => item.objectId),
      // Для каждой группы (объекта) применяем debounceTime
      mergeMap(group => group.pipe(
        // Ждем 100ms бездействия перед сохранением
        debounceTime(100)
      ))
    ).subscribe(async ({ objectId, roomId, data }) => {
      try {
        await this.saveObjectToDatabase(objectId, roomId, data);
      } catch (error) {
        console.error('Error saving object to database:', error);
      }
    });
  }

  /**
   * Добавляет объект в очередь на сохранение
   */
  queueObjectForSave(objectId: string, roomId: string, data: ObjectData): void {
    this.saveSubject.next({ objectId, roomId, data });
  }

  /**
   * Сохраняет объект в базу данных
   */
  private async saveObjectToDatabase(objectId: string, roomId: string, data: ObjectData): Promise<void> {
    try {
      // Используем upsert для создания или обновления объекта
      const [object, created] = await ObjectModel.upsert({
        id: objectId,
        room_id: roomId,
        type: data.type,
        data: data
      });
      
      // Удаляем объект из Redis после сохранения в БД, только если это не было ошибкой
      if (object) {
        await redisService.remove(`object:${objectId}`);
        console.log(`Object ${objectId} ${created ? 'created' : 'updated'} in database`);
      }
    } catch (error) {
      console.error(`Failed to save object ${objectId}:`, error);
      throw error;
    }
  }

  /**
   * Принудительно сохраняет все объекты из Redis в базу данных
   */
  async saveAllObjects(roomId: string): Promise<void> {
    try {
      const keys = await redisService.getKeys(`object:*`);
      for (const key of keys) {
        const dataStr = await redisService.get(key);
        if (!dataStr) {
          console.error(`Data for key ${key} is null or undefined`);
          continue;
        }
        
        const data = JSON.parse(dataStr);
        const objectId = key.split(':')[1];

        await this.saveObjectToDatabase(objectId, roomId, data);
      }
    } catch (error) {
      console.error('Error saving all objects:', error);
    }
  }

  /**
   * Очищает очередь сохранения и отписывается от потока
   */
  cleanup(): void {
    if (this.subscription && !this.subscription.closed) {
      this.subscription.unsubscribe();
      console.log('Save queue subscription closed');
    }
  }
}

export default new SaveService(); 