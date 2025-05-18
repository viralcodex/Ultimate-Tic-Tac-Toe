import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import createInviteRoomCode from './utils/utils';
import { RoomInfo, SessionInfo } from './types/types';

const PORT = process.env.PORT || 4000;
const TIMEOUT = 20000; // 20 seconds

const app = express();
app.use(cors());

const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Basic routes 
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/api/rooms/:roomCode/exists', (req, res) => {
    const roomCode = req.params.roomCode;
    if (rooms.has(roomCode)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

const rooms: Map<string, RoomInfo> = new Map();
const sessions: Map<string, SessionInfo> = new Map(); //based on the session ID, you can get the user ID and room code

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    transports: ['websocket'],
    connectionStateRecovery: {
        maxDisconnectionDuration: TIMEOUT,
        skipMiddlewares: true,
    }
});

// --------------------- MIDDLEWARE ---------------------
io.use((sock, next) => {
    const socket = sock as any; // Type assertion to access custom properties
    const sessionID = sock.handshake.auth.sessionID;
    if (sessionID) {
        const session = sessions.get(sessionID); // Use Map to get session info
        if (session) {
            socket.sessionID = sessionID;
            socket.playerID = Object.keys(session.playerInfo)[0]; // Get the first playerID from the session    
            socket.playerName = session.playerInfo[socket.playerID].playerName; // Optional: Store playerName if needed
            socket.roomCode = session.roomCode; // Store roomCode in socket for later use
            console.log('Session found:', sessionID, socket.playerID, session.playerInfo[socket.playerID].playerName, "\n\n");
            return next();
        }
    }

    socket.sessionID = uuidv4();
    socket.playerID = uuidv4();
    socket.roomCode = undefined; // Initialize roomCode as undefined
    socket.playerName = undefined; // Initialize playerName as undefined
    console.log('New session created:', socket.sessionID, socket.playerID, "\n\n");

    next();
});

// --------------------- CONNECTION HANDLER ---------------------
io.on('connection', (sock) => {

    const socket = sock as any; // Type assertion to access custom properties

    sessions.set(
        socket.sessionID,
        {
            playerInfo: {
                [socket.playerID]: {
                    playerName: '',
                    playerSymbol: ''
                }
            },
            roomCode: undefined
        }
    );

    socket.emit("session", {
        sessionID: socket.sessionID,
        playerID: socket.playerID,
    });

    socket.on('rejoinRoom', (roomCode: string, playerName: string) => {
        if (socket.roomCode) {
            console.log(`Auto-rejoin requested for room ${socket.roomCode}`);
            handleJoinRoom(socket, socket.roomCode, socket.playerName);
        }
    });

    // Create Room
    socket.on('createRoom', () => {
        const roomId = uuidv4();
        const roomCode = createInviteRoomCode();
        rooms.set(roomCode, { roomId, players: {}, cleanupTimeout: null });
        console.log('Room created:', roomId, roomCode);
        socket.emit('roomCreated', roomCode);
    });

    // Join Room (and setting roomCode to the socket object)
    socket.on('joinRoom', (roomCode: string, playerName: string) => {
        handleJoinRoom(socket, roomCode, playerName);
    });

    // Handle new room join (switching rooms)
    socket.on('newRoomJoined', (oldRoomCode: string, playerName: string) => {
        const oldRoomInfo = rooms.get(oldRoomCode);
        console.log('New room joined:', oldRoomCode, playerName);
        if (oldRoomInfo) {
            console.log('User joined a new room, leaving old room');

            // Inform other players in the room that a player has left the old room.
            socket.to(oldRoomInfo.roomId).emit('someoneLeft', oldRoomCode, oldRoomInfo.players?.[socket.playerID]);
            socket.emit('oldRoomDeleted', oldRoomCode);
            socket.leave(oldRoomInfo.roomId);

            // Inform other players in the old room.
            // socket.to(oldRoomInfo.roomId).emit('playerLeft', playerName, oldRoomCode);

            // Check room size and cleanup if empty.
            const roomSize = io.sockets.adapter.rooms.get(oldRoomInfo.roomId)?.size || 0;
            console.log(`Old room ${oldRoomCode} size: ${roomSize}`);
            if (roomSize === 0) {
                rooms.delete(oldRoomCode);
                console.log(`Room ${oldRoomCode} deleted as it is empty. \n`);
            }
        }
    });

    // Handle player leaving
    socket.on('playerLeft', (roomCode: string, playerName: string) => {
        const roomInfo = rooms.get(roomCode);
        console.log("roomInfo", roomCode, roomInfo);
        if (roomInfo && !roomInfo.cleanupTimeout) {
            console.log(`Player ${playerName} left room ${roomCode} \n`);


            // Inform other players in the room that a player has left.
            socket.to(roomInfo.roomId).emit('someoneLeft', roomCode, { id: socket.playerID, info: roomInfo.players?.[socket.playerID] });

            delete roomInfo.players?.[socket.playerID]; // Remove player from the room

            socket.emit('playerLeftAck', roomCode, playerName);
            socket.roomCode = undefined; // Clear roomCode from socket
        } else {
            console.log('Room not found for player left:', roomCode);
        }
    });

    // Client instructs server to start room cleanup timer if room is empty.
    socket.on('startServerTimeout', (roomCode: string) => {
        const roomInfo = rooms.get(roomCode);
        if (roomInfo && !roomInfo.cleanupTimeout) {
            socket.leave(roomInfo.roomId); // Leave the room to trigger cleanup if empty.
            console.log(`Starting cleanup timer for room ${roomCode} \n`);
            io.in(roomInfo.roomId).fetchSockets().then((sockets) => {
                console.log(`Room ${roomCode} has ${sockets.length} socket(s) after leaving. \n`);
                if (sockets.length === 0 && !roomInfo.cleanupTimeout) {
                    scheduleRoomAndSessionCleanup(roomCode, roomInfo, socket);
                } else {
                    console.log(`Cleanup timer not started because room ${roomCode} is not empty (${sockets.length} sockets). \n`);
                }
            });
        }
    });

    // Disconnect event
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        // Delay to allow reconnections before scheduling cleanup.
        setTimeout(() => {
            Array.from(rooms.entries()).forEach(([roomCode, roomInfo]) => {
                io.in(roomInfo.roomId).fetchSockets().then((sockets) => {
                    console.log(`Room ${roomCode} has ${sockets.length} socket(s) after disconnection. \n`);
                    if (sockets.length === 0) {
                        scheduleRoomAndSessionCleanup(roomCode, roomInfo, socket);
                    }
                }).catch((error) => {
                    console.error(`Error checking room ${roomCode}:`, error);
                });
            });
        }, 2000);
    });
});

