/**
 * This module defines the database models for a chat application, including Rooms, Objects, and Messages.
 */
import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';
import { IRoom, IObject, IMessage } from '../types';

dotenv.config();

// Интерфейсы для создания моделей
interface RoomCreationAttributes extends Optional<IRoom, 'id'> {}
interface ObjectCreationAttributes extends Optional<IObject, 'id'> {}
interface MessageCreationAttributes extends Optional<IMessage, 'id' | 'created_at'> {}

// Определение классов моделей
class Room extends Model<IRoom, RoomCreationAttributes> implements IRoom {
  public id!: string;
  public name!: string;
}

class ObjectModel extends Model<IObject, ObjectCreationAttributes> implements IObject {
  public id!: string;
  public room_id!: string;
  public type!: string;
  public data!: any;
}

class Message extends Model<IMessage, MessageCreationAttributes> implements IMessage {
  public id!: string;
  public room_id!: string;
  public user_name!: string;
  public message!: string;
  public created_at!: Date;
}

// Инициализация Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
  }
);

// Инициализация моделей
Room.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Room',
    timestamps: false,
  }
);

ObjectModel.init(
  {
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
  },
  {
    sequelize,
    modelName: 'Object',
    timestamps: false,
  }
);

Message.init(
  {
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
  },
  {
    sequelize,
    modelName: 'Message',
    timestamps: false,
  }
);

// Определение отношений
Room.hasMany(ObjectModel, {
  foreignKey: 'room_id',
});

ObjectModel.belongsTo(Room, {
  foreignKey: 'room_id',
});

Room.hasMany(Message, {
  foreignKey: 'room_id',
});

Message.belongsTo(Room, {
  foreignKey: 'room_id',
});

export { Room, ObjectModel, Message, sequelize }; 