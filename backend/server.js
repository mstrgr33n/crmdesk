/**
 * Starts the server and sets up the Socket.IO event handlers.
 *
 * The server listens for incoming connections and handles various events related to room management, object creation/update/locking, and messaging.
 *
 * When a client connects, the server checks if the room exists, and if not, creates a new one. It then fetches the initial state of the room and sends it to the client.
 *
 * The server handles the following events:
 * - `joinRoom`: Joins the client to the specified room and sends the initial state of the room.
 * - `createObject`: Creates a new object in the room and broadcasts the creation to all clients.
 * - `updateObject`: Updates an existing object in the room and broadcasts the update to all clients.
 * - `lockObject`: Locks an object in the room, preventing other clients from modifying it.
 * - `unlockObject`: Unlocks an object in the room, allowing other clients to modify it.
 * - `sendMessage`: Sends a message to the room, which is then broadcasted to all clients.
 * - `disconnect`: Unlocks all objects locked by the disconnecting client and notifies other clients of the user's departure.
 *
 * The server also caches the objects in each room to improve performance.
 */
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Room, ObjectModel, Message, sequelize } = require('./models');
const { v4: uuidv4 } = require('uuid');
const Redis = require('redis');
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsOptions = {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST'],
    credentials: false
};

app.use(cors(corsOptions));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4200',
        allowedHeaders: ["*"],
        transports: ['websocket', 'pooling'],
        methods: ['GET', 'POST'],
        credentials: false
    },
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Connect to Redis
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL,
});

const cache = {};

/**
 * Logs any errors that occur when interacting with the Redis client.
 * @param {Error} err - The error object that was encountered.
 */
redisClient.on('error', (err) => console.log('Redis Client Error', err));

/**
 * Starts the server and sets up the Socket.IO event handlers.
 * This function is responsible for initializing the server, connecting to Redis, and setting up the Socket.IO event listeners.
 * It creates a new room if it doesn't exist, fetches the initial state of the room, and handles various events related to room management, object creation/update/locking, and messaging.
 */
async function startServer() {

    await redisClient.connect();

    io.on('connection', async (socket) => {
        console.log('a user connected');

        socket.on('joinRoom', async ({ roomId, userName }) => {
            let room = await Room.findByPk(roomId);

            if (!room) {
                // Create the room if it doesn't exist
                room = await Room.create({ id: roomId, name: `Room ${roomId}` });
                console.log(`Room ${roomId} created`);
            }

            socket.join(roomId);

            // Fetch and send initial state of the room
            const objects = await getCachedObjects(roomId);
            socket.emit('initialState', objects);

            // Notify other users that a new user has joined
            io.to(roomId).emit('userJoined', { userName });

            // Handle object creation
            socket.on('createObject', async (data) => {
                try {
                    const object = await ObjectModel.create({
                        id: data.id,
                        room_id: roomId,
                        type: data.type,
                        data: data,
                    });
                    object.changed('data', true);
                    await object.save();
                    await redisClient.set(`lock:${data.id}`, userName, { EX: 60 * 5 });
                    io.to(roomId).emit('objectCreated', object);
                } catch (error) {
                    console.error(error);
                }
            });

            // Handle object update
            socket.on('updateObject', async (data) => {
                try {
                    const element = await ObjectModel.findByPk(data.id).then(
                        el => {
                            el.set('data', data);
                            el.changed('data', true);
                            el.save();
                        }
                    );

                    // Update cache
                    if (cache[roomId]) {
                        const objectIndex = cache[roomId].findIndex(obj => obj.id === data.id);
                        if (objectIndex !== -1) {
                            cache[roomId][objectIndex].data = data.data;
                        }
                    }
                    
                    io.to(roomId).emit('objectUpdated', data);
                } catch (error) {
                    console.error('Error updating object:', error);
                }
            });

            // Handle object lock/unlock
            socket.on('lockObject', async (objectId) => {
                await redisClient.set(`lock:${objectId}`, userName, { EX: 60 * 5 });
                io.to(roomId).emit('objectLocked', { id: objectId, lockedBy: userName });
            });

            socket.on('unlockObject', async (objectId) => {
                await redisClient.del(`lock:${objectId}`);
                io.to(roomId).emit('objectUnlocked', { id: objectId });
            });

            socket.on('deleteObject', async (objectId) => {
                try {
                    const model =await ObjectModel.findAll({ 
                        where: { id: objectId, room_id: roomId } 
                    });
                    if (model.length === 1) {
                        await model[0].destroy();
                    }
                    
                    // Update cache
                    if (cache[roomId]) {
                        cache[roomId] = cache[roomId].filter(obj => obj.id !== objectId);
                    }
                    
                    await redisClient.del(`lock:${objectId}`);
                    io.to(roomId).emit('objectDeleted', { id: objectId });
                } catch (error) {
                    console.error('Error deleting object:', error);
                }
            });

            // Handle sending messages
            socket.on('sendMessage', async (message) => {
                const newMessage = await Message.create({
                    room_id: roomId,
                    user_name: userName,
                    message,
                });
                io.to(roomId).emit('newMessage', { userName, message });
            });

            // Handle disconnect
            socket.on('disconnect', async () => {
                console.log('user disconnected');
                // Unlock all objects locked by this user
                const keys = await redisClient.keys(`lock:*`);
                for (const key of keys) {
                    const lockedBy = await redisClient.get(key);
                    if (lockedBy === userName) {
                        await redisClient.del(key);
                    }
                }
                io.to(roomId).emit('userLeft', { userName });
            });
        });
    });

    // Sync models with the database
    await sequelize.sync();

    server.listen(3000, () => {
        console.log('Server is running on port 3000');
    });

}

/**
 * Retrieves the cached objects for the specified room ID.
 *
 * If the objects for the given room ID are already cached, the cached objects are returned.
 * Otherwise, the objects are fetched from the database using the `ObjectModel.findAll()` method,
 * cached, and then returned.
 *
 * @param {string} roomId - The ID of the room to retrieve the objects for.
 * @returns {Promise<Object[]>} - The objects for the specified room ID.
 */
async function getCachedObjects(roomId) {
    const objects = await ObjectModel.findAll({ where: { room_id: roomId } });
    cache[roomId] = objects;
    return objects;
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
