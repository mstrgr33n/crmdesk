const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const config = require('./configs/config');
const SocketHandlers = require('./handlers/socketHandlers');
const redisService = require('./services/redisService');
const errorHandler = require('./middleware/errorHandler');
const { sequelize } = require('./models');

const app = express();
app.use(cors(config.server.cors));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: config.server.cors });

async function startServer() {
  await redisService.connect();
  const socketHandlers = new SocketHandlers(io);
  io.on('connection', async (socket) => {
    
    socket.on('joinRoom', errorHandler(socket, async (data) => {
      const { roomId, userName } = await socketHandlers.handleJoinRoom(socket, data);
      
      socket.on('createObject', errorHandler(socket, (data) => 
        socketHandlers.handleCreateObject(socket, data, roomId, userName)));
      
      socket.on('updateObject', errorHandler(socket, (data) => 
        socketHandlers.handleUpdateObject(socket, data, roomId)));
      
      socket.on('message', errorHandler(socket, (data) => 
        socketHandlers.handleMessage(socket, data, roomId)));
      
      socket.on('disconnect', errorHandler(socket, async () => {
        await socketHandlers.handleDisconnect(socket, roomId, userName);
      }));
    }));
  });

  await sequelize.sync();
  
  server.listen(config.server.port, () => {
    console.log(`Server is running on port ${config.server.port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});