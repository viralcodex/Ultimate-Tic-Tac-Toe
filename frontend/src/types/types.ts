"use server"

type Player = 'X' | 'O' | 'Draw';
type Square = Player | null;
type SelectedCell = {
    outer: number | null;
    inner: number | null;
};
type InnerWinners = Record<number, Player | null>;
type Board = Square[][];

type playerID = string;

type PlayerInfo = {
    playerName: string;
    playerSymbol: Player;
};


type GameSession = {
    roomCode?: string | null;
    players?: Record<playerID, PlayerInfo>;
};

type Response = {
    id: string;
    info: {
        playerName: string;
        playerSymbol: Player;
    };
}

export type { PlayerInfo, GameSession, Player, Square, SelectedCell, InnerWinners, Board, Response };
