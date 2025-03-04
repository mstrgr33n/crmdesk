import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import SocketHandlers from './handlers/socketHandlers';
import { sequelize } from './models';
import redisService from './services/redisService';
import saveService from './services/saveService';
import roomService from './services/roomService';
import logService from './services/logService';
import config from './configs/config';
import { JoinRoomData, ObjectData, MessageData } from './types';

const app = express();
app.use(cors(config.server.cors));

// Добавляем middleware для логирования запросов
app.use((req, res, next) => {
  logService.info(`HTTP ${req.method} ${req.url}`, { 
    ip: req.ip, 
    userAgent: req.headers['user-agent'] 
  });
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: config.server.cors
});

// Глобальная переменная для хранения экземпляра обработчика сокетов
let socketHandlers: SocketHandlers;

// Флаг для отслеживания состояния завершения работы
let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    logService.info('Starting server...');
    
    await redisService.connect();
    logService.info('Connected to Redis');
    
    socketHandlers = new SocketHandlers(io);
    
    // Добавляем обработчик ошибок для Express
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logService.error('Express error', { error: err.message, stack: err.stack });
      res.status(500).json({ error: 'Internal Server Error' });
    });
    
    // Добавляем маршрут для проверки работоспособности
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    
    io.on('connection', async (socket) => {
      logService.debug('Socket connected', { socketId: socket.id });
      
      // Если сервер завершает работу, отклоняем новые соединения
      if (isShuttingDown) {
        socket.emit('error', { message: 'Server is shutting down' });
        socket.disconnect(true);
        return;
      }
      
      socket.on('joinRoom', errorHandler<JoinRoomData>(socket, async (data) => {
        logService.debug('Join room request', { socketId: socket.id, roomId: data.roomId, userName: data.userName });
        
        const { roomId, userName } = await socketHandlers.handleJoinRoom(socket, data);
        
        socket.on('createObject', errorHandler<ObjectData>(socket, (data) => {
          logService.debug('Create object request', { socketId: socket.id, roomId, objectId: data.id });
          return socketHandlers.handleCreateObject(socket, data, roomId, userName);
        }));
        
        socket.on('updateObject', errorHandler<ObjectData>(socket, (data) => {
          logService.debug('Update object request', { socketId: socket.id, roomId, objectId: data.id });
          return socketHandlers.handleUpdateObject(socket, data, roomId);
        }));
        
        // Обработчик события сброса ограничения скорости запросов
        socket.on('rateLimitReset', () => {
          logService.debug('Rate limit reset for client', { socketId: socket.id, roomId });
          // Клиент может выполнить дополнительные действия после сброса ограничения
        });
        
        socket.on('message', errorHandler<MessageData>(socket, (data) => {
          logService.debug('Message request', { socketId: socket.id, roomId, user: data.user });
          return socketHandlers.handleMessage(socket, data, roomId);
        }));

        socket.on('deleteObject', errorHandler<string>(socket, (data) => {
          logService.debug('Delete object request', { socketId: socket.id, roomId, objectId: data });
          return socketHandlers.handleDeleteObject(socket, data, roomId);
        }));
        
        socket.on('lockObject', errorHandler<{ id: string, userName: string }>(socket, (data) => {
          logService.debug('Lock object request', { socketId: socket.id, roomId, objectId: data.id, userName: data.userName });
          return socketHandlers.handleLockObject(socket, data, roomId);
        }));
        
        socket.on('unlockObject', errorHandler<{ id: string, userName: string }>(socket, (data) => {
          logService.debug('Unlock object request', { socketId: socket.id, roomId, objectId: data.id, userName: data.userName });
          return socketHandlers.handleUnlockObject(socket, data, roomId);
        }));
        
        socket.on('disconnect', async (reason) => {
          logService.debug('Socket disconnected', { socketId: socket.id, roomId, userName, reason });
          try {
            await socketHandlers.handleDisconnect(socket, roomId, userName);
          } catch (error) {
            logService.error('Disconnect error', { error });
          }
        });
      }));
    });

    await sequelize.sync();
    logService.info('Database synchronized');
    
    server.listen(config.server.port, () => {
      logService.info(`Server is running on port ${config.server.port}`);
    });

    // Обработка сигналов завершения работы
    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);
    
    // Обработка необработанных исключений и отклонений промисов
    process.on('uncaughtException', (error) => {
      logService.fatal('Uncaught Exception', { error: error.message, stack: error.stack });
      handleShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logService.error('Unhandled Rejection', { reason, promise });
      // Не завершаем работу сервера, но логируем ошибку
    });
  } catch (error: any) {
    logService.fatal('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Функция для корректного завершения работы сервера
async function handleShutdown() {
  // Предотвращаем повторный вызов
  if (isShuttingDown) {
    logService.warn('Shutdown already in progress');
    return;
  }
  
  isShuttingDown = true;
  logService.info('Shutting down server...');
  
  // Устанавливаем таймаут для принудительного завершения
  const forceExitTimeout = setTimeout(() => {
    logService.fatal('Forced shutdown after timeout');
    process.exit(1);
  }, 30000); // 30 секунд на корректное завершение
  
  try {
    // Останавливаем прием новых соединений
    server.close(() => {
      logService.info('HTTP server closed');
    });
    
    // Отключаем всех клиентов
    const connectedSockets = await io.fetchSockets();
    logService.info(`Disconnecting ${connectedSockets.length} socket connections`);
    
    for (const socket of connectedSockets) {
      socket.emit('serverShutdown', { message: 'Server is shutting down' });
      socket.disconnect(true);
    }
    
    // Очищаем ресурсы обработчика сокетов
    if (socketHandlers) {
      socketHandlers.cleanup();
    }
    
    // Получаем все ключи объектов из Redis
    const keys = await redisService.getKeys('object:*');
    
    // Если есть объекты в Redis, сохраняем их в БД
    if (keys.length > 0) {
      logService.info(`Saving ${keys.length} objects to database before shutdown...`);
      
      // Получаем все комнаты
      const roomKeys = await redisService.getKeys('room:*');
      for (const roomKey of roomKeys) {
        const roomId = roomKey.split(':')[1];
        await saveService.saveAllObjects(roomId);
      }
    }
    
    // Очищаем очередь сохранения
    saveService.cleanup();
    
    // Очищаем кеш комнат
    roomService.cleanup();
    
    // Закрываем соединения с базой данных
    await sequelize.close();
    logService.info('Database connections closed');
    
    // Закрываем соединение с Redis
    await redisService.disconnect();
    logService.info('Redis connection closed');
    
    // Очищаем ресурсы логирования
    logService.info('Server shutdown complete');
    logService.cleanup();
    
    // Отменяем таймаут принудительного завершения
    clearTimeout(forceExitTimeout);
    
    process.exit(0);
  } catch (error: any) {
    logService.fatal('Error during shutdown', { error: error.message, stack: error.stack });
    // Отменяем таймаут принудительного завершения
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

startServer().catch(err => {
  logService.fatal('Failed to start server', { error: err.message, stack: err.stack });
}); 