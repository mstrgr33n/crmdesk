const { Room, ObjectModel, sequelize } = require('../models');

class RoomService {
  constructor() {
    this.cache = {};
  }

  async findOrCreateRoom(roomId) {
    let room = await Room.findByPk(roomId);
    if (!room) {
      room = await Room.create({ id: roomId, name: `Room ${roomId}` });
    }
    return room;
  }

  async getCachedObjects(roomId) {
  
    if (this.cache[roomId]) {
      return this.cache[roomId];
    }
    
    const objects = await ObjectModel.findAll({
      where: { room_id: roomId },
      order: [[sequelize.literal(`(data->>'z')::INTEGER`), 'ASC']]
    });
  
    this.cache[roomId] = objects;
    return objects;
  }

  async updateCache(roomId, objectId, data) {
    if (this.cache[roomId]) {
      const objectIndex = this.cache[roomId].findIndex(obj => obj.id === objectId);
      if (objectIndex !== -1) {
        this.cache[roomId][objectIndex].data = data;
      }
    }
  }

  async removeFromCache(roomId, objectId) {
    if (this.cache[roomId]) {
      this.cache[roomId] = this.cache[roomId].filter(obj => obj.id !== objectId);
    }
  }
}

module.exports = new RoomService();