import { Socket } from 'socket.io';

/**
 * Обертка для обработки ошибок в сокет-обработчиках
 * @param socket Сокет-соединение
 * @param handler Функция-обработчик
 * @returns Функция-обработчик с обработкой ошибок
 */
export const errorHandler = <T>(socket: Socket, handler: (data: T) => Promise<any>) => {
  return async (data: T) => {
    try {
      return await handler(data);
    } catch (error) {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    }
  };
}; 