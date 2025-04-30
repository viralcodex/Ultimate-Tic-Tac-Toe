"use server"

type playerID = string;

type PlayerInfo = {
    playerName: string;
    playerSymbol: Player;
};

type Players = Record<playerID, PlayerInfo>;

type GameSession = {
    roomCode?: string | null;
    players?: Players;
};

type Player = 'X' | 'O' | 'Draw';
type Square = Player | null;
type SelectedCell = {
    outer: number | null;
    inner: number | null;
};
type InnerWinners = Record<number, Player | null>;
type Board = Square[][];

export type { PlayerInfo, GameSession, Player, Square, SelectedCell, InnerWinners, Board, Players };
