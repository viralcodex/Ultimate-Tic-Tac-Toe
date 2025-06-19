import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import createInviteRoomCode from './utils/utils';
import { RoomInfo, SessionInfo, PlayerInfo } from './types/types';

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
        if (session && session.isConnected) {
            socket.sessionID = sessionID;
            socket.playerID = Object.keys(session.playerInfo)[0]; // Get the first playerID from the session    
            socket.playerName = session.playerInfo[socket.playerID].playerName; // Optional: Store playerName if needed
            socket.roomCode = session.roomCode; // Store roomCode in socket for later use

            session.sockets ||= new Set(); // Ensure sockets is initialized
            session.sockets.add(socket.id); // Add the current socket ID to the session's sockets set

            console.log('Session found:', sessionID, socket.playerID, session.playerInfo[socket.playerID].playerName, "\n");
            return next();
        }
    }

    // If no session found, create a new one
    socket.sessionID = uuidv4();
    socket.playerID = uuidv4();
    socket.roomCode = undefined; // Initialize roomCode as undefined
    socket.playerName = undefined; // Initialize playerName as undefined
    console.log('New session created:', socket.sessionID, socket.playerID, "\n\n");
    //add new session to the sessions map
    sessions.set(socket.sessionID, {
        playerInfo: {
            [socket.playerID]: {
                playerName: '',
                playerSymbol: '',
            }
        },
        roomCode: undefined,
        sockets: new Set([socket.id]), // Initialize sockets with the current socket ID
        isConnected: true // Initialize connection status
    });

    next();
});

