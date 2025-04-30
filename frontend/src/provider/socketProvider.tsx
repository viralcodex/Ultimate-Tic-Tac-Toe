"use client";

import { io, Socket } from "socket.io-client";
import React, {
  createContext,
  useEffect,
  ReactNode,
  useContext,
  useState,
  useRef,
} from "react";
import toast from "react-hot-toast";
import * as src from "@/constants/constants";
import useGameStore from "@/store/store";
import { useRouter } from "next/navigation";

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
  const setGameSession = useGameStore((state) => state.setGameSession);
  const resetGameSession = useGameStore((state) => state.resetGameSession);
  const setIsInRoom = useGameStore((state) => state.setIsInRoom);
  const setRecoveryStartedAt = useGameStore(
    (state) => state.setRecoveryStartedAt
  );
  const recoveryTimeoutId = useGameStore((state) => state.recoveryTimeoutId);
  const setRecoveryTimeoutId = useGameStore(
    (state) => state.setRecoveryTimeoutId
  );

  // const recoveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

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
          console.log(src.SOCKET_CONNECTED, socket.id);
          toast.remove();
          toast.success(src.SOCKET_CONNECTED);
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

            socket.userID = playerID;
          }
        );

        socket?.on("disconnect", () => {
          toast.remove();
          toast.error(src.SOCKET_DISCONNECTED);
          console.log(src.SOCKET_DISCONNECTED);
          resetGameSession(); // Reset the game session on disconnect
          router.replace("/"); 
        });

        socket?.on("connect_error", (error) => {
          toast.remove();
          toast.error(src.SOCKET_CONNECTION_ERROR + error.message);
          console.log(src.SOCKET_CONNECTION_ERROR, error.message);
          router.replace("/");
        });

        // This event is triggered when the server acknowledges that the player has left the room.
        // It starts a recovery timer for 20 seconds (or whatever timeout you set on the server).
        // If the player rejoins within this time, they can continue playing. Otherwise, they are redirected to the home page.
        socket?.on("playerLeftAck", (roomCode: string) => {
          console.log(src.RECOVERY_TIMER_STARTED);
          setIsInRoom(false);
          setRecoveryStartedAt(Date.now());
          // Start a client-side recovery timer matching the server's timeout.
          socket.emit("startServerTimeout", roomCode);

          setRecoveryTimeoutId(
            setTimeout(() => {
              if (socket.connected) {
                console.log(src.SOCKET_DISCONNECTED);
                toast.remove();
                toast.error(src.SOCKET_DISCONNECTED);
                socket.auth = {}; // Clear session ID
                socket.roomCode = null; // Clear room code
                resetGameSession();
                setIsInRoom(false);
                setRecoveryStartedAt(null); // Clear recovery started time
                setRecoveryTimeoutId(null); // Clear the timeout ID
                router.replace("/");
              }
            }, src.RECOVERY_TIMEOUT)
          ); // 20 seconds timeout
        });

        // socket?.on("roomJoined", (roomCode: string, playerName: string) => {
        //   //this root level event is used to clear recovery timer
        //   setIsInRoom(true);
        //   setRecoveryStartedAt(null);
        //   const timeoutId = useGameStore.getState().recoveryTimeoutId;
        //   if (timeoutId) {
        //     clearTimeout(timeoutId);
        //     setRecoveryTimeoutId(null);
        //     console.log("Cleared recovery timeout on room join");
        //   }
        // });

        socket?.on("roomNotFound", (message: string) => {
          console.log(src.ROOM_NOT_FOUND_ERROR, message);
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
