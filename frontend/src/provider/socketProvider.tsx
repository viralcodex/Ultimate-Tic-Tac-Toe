"use client";

import { io, Socket } from "socket.io-client";
import React, {
  createContext,
  useEffect,
  ReactNode,
  useContext,
  useState,
  use,
  useRef,
} from "react";
import toast from "react-hot-toast";
import useGameStore from "@/store/store";
import { useRouter } from "next/navigation";
import {
  SOCKET_CONNECTED,
  SOCKET_DISCONNECTED,
  SOCKET_CONNECTION_ERROR,
  RECOVERY_TIMER_STARTED,
  RECOVERY_TIMEOUT,
  ROOM_NOT_FOUND_ERROR,
  ROOM_REJOINED_SUCCESS,
} from "@/constants/constants";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const resetGameSession = useGameStore((state) => state.resetGameSession);
  const setIsInRoom = useGameStore((state) => state.setIsInRoom);
  const setRecoveryStartedAt = useGameStore(
    (state) => state.setRecoveryStartedAt
  );
  const setRecoveryTimeoutId = useGameStore(
    (state) => state.setRecoveryTimeoutId
  );

  const gameSession = useGameStore((state) => state.gameSession);

  // const recoveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

   useEffect(() => {
     if (useGameStore.persist.hasHydrated()) {
       useGameStore.setState({ isHydrated: true });
     }
   }, []);

  useEffect(() => {
    if (!socket) {
      const newSocket = io("http://localhost:4000", {
        transports: ["websocket"],
        autoConnect: false,
        reconnection: true,
        timeout: 20000, // 20 seconds
      });

      const sessionID = localStorage.getItem("sessionID");
      if (sessionID) {
        console.log("Session ID from localStorage:", sessionID);
        newSocket.auth = { sessionID };
      }

      setSocket(newSocket);
      newSocket.connect();

      const setupSocket = (socket: Socket | null) => {
        socket?.on("connect", () => {
          console.log(SOCKET_CONNECTED, socket.id);
          toast.remove();
          toast.success(SOCKET_CONNECTED);
        });

        socket?.on(
          "session",
          ({
            sessionID,
            playerID,
          }: {
            sessionID: string;
            playerID: string;
          }) => {
            console.log("Session ID:", sessionID);
            console.log("User ID:", playerID);
            socket.auth = { sessionID };
            localStorage.setItem("sessionID", sessionID); // Store sessionID in localStorage
            socket.playerID = playerID;
            socket.emit("sessionCreated");
          }
        );

        socket?.on("disconnect", () => {
          toast.remove();
          toast.error(SOCKET_DISCONNECTED);
          console.log(SOCKET_DISCONNECTED);
          setIsInRoom(false);
          socket.emit("playerLeft", gameSession?.roomCode || ""); // Notify server that player has left
          // resetGameSession(); // Reset the game session on disconnection
          router.replace("/");
        });

        socket?.on("connect_error", (error) => {
          toast.remove();
          toast.error(SOCKET_CONNECTION_ERROR + error.message);
          console.log(SOCKET_CONNECTION_ERROR, error.message);
          setIsInRoom(false);
          resetGameSession(); // Reset the game session on connection error
          router.replace("/");
        });

        // This event is triggered when the server acknowledges that the player has left the room.
        // It starts a recovery timer for 20 seconds (or whatever timeout you set on the server).
        // If the player rejoins within this time, they can continue playing. Otherwise, they are redirected to the home page.
        socket?.on("playerLeftAck", (roomCode: string) => {
          console.log(RECOVERY_TIMER_STARTED);
          setIsInRoom(false);
          setRecoveryStartedAt(Date.now());
          // Start a client-side recovery timer matching the server's timeout.
          socket.emit("startServerTimeout", roomCode);

          setRecoveryTimeoutId(
            setTimeout(() => {
              if (socket.connected) {
                console.log(SOCKET_DISCONNECTED);
                toast.remove();
                toast.error(SOCKET_DISCONNECTED);
                socket.auth = {}; // Clear session ID
                socket.roomCode = null; // Clear room code
                resetGameSession();
                setIsInRoom(false);
                setRecoveryStartedAt(null); // Clear recovery started time
                setRecoveryTimeoutId(null); // Clear the timeout ID
                router.replace("/");
              }
            }, RECOVERY_TIMEOUT)
          ); // 20 seconds timeout
        });

        socket?.on("roomNotFound", (message: string) => {
          console.log(ROOM_NOT_FOUND_ERROR, message);
          toast.remove();
          toast.error(message);
          resetGameSession();
          setIsInRoom(false);
          setRecoveryStartedAt(null);
          const timeoutId = useGameStore.getState().recoveryTimeoutId;
          if (timeoutId) {
            clearTimeout(timeoutId);
            setRecoveryTimeoutId(null);
          }
          router.replace("/");
        });

        // socket?.onAny((eventName, ...args) => {
        //   console.log(`Event: ${eventName}`, args);
        // });
      };

      setupSocket(newSocket);
    }
    return () => {
      socket?.offAny();
      setRecoveryTimeoutId(null); // Clear the timeout ID when the component unmounts
    };
  }, [
    gameSession?.players,
    gameSession?.roomCode,
    resetGameSession,
    router,
    setIsInRoom,
    setRecoveryStartedAt,
    setRecoveryTimeoutId,
    socket,
  ]);

  return (
    <SocketContext.Provider value={{ socket: socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context.socket;
};
