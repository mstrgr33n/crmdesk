require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: false,
      allowedHeaders: ["*"],
      transports: ['websocket', 'pooling']
    }
  },
  redis: {
    url: process.env.REDIS_URL
  }
};