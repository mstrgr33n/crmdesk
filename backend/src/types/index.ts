import { Server, Socket } from 'socket.io';

// Типы для моделей
export interface IRoom {
  id: string;
  name: string;
}

export interface IObject {
  id: string;
  room_id: string;
  type: string;
  data: any;
}

export interface IMessage {
  id: string;
  room_id: string;
  user_name: string;
  message: string;
  created_at: Date;
}

// Типы для данных сокетов
export interface JoinRoomData {
  roomId: string;
  userName: string;
}

export interface ObjectData {
  id: string;
  type: string;
  [key: string]: any;
}

export interface MessageData {
  user: string;
  content: string;
}

// Типы для Redis
export interface RedisConfig {
  url: string;
}

// Типы для ограничителя скорости запросов
export interface RateLimiterConfig {
  maxRequestsPerSecond: number;
  windowMs: number;
}

// Типы для конфигурации сервера
export interface ServerConfig {
  port: number;
  cors: {
    origin: string;
    methods: string[];
    credentials: boolean;
    allowedHeaders: string[];
    transports: string[];
  };
}

export interface Config {
  server: ServerConfig;
  redis: RedisConfig;
  rateLimiter?: RateLimiterConfig;
} 