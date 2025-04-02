
"use server"

type GameSession = {
    roomCode?: string | null;
    playerName?: string | null;
    playerSymbol?: Player | null;
};
type Player = 'X' | 'O' | 'Draw'; //IMPORTANT
type Square = Player | null;
type SelectedCell = {
    outer: number | null;
    inner: number | null;
};
type InnerWinners = Record<number, Player | null>; // Map outerCell index to the winning player
type Board = Square[][];

export type { GameSession, Player, Square, SelectedCell, InnerWinners, Board };