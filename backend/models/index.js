/**
 * This module defines the database models for a chat application, including Rooms, Objects, and Messages.
 *
 * The `Room` model represents a chat room, with a unique ID and a name.
 *
 * The `ObjectModel` model represents an object associated with a room, with a unique ID, a reference to the room it belongs to, a type, and a data field to store any relevant data.
 *
 * The `Message` model represents a message sent in a chat room, with a unique ID, a reference to the room it was sent in, the name of the user who sent it, the message text, and the timestamp of when it was sent.
 *
 * The module also defines the relationships between the models, with Rooms having many Objects and Messages, and Objects and Messages belonging to a Room.
 */
const { Sequelize, DataTypes, DATE } = require('sequelize');
const { v4: uuid } = require('uuid');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
});

const Room = sequelize.define('Room',  {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
    timestamps: false
  });

const ObjectModel = sequelize.define('Object', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.UUID,
    references: {
      model: Room,
      key: 'id',
    },
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
    timestamps: false,
  });

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.UUID,
    references: {
      model: Room,
      key: 'id',
    },
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
    timestamps: false
  });

Room.hasMany(ObjectModel, {
  foreignKey: 'room_id'
});

ObjectModel.belongsTo(Room, {
  foreignKey: 'room_id'
});

Room.hasMany(Message, {
  foreignKey: 'room_id'
});

Message.belongsTo(Room, {
  foreignKey: 'room_id'
});

module.exports = { Room, ObjectModel, Message, sequelize };
