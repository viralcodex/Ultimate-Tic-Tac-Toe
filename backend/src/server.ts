import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import createInviteRoomCode from './utils/utils';

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());

const httpServer = http.createServer(app);

const rooms: Record<string, string> = {};

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'],
    connectionStateRecovery: {
        maxDisconnectionDuration: 60 * 5000, // 1 minute
        skipMiddlewares: true,
    },
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/rooms/:roomId', (req, res) => {
    res.json({ message: 'Hello from the server!' });
});

// Helper to log current socket count for a given room
const logRoomSocketCount = (roomCode: string) => {
    const roomId = rooms[roomCode];
    if (roomId) {
        // allSockets returns a Promise that resolves with a Set of socket ids.
        io.in(roomId).fetchSockets().then((sockets) => {
            console.log(`Room ${roomCode} (id: ${roomId}) now has ${sockets.length} socket(s).`);
        });
    }
};

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('createRoom', (name) => {
        const roomId = uuidv4();
        const roomCode = createInviteRoomCode();
        rooms[roomCode] = roomId;
        console.log('Room created:', roomId, roomCode);
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode: string, name: string) => {
        console.log('Joining room:', roomCode, name);
        if (rooms[roomCode]) {
            const roomId = rooms[roomCode];
            socket.join(roomId);
            console.log('User joined room:', roomCode, name);
            // After joining, log the current number of sockets in the room
            logRoomSocketCount(roomCode);
            socket.emit('roomJoined', roomCode);
        } else {
            socket.emit('roomNotFound', 'Room not found');
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        // Optionally, iterate through all rooms and log updated counts (or implement more detailed cleanup logic)
        Object.keys(rooms).forEach((roomCode) => logRoomSocketCount(roomCode));
    });
});

// Optionally, log the count of sockets in all rooms every 5 seconds
const getAllSockets = async () => {
    Object.keys(rooms).forEach((roomCode) => {
        const roomId = rooms[roomCode];
        io.in(roomId).fetchSockets().then((sockets) => {
            console.log(`Periodic log: Room ${roomCode} has ${sockets.length} socket(s).`);
        });
    });
};

setInterval(getAllSockets, 5000);

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