// --------------------- CONNECTION HANDLER ---------------------
io.on('connection', (sock) => {

    const socket = sock as any; // Type assertion to access custom properties

    // sessions.set(socket.sessionID, {
    //     playerInfo: {
    //         [socket.playerID]: {
    //             playerName: '',
    //             playerSymbol: '',
    //         }
    //     },
    //     roomCode: undefined,
    //     sockets: new Set([socket.id]) // Initialize sockets with the current socket ID
    // });

    console.log("SESSIONS:", sessions, "\n");

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

    socket.on('cancelJoinRoom', (roomCode: string, playerName: string) => {
        console.log(`Join room cancelled for room ${roomCode} by player ${playerName}`);
    });

    // Handle new room join (switching rooms)
    socket.on('newRoomJoined', (oldRoomCode: string, newRoomCode: string, playerName: string) => {
        const oldRoomInfo = rooms.get(oldRoomCode);
        console.log('New room joined:', newRoomCode, playerName);
        if (oldRoomInfo) {
            console.log('User joined a new room, leaving old room', oldRoomInfo, '\n');

            // Inform other players in the room that a player has left the old room.
            socket.to(oldRoomInfo.roomId).emit('someoneLeft', oldRoomCode, oldRoomInfo.players?.[socket.playerID]);
            socket.emit('oldRoomLeft', newRoomCode);
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
        setTimeout(async () => {
            const session = sessions.get(socket.sessionID);
            session?.sockets?.delete(socket.id); // Remove the socket ID from the session's sockets set
            if (session && session.sockets?.size == 0) {
                session.isConnected = false; // Mark session as disconnected
                sessions.set(socket.sessionID, session); // Update the session in the map
            }
            console.log("sessions2:", sessions, "\n");
            const roomCode = socket.roomCode;
            if (!roomCode) return;
            const roomInfo = rooms.get(roomCode);
            if (!roomInfo) return;

            const player = roomInfo.players?.[socket.playerID];
            if (player) {
                console.log('Player disconnected:', player.playerName, socket.playerID);
                delete roomInfo.players?.[socket.playerID]; // Remove player from the room
            }
            const sockets = await io.in(roomInfo.roomId).fetchSockets();
            console.log(`Room ${roomCode} size after disconnect: ${sockets.length}`);
            if (sockets.length === 0) {
                console.log(`Room ${roomCode} is empty, scheduling cleanup \n`);
                scheduleRoomAndSessionCleanup(roomCode, roomInfo, socket);
            } else {
                console.log(`Room ${roomCode} is not empty (${sockets.length} sockets), no cleanup needed \n`);
            }
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

        //check whether the player is already in that room
        if (roomInfo.players?.[socket.playerID]) {
            console.log(`Player ${playerName} is already in room ${roomCode}`);
            const isValid = io.in(roomInfo.roomId).fetchSockets().then((sockets) => {
                console.log("SOCKETS:", sockets, "\n");
                const otherSocketsForSession = sockets.filter((s: any) => { return s.sessionID === socket.sessionID && s.id !== socket.id });
                console.log(`Other sockets for session ${socket.sessionID}:`, otherSocketsForSession);
                if (otherSocketsForSession.length > 0) {
                    console.log(`Conflict: Player ${playerName} is already in room ${roomCode} via another tab`);
                    socket.emit('alreadyInRoom', roomCode);
                    return false; // Indicate that the player is already in the room vi another tab
                }
                return true; // Indicate that the player can rejoin the room
            })

            if(!isValid) {
                return;
            }
            console.log(`Allowing rejoin for ${playerName} in room ${roomCode} after disconnect/refresh`);
            socket.join(roomInfo.roomId); // Join the room again
            socket.emit('roomJoined', roomCode, playerName);
            socket.emit('sendCurrentPlayers', roomInfo.players); // Send current players in the room to the rejoining player
            return; 
        }
        
        //check whether the player is already in another room
        if (socket.roomCode && socket.roomCode !== roomCode) {
            console.log(`Player ${playerName} is in another room ${socket.roomCode}, conflict with room ${roomCode}`);
            socket.emit('roomConflict', roomCode, socket.roomCode);
            return;
        } 
         
        // add player to the room
        roomInfo.players ||= {}; // Ensure players object exists
        roomInfo.players[socket.playerID] = {
            playerName: playerName,
            playerSymbol: '' // Optional: Initialize player symbol if needed
        };

        console.log(`Player ${playerName} added to room ${roomCode} \n`);
        
        socket.join(roomInfo.roomId); // Join the room
        
        const session = sessions.get(socket.sessionID) || {
            playerInfo: {},
            roomCode: undefined,
            sockets: new Set(),
            isConnected: true // Ensure isConnected is included
        };

        (session.playerInfo as Record<string, PlayerInfo>)[socket.playerID] =
        {
            playerName: playerName,
            playerSymbol: '' // Optional: Initialize player symbol if needed
        };

        session.roomCode = roomCode;
        session.sockets?.add(socket.id);
 
        sessions.set(socket.sessionID, session);

        // sessions.set(socket.sessionID, {
        //     playerInfo: {
        //         [socket.playerID]: {
        //             playerName: playerName,
        //             playerSymbol: ''
        //         }
        //     },
        //     roomCode: roomCode,
        //     sockets: sessions?.get(socket.sessionID)?.sockets?.add(socket.id) // Store the socket ID in the session
        // });
        
        // Store roomCode in the session for recovery
        socket.roomCode = roomCode;
        socket.playerName = playerName; // Store player name in socket

        socket.emit('roomJoined', roomCode, playerName);

        socket.emit('sendCurrentPlayers', roomInfo.players); // Send current players in the room to the new player

        // Notify other users that someone has joined the room 
        socket.to(roomInfo.roomId).emit('newPlayerJoined', roomCode, { id: socket.playerID, info: roomInfo.players?.[socket.playerID] });

        console.log('User joined room:', roomCode, roomInfo.players, "\n");

        logRoomSocketCount(roomCode); // Log current socket count for the room

        console.dir(rooms, { depth: null }); // Log current rooms for debugging
        // console.log("Sessions:", sessions, "\n");
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

            // Remove all sessions associated with this roomCode
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