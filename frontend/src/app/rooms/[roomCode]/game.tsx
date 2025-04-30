"use client";
import Button from "./components/button";
import Grid from "./components/grid";
import useGameStore from "@/store/store";
import { useNavigationGuard } from "next-navigation-guard";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import LoadingGame from "./loading";
import { useSocket } from "@/provider/socketProvider";
import * as src from "@/constants/constants";
import PlayerTag from "./components/playerTag";
import { clear } from "console";

function Game(props: Readonly<{ roomCode: string }>) {
  const router = useRouter();
  const socket = useSocket();
  const winner = useGameStore((state) => state.winner);
  const gameSession = useGameStore((state) => state.gameSession);
  const isHydrated = useGameStore((state) => state.isHydrated);
  const isInRoom = useGameStore((state) => state.isInRoom);
  const recoveryStartedAt = useGameStore((state) => state.recoveryStartedAt);
  const setIsInRoom = useGameStore((state) => state.setIsInRoom);
  const resetGameSession = useGameStore((state) => state.resetGameSession);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const setRecoveryStartedAt = useGameStore(
    (state) => state.setRecoveryStartedAt
  );
  const setRecoveryTimeoutId = useGameStore(
    (state) => state.setRecoveryTimeoutId
  );

  const hasAttemptedRecovery = useRef(false);

  useNavigationGuard({
    enabled: isInRoom,
    confirm: () => {
      if (window.confirm(src.CONFIRM_NAVIGATION_MESSAGE)) {
        console.log("player left");
        if (socket && socket.connected) {
          const playerName = gameSession?.players?.[socket.userID]?.playerName;
          socket.emit("playerLeft", gameSession?.roomCode, playerName);
        }
        toast.remove();
        toast.error(src.TIMEOUT_WARNING);
        return true;
      }
      const timeoutId = useGameStore.getState().recoveryTimeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
        setRecoveryTimeoutId(null);
        console.log("Cleared recovery timeout on navigation cancel");
      }
      return false;
    },
  });

  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      useGameStore.setState({ isHydrated: true });
    }
  }, []);

  //try to rejoin the room if the socket is connected and the user is not in a room
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      socket.emit("rejoinRoom", (roomCode: string, playerName: string) => {
        console.log(src.ROOM_REJOINED_SUCCESS, roomCode, playerName);
        toast.remove();
        toast.success(src.ROOM_REJOINED_SUCCESS);
        setIsInRoom(true);
        setRecoveryStartedAt(null);
        const timeoutId = useGameStore.getState().recoveryTimeoutId;
        if (timeoutId) {
          clearTimeout(timeoutId);
          setRecoveryTimeoutId(null);
          console.log("Cleared recovery timeout on room join");
        }
      });
    });
    return () => {
      socket.off("rejoinRoom");
    };
  }, [setIsInRoom, setRecoveryStartedAt, setRecoveryTimeoutId, socket]);

  useEffect(() => {
    if (!socket) return;

    socket.on("roomJoined", (roomCode: string, playerName: string) => {
      console.log(src.ROOM_REJOINED_SUCCESS, roomCode, playerName);
      toast.remove();
      toast.success(src.ROOM_REJOINED_SUCCESS);
      setIsInRoom(true);
      setRecoveryStartedAt(null);
      const timeoutId = useGameStore.getState().recoveryTimeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
        setRecoveryTimeoutId(null);
        console.log("Cleared recovery timeout on room join");
      }
    });

    socket.on("roomNotFound", (error: string) => {
      console.log(src.ROOM_NOT_FOUND_ERROR, error);
      toast.remove();
      toast.error(error);
      resetGameSession();
      setIsInRoom(false);
      setRecoveryStartedAt(null);
    });

    return () => {
      socket.off("roomJoined");
      socket.off("roomNotFound");
    };
  }, [
    resetGameSession,
    setGameSession,
    setIsInRoom,
    setRecoveryStartedAt,
    setRecoveryTimeoutId,
    socket,
  ]);


  useEffect(() => {
    if (!socket || !isHydrated || hasAttemptedRecovery.current) return;

    if (!isInRoom && recoveryStartedAt) {
      const timeElapsed = Date.now() - recoveryStartedAt;
      const playerName = gameSession?.players?.[socket.userID]?.playerName;

      if (!playerName) {
        console.log("No player name found for recovery.");
        return;
      }

      if (timeElapsed < src.RECOVERY_TIMEOUT) {
        console.log("User is in recovery grace period.");
        socket.emit("joinRoom", props.roomCode, playerName);
        hasAttemptedRecovery.current = true;
        setRecoveryStartedAt(null);
        setIsInRoom(true);
      } else {
        console.log(src.RECOVERY_GRACE_PERIOD_EXPIRED);
        toast.remove();
        toast.error(src.RECOVERY_GRACE_PERIOD_EXPIRED);
        setIsInRoom(false);
        resetGameSession();
        setRecoveryStartedAt(null);
        router.replace("/");
      }

      // socket.onAny((eventName, ...args) => {
      //   console.log(`Event: ${eventName}`, args);
      // });
    }

    if (gameSession?.roomCode && gameSession.roomCode !== props.roomCode) {
      toast.remove();
      toast.error(src.ROOM_NOT_FOUND_ERROR);
      router.replace("/");
      resetGameSession();
    }

    return () => {
      socket.off("newPlayerJoined");
      socket.off("someoneLeft");
      socket.off("roomJoined");
      socket.off("roomNotFound");
    };
  }, [
    socket,
    router,
    isHydrated,
    isInRoom,
    recoveryStartedAt,
    gameSession?.players,
    gameSession?.roomCode,
    props.roomCode,
    setRecoveryStartedAt,
    setIsInRoom,
    resetGameSession,
  ]);

  if (!isHydrated) {
    return (
      <div className="flex flex-col w-full h-full flex-1 align-middle justify-center relative">
        <LoadingGame />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full flex-1 align-middle justify-center relative">
      {
        <div className="flex flex-row w-full h-20 items-center justify-center space-x-10 max-sm:space-x-5 max-sm:px-10 py-10">
          {Object.entries(gameSession?.players || {}).map(([key, player]) => (
            <PlayerTag key={key} text={player.playerName} />
          ))}
        </div>
      }
      <div className="flex flex-col w-full h-full items-center justify-center">
        <Grid />
        {/* Desktop: Absolute buttons on the right, moves below when space is insufficient */}
        <div className="hidden lg:grid grid-col col-span-2 grid-cols-4 absolute w-full items-center justify-center">
          <div className="col-start-4 xl:p-12 lg:p-7 2xl:p-15 3xl:p-20 items-start justify-items-start flex flex-col">
            <Button
              text={winner ? "Play Again" : "Reset"}
              handleClick={resetGameSession}
              className="w-full mb-5"
            />
            <Button
              text={"Cell Rewind"}
              className="w-full"
              handleClick={() => toast.error("Feature not implemented yet")}
            />
          </div>
        </div>
      </div>
      {/* Mobile & small screens: Buttons move to bottom */}
      <div className="flex flex-row w-full lg:hidden items-center justify-center space-x-10 max-sm:space-x-5 max-sm:px-10 py-10">
        <Button
          text={winner ? "Play Again" : "Reset"}
          handleClick={resetGameSession}
          className="w-45"
        />
        <Button
          text={"Cell Rewind"}
          handleClick={() => toast.error("Feature not implemented yet")}
          className="w-45"
        />
      </div>
    </div>
  );
}

export default Game;
