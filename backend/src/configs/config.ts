import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: false,
      allowedHeaders: ["*"],
      transports: ['websocket', 'pooling']
    }
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  rateLimiter: {
    maxRequestsPerSecond: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '50', 10),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '1000', 10)
  }
};

export default config; 