function handleJoinRoom(socket: any, roomCode: string, playerName: string) {
    console.log('Joining room:', roomCode, playerName, "\n");
    const roomInfo = rooms.get(roomCode);
    if (roomInfo) {
        // Clear cleanup timeout if present
        if (roomInfo.cleanupTimeout) {
            clearTimeout(roomInfo.cleanupTimeout);
            roomInfo.cleanupTimeout = undefined;
            console.log(`Cleanup timer cleared for room ${roomCode} \n`);
        }


        socket.playerName = playerName; // Store player name in socket
        socket.join(roomInfo.roomId);

        const isUserAlreadyInRoom = !!roomInfo.players?.[socket.playerID];

        if (!isUserAlreadyInRoom) {
            roomInfo.players ||= {}; // Initialize players if undefined
            roomInfo.players[socket.playerID] = {
                playerName: playerName,
                playerSymbol: ''
            }; // Add player to the room
        }

        sessions.set(socket.sessionID, {
            playerInfo: {
                [socket.playerID]: {
                    playerName: playerName,
                    playerSymbol: ''
                }
            },
            roomCode: roomCode,
        });

        // Store roomCode in the session for recovery

        socket.emit('roomJoined', roomCode, playerName);

        socket.emit('sendCurrentPlayers', roomInfo.players); // Send current players in the room to the new player

        // Notify other users that someone has joined the room 
        socket.to(roomInfo.roomId).emit('newPlayerJoined', roomCode, { id: socket.playerID, info: roomInfo.players?.[socket.playerID] });

        console.log('User joined room:', roomCode, roomInfo.players, "\n");

        logRoomSocketCount(roomCode); // Log current socket count for the room

        console.log("Rooms:", rooms, "\n");
    } else {
        console.log('Room not found:', roomCode, "\n");
        socket.emit('roomNotFound', 'Room not found', roomCode, "\n");
    }
}

// Helper: Schedule cleanup for an empty room
const scheduleRoomAndSessionCleanup = (roomCode: string, roomInfo: RoomInfo, socket: any) => {
    if (!roomInfo.cleanupTimeout) {
        roomInfo.cleanupTimeout = setTimeout(() => {
            io.to(roomInfo.roomId).emit('disconnected', { message: 'Room to be closed in 20 seconds, rejoin to prevent losing progress' });
            rooms.delete(roomCode);

            // Clear the cleanup timeout after room deletion
            sessions.forEach((session, sessionID) => {
                if (session.roomCode === roomCode) {
                    sessions.delete(sessionID);
                }
            });

            socket.emit('oldRoomDeleted', roomCode, 'Room closed due to inactivity');
            console.log(`Room ${roomCode} is empty and is removed from session`);
        }, TIMEOUT);
        console.log(`Cleanup timer scheduled for room ${roomCode} \n`);
    }
};

// Helper: Log current socket count for a room
const logRoomSocketCount = (roomCode: string) => {
    const roomInfo = rooms.get(roomCode);
    if (roomInfo) {
        io.in(roomInfo.roomId).fetchSockets().then((sockets) => {
            console.log(`Room ${roomCode} (id: ${roomInfo.roomId}) now has ${sockets.length} socket(s). \n`);
        });
    }
};

