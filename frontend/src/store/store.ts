import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GameSession, Square, SelectedCell, InnerWinners, Board } from '../types/types'; // Import your types here
//ultimate tic tac toe game store

type Store = {
    isHydrated: boolean;
    isInRoom: boolean;
    setIsInRoom: (isInRoom: boolean) => void;
    setHydrated: (hydrated: boolean) => void;
    recoveryStartedAt: number | null;
    setRecoveryStartedAt: (timestamp: number | null) => void;
    recoveryTimeoutId: NodeJS.Timeout | null;
    setRecoveryTimeoutId: (id: NodeJS.Timeout | null) => void;
    gameSession: GameSession | null;
    setGameSession: (
        session: Partial<GameSession> | ((prev: GameSession | null) => Partial<GameSession> | null)
    ) => void;
    resetGameSession: () => void;
    selectedCell: SelectedCell;
    setSelectedCell: (outer: number | null, inner: number | null) => void;
    selectedCellHistory: number[];
    allowedOuterCell: number | null;
    setAllowedOuterCell: (outer: number | null) => void;
    board: Board;
    setBoard: (board: Board) => void;
    currentPlayer: Square;
    setCurrentPlayer: (player: Square) => void;
    innerWinners: InnerWinners; // Change from a single object to a mapping
    setInnerWinners: (outerCell: number, innerWinner: Square) => void;
    winner: Square;
    setWinner: (winner: Square) => void;
    resetGame: () => void;
    makeMove: (outer: number, inner: number) => void;
};

const createEmptyBoard = (): Board =>
    Array.from({ length: 9 }, () => Array(9).fill(null));

const winningLines: number[][] = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const useGameStore = create<Store>()(
    devtools(
        persist(
            (set, get) => ({
                // --- initial state ---
                isHydrated: false,
                setHydrated: (hydrated: boolean): void => set({ isHydrated: hydrated }),
                isInRoom: false,
                setIsInRoom: (isInRoom: boolean): void => set({ isInRoom }),
                recoveryStartedAt: null,
                setRecoveryStartedAt: (timestamp: number | null) => set({ recoveryStartedAt: timestamp }),
                recoveryTimeoutId: null,
                setRecoveryTimeoutId: (id) => set({ recoveryTimeoutId: id }),
                gameSession: null,
                setGameSession: (update) => {
                    set((state) => {
                        const prev = state.gameSession;

                        // 1) Distinguish functional vs object updates
                        if (typeof update === 'function') {
                            // Functional updater should return a full GameSession
                            return { gameSession: update(prev) };
                        }

                        // Object updater is treated as a “patch”
                        const patch = update;

                        // 2) Only merge players for patch updates—functional deletes shouldn’t be merged back
                        const mergedPlayers = {
                            ...(prev?.players || {}),
                            ...(patch.players || {}),
                        };

                        return {
                            gameSession: {
                                // 3) Null-check instead of non-null assertion
                                roomCode: patch.roomCode ?? prev?.roomCode ?? null,
                                players: mergedPlayers,
                            },
                        };
                    });
                },
                resetGameSession: (): void => set({ gameSession: null }),
                selectedCell: { outer: null, inner: null },
                setSelectedCell: (outer: number | null, inner: number | null): void => set((state) => {
                    const newHistory = outer !== null
                        ? [...state.selectedCellHistory, outer] : state.selectedCellHistory;
                    return { ...state, selectedCell: { outer, inner }, selectedCellHistory: newHistory };
                }),
                selectedCellHistory: [],
                allowedOuterCell: null,
                setAllowedOuterCell: (outer: number | null) => set({ allowedOuterCell: outer }),
                board: createEmptyBoard(),
                setBoard: (board: Board) => set({ board }),
                currentPlayer: 'X',
                setCurrentPlayer: (player: Square) => set({ currentPlayer: player }),
                innerWinners: {},
                setInnerWinners: (outerCell: number, player: Square) => set((state) => ({
                    innerWinners: { ...state.innerWinners, [outerCell]: player },
                })),
                winner: null,
                setWinner: (winner: Square) => set({ winner }),
                resetGame: () => set({
                    board: createEmptyBoard(),
                    currentPlayer: 'X',
                    selectedCell: { outer: null, inner: null },
                    selectedCellHistory: [],
                    allowedOuterCell: null,
                    innerWinners: {},
                    winner: null,
                }),
                makeMove: (outer: number, inner: number) => {
                    const {
                        board, currentPlayer, allowedOuterCell, winner,
                        setInnerWinners, setSelectedCell, setWinner,
                    } = get();

                    setSelectedCell(outer, inner);
                    if (board[outer][inner] !== null || winner !== null) return;
                    if (allowedOuterCell !== null && allowedOuterCell !== outer) return;

                    const newBoard = board.map((cell, outerIndex) =>
                        outerIndex === outer
                            ? cell.map((innerCell, innerIndex) => innerIndex === inner ? currentPlayer : innerCell)
                            : cell
                    );

                    for (const line of winningLines) {
                        const [a, b, c] = line;
                        if (
                            newBoard[outer][a] &&
                            newBoard[outer][a] === newBoard[outer][b] &&
                            newBoard[outer][a] === newBoard[outer][c]
                        ) {
                            setInnerWinners(outer, newBoard[outer][a]);
                            break;
                        } else if (newBoard[outer].every((cell) => cell !== null)) {
                            setInnerWinners(outer, 'Draw');
                            break;
                        }
                    }

                    const updatedInnerWinners = get().innerWinners;
                    if (Object.keys(updatedInnerWinners).length >= 3) {
                        for (const line of winningLines) {
                            const [a, b, c] = line;
                            if (
                                updatedInnerWinners[a] &&
                                updatedInnerWinners[a] === updatedInnerWinners[b] &&
                                updatedInnerWinners[a] === updatedInnerWinners[c]
                            ) {
                                setWinner(updatedInnerWinners[a]);
                                break;
                            } else if (Object.keys(updatedInnerWinners).length === 9) {
                                setWinner('Draw');
                                break;
                            }
                        }
                    }
                    const isOuterCellComplete = !!updatedInnerWinners[inner];
                    set({
                        board: newBoard,
                        currentPlayer: currentPlayer === 'X' ? 'O' : 'X',
                        allowedOuterCell: isOuterCellComplete ? null : inner,
                        selectedCell: { outer: inner, inner: null },
                    });
                },
            }),
            {
                name: 'gameStorage',
                partialize: (state) => ({
                    isInRoom: state.isInRoom,
                    recoveryStartedAt: state.recoveryStartedAt,
                    gameSession: state.gameSession,
                    selectedCell: state.selectedCell,
                    selectedCellHistory: state.selectedCellHistory,
                    allowedOuterCell: state.allowedOuterCell,
                    board: state.board,
                    currentPlayer: state.currentPlayer,
                    innerWinners: state.innerWinners,
                    winner: state.winner,
                }),
            }
        )
    )
);

export default useGameStore;