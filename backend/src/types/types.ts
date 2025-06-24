type PlayerID = string;
type PlayerName = string; // You can use a more complex type if needed

interface PlayerInfo {
    // playerID: playerID;
    playerName: PlayerName;
    playerSymbol?: string; // Optional: Store player symbol if needed
}

interface RoomInfo {
    roomId: string;
    cleanupTimeout?: NodeJS.Timeout | null;
    players?: Record<PlayerID, PlayerInfo>; // Store player names or IDs if needed
}

interface SessionInfo {
    playerInfo: Record<PlayerID, PlayerInfo>; // Store user info (playerID and playerName) (one record)
    roomCode?: string; //if you want auto rejoin
    sockets: Set<string> | undefined; // Store socket IDs of the same player joining the room multiple times
    isConnected: boolean; // Store connection status
}

interface Response {
    id: string;
    info: PlayerInfo;
}

export type { RoomInfo, SessionInfo, PlayerInfo, Response };