const redisService = require('../services/redisService');
const roomService = require('../services/roomService');
const { ObjectModel, Message } = require('../models');

class SocketHandlers {
  constructor(io) {
    this.saveTimeouts = {};
    this.io = io;
  }

  async handleJoinRoom(socket, { roomId, userName }) {
    const room = await roomService.findOrCreateRoom(roomId);
    socket.join(roomId);
    
    const objects = await roomService.getCachedObjects(roomId);
    
    socket.emit('initialState', objects);
    socket.to(roomId).emit('userJoined', { userName });
    return { room, roomId, userName };
  }

  async handleCreateObject(socket, data, roomId, userName) {
    try {
      const object = await ObjectModel.create({
        id: data.id,
        room_id: roomId,
        type: data.type,
        data: data,
      });
      object.changed('data', true);
      await object.save();
      
      await redisService.set(`object:${data.id}`, JSON.stringify(data));
      socket.to(roomId).emit('objectCreated', object);
      
      return object;
    } catch (error) {
      console.error('Error creating object:', error);
      throw error;
    }
  }

  async handleUpdateObject(socket, data, roomId) {
    try {
      const object = await ObjectModel.findByPk(data.id);
      if (object) {
        object.set('data', data);
        object.changed('data', true);
        await object.save();
        
        await redisService.set(`object:${data.id}`, JSON.stringify(data));
        await roomService.updateCache(roomId, data.id, data);
        socket.to(roomId).emit('objectUpdated', data);
      }
    } catch (error) {
      console.error('Error updating object:', error);
      throw error;
    }
  }

  async handleDisconnect(socket, roomId, userName) {
    try {
      socket.to(roomId).emit('userDisconnected', { userName });
      const roomSockets = await io.in(roomId).allSockets();
      if (roomSockets.size === 0) {
        await this.saveAllData(roomId);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
      throw error;
    }
  }

  async handleDisconnect(socket, roomId, userName) {
    try {
      this.io.to(roomId).emit('userDisconnected', { userName });
    } catch (error) {
      console.error('Error handling disconnect:', error);
      throw error;
    }
  }

  async handleMessage(socket, data, roomId) {
    try {
      const message = await Message.create({
        room_id: roomId,
        user: data.user,
        content: data.content,
      });
      socket.to(roomId).emit('newMessage', message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  scheduleSave(roomId) {
    if (this.saveTimeouts[roomId]) {
      clearTimeout(this.saveTimeouts[roomId]);
    }
    this.saveTimeouts[roomId] = setTimeout(() => this.saveAllData(roomId), 2000);
  }

  async saveAllData(roomId) {
    try {
      const keys = await redisService.getKeys(`object:*`);
      for (const key of keys) {
        const data = JSON.parse(await redisService.get(key));
        
        if (!data || !data.data) {
          console.error(`Data for key ${key} is null or undefined`);
          continue;
        }
  
        await ObjectModel.upsert({
          id: data.id,
          room_id: roomId,
          type: data.type,
          data: data.data
        });
  
        await redisService.remove(key);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }
}

module.exports = SocketHandlers;