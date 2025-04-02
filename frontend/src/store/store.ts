import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GameSession, Square, SelectedCell, InnerWinners, Board } from '../types/types'; // Import your types here
//ultimate tic tac toe game store

type Store = {
    gameSession: GameSession | null;
    setGameSession: (session: GameSession) => void;
    socket: Socket | null;
    setSocket: (socket: Socket | null) => void;
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

const useGameStore = create<Store>()(devtools<Store>((set, get) => ({
    gameSession: null,
    setGameSession: (session: GameSession) => set({ gameSession: session }),
    socket: null,
    setSocket: (socket) => {
        // if (typeof window === "undefined") return null;

        // const { socket } = get();
        // if (socket && socket.connected) {
        //     console.log("Socket already initialized", socket.connected);
        //     return socket; // Return the existing socket
        // }

        // const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        //     transports: ["websocket"],
        // });

        // socketInstance.on("connect", () => {
        //     console.log("Socket connected:", socketInstance.id);
        // });

        // socketInstance.on("connect_error", (error) => {
        //     console.error("Socket connection error:", error);
        // });

        set({ socket: socket });
        // return socketInstance; // Return the new socket instance
    },
    selectedCell: { outer: null, inner: null },
    setSelectedCell: (outer, inner) => set((state) => {
        const newHistory = outer !== null
            ? [...state.selectedCellHistory, outer] : state.selectedCellHistory;
        return { ...state, selectedCell: { outer, inner }, selectedCellHistory: newHistory };
    }),
    selectedCellHistory: [],
    allowedOuterCell: null,
    setAllowedOuterCell: (outer) => set({ allowedOuterCell: outer }),
    board: createEmptyBoard(),
    setBoard: (board: Board) => set({ board }),
    currentPlayer: 'X',
    setCurrentPlayer: (player: Square) => set({ currentPlayer: player }),
    innerWinners: {}, // Change from a single object to a mapping
    setInnerWinners: (outerCell, player) => set((state) => ({
        innerWinners: { ...state.innerWinners, [outerCell]: player }, // Add or update the winner for the outerCell
    })),
    winner: null,
    setWinner: (winner: Square) => set({ winner }),
    resetGame: () => set(
        {
            board: createEmptyBoard(),
            currentPlayer: 'X',
            selectedCell: { outer: null, inner: null },
            selectedCellHistory: [],
            allowedOuterCell: null,
            innerWinners: {},
            winner: null
        }
    ),
    // setMockWinner: () => set({
    //     innerWinners: {
    //         0: 'O', 1: 'O', 2: 'X',
    //         3: 'O', 4: 'X', 5: 'O',
    //         6: 'Draw', 7: 'O', 8: 'O'
    //     }
    // }),
    makeMove: (outer: number, inner: number) => {
        const { board, currentPlayer, allowedOuterCell, winner, setInnerWinners, setSelectedCell, setWinner } = get();
        setSelectedCell(outer, inner);
        if (board[outer][inner] !== null || winner !== null) return; //prevent unnecessary store calls
        if (allowedOuterCell !== null && allowedOuterCell !== outer) return; //prevent making a move in a non-allowed outer cell

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
            }
            else if (newBoard[outer].every((cell) => cell !== null)) {
                setInnerWinners(outer, 'Draw');
                break;
            }
        }

        const updatedInnerWinners = get().innerWinners;

        if (Object.keys(updatedInnerWinners).length >= 3) {
            for (const line of winningLines) {
                const [a, b, c] = line;
                if (updatedInnerWinners[a] &&
                    updatedInnerWinners[a] === updatedInnerWinners[b] &&
                    updatedInnerWinners[a] === updatedInnerWinners[c]) {
                    setWinner(updatedInnerWinners[a]);
                    break;
                }
                else if (Object.keys(updatedInnerWinners).length === 9) {
                    setWinner('Draw');
                    break;
                }
            }
        }
        const isOuterCellComplete = !!updatedInnerWinners[inner];
        set(
            {
                board: newBoard,
                currentPlayer: currentPlayer === 'X' ? 'O' : 'X',
                allowedOuterCell: isOuterCellComplete ? null : inner, //if the inner cell for the next allowed outer cell is completed, allow choosing from all outer cells
                selectedCell: { outer: inner, inner: null },
            }
        )
    }
})));

export default useGameStore;