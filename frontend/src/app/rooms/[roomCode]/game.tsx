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
import PlayerTag from "./components/playerTag";
import { Response } from "@/types/types";
import {
  CONFIRM_NAVIGATION_MESSAGE,
  TIMEOUT_WARNING,
  ROOM_REJOINED_SUCCESS,
  NEW_PLAYER_JOINED,
  PLAYER_LEFT,
  ROOM_NOT_FOUND_ERROR,
  RECOVERY_TIMEOUT,
  RECOVERY_GRACE_PERIOD_EXPIRED,
} from "@/constants/constants";

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
      if (window.confirm(CONFIRM_NAVIGATION_MESSAGE)) {
        console.log("player left");
        if (socket && socket.connected) {
          const playerName = gameSession?.players?.[socket.userID]?.playerName;
          console.log(
            "inside",
            playerName,
            socket.roomCode,
            gameSession?.roomCode
          );
          socket.emit("playerLeft", gameSession?.roomCode, playerName);
        }
        toast.remove();
        toast.error(TIMEOUT_WARNING);
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
        console.log(ROOM_REJOINED_SUCCESS, roomCode, playerName);
        toast.remove();
        toast.success(ROOM_REJOINED_SUCCESS);
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
      // socket.off("sendCurrentPlayers");
      socket.off("connect");
    };
  }, [
    setGameSession,
    setIsInRoom,
    setRecoveryStartedAt,
    setRecoveryTimeoutId,
    socket,
  ]);

  // This effect handles the socket events for player joining and leaving
  // It updates the game session with the current players in the room
  useEffect(() => {
    if (!socket) return;

    socket.on("newPlayerJoined", (roomCode: string, player: Response) => {
      console.log(NEW_PLAYER_JOINED, roomCode, player);
      toast.remove();
      toast.success(NEW_PLAYER_JOINED + player.info.playerName);

      setGameSession({
        players: {
          // spread old players then add the new one
          ...useGameStore.getState().gameSession?.players,
          [player.id]: player.info,
        },
      });
    });

    socket.on("someoneLeft", (roomCode: string, player: Response) => {
      console.log(PLAYER_LEFT, roomCode, player);
      toast.remove();
      toast.error(PLAYER_LEFT + player.info.playerName);

      setGameSession((prev) => {
        if (!prev?.players || !(player.id in prev.players)) {
          return prev; // guard against missing data
        }
        // 4) Delete by destructuring
        const { [player.id]: _, ...remaining } = prev.players;
        return {
          roomCode: prev.roomCode, // must be returned in full-session path!
          players: remaining,
        };
      });
    });

    socket.onAny((eventName, ...args) => {
      console.log(`Event: ${eventName}`, args);
    });

    return () => {
      // socket.off("sendCurrentPlayers");
      socket.off("newPlayerJoined");
      socket.off("someoneLeft");
    };
  }, [setGameSession, socket]);

  // This effect handles the socket events for room joining and not found errors
  // It sets the game session and recovery timeout when the user joins a room
  // and resets the game session when the user leaves or the room is not found
  useEffect(() => {
    if (!socket) return;

    socket.on("roomJoined", (roomCode: string, playerName: string) => {
      console.log(ROOM_REJOINED_SUCCESS, roomCode, playerName);
      toast.remove();
      toast.success(ROOM_REJOINED_SUCCESS);
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
      console.log(ROOM_NOT_FOUND_ERROR, error);
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

  // This effect handles the socket events for recovery
  // It checks if the user is in a room and if the recovery grace period has expired
  // If the user is in recovery, it attempts to rejoin the room
  // If the recovery grace period has expired, it resets the game session and redirects to the home page
  useEffect(() => {
    if (!socket || !isHydrated || hasAttemptedRecovery.current) return;

    if (!isInRoom && recoveryStartedAt) {
      const timeElapsed = Date.now() - recoveryStartedAt;
      const playerName = gameSession?.players?.[socket.userID]?.playerName;

      if (!playerName) {
        console.log("No player name found for recovery.");
        return;
      }

      if (timeElapsed < RECOVERY_TIMEOUT) {
        console.log("User is in recovery grace period.");
        socket.emit("joinRoom", props.roomCode, playerName);
        hasAttemptedRecovery.current = true;
        setRecoveryStartedAt(null);
        setIsInRoom(true);
      } else {
        console.log(RECOVERY_GRACE_PERIOD_EXPIRED);
        toast.remove();
        toast.error(RECOVERY_GRACE_PERIOD_EXPIRED);
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
      toast.error(ROOM_NOT_FOUND_ERROR);
      router.replace("/");
      resetGameSession();
    }

    return () => {};
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
      <div className="flex flex-row w-full lg:hidden items-center justify-between max-sm:py-5 sm:py-5">
          {Object.entries(gameSession?.players || {}).map(
            ([key, player], index) =>
              index % 2 === 0 ? (
                <PlayerTag key={key} text={player.playerName} className="w-45 rounded-r-3xl text-xl"/>
              ) : (
                <PlayerTag key={key} text={player.playerName} className="w-45 rounded-l-3xl text-xl"/>
              )
          )}
        </div>
      }
      <div className="flex flex-col w-full h-full items-center justify-center relative">
        <Grid />
        {/* Desktop: Absolute buttons on the right, moves below when space is insufficient */}
        <div className="hidden lg:grid grid-col grid-cols-4 col-span-1 absolute w-full items-center justify-center">
          <div className="flex flex-col items-center justify-center col-start-1 lg:p-7 2xl:p-15 3xl:p-20 ">
           {Object.entries(gameSession?.players || {}).map(
            ([key, player], index) =>
              index % 2 === 0 ? (
                <PlayerTag key={key} text={player.playerName} className="w-full rounded-3xl mb-5"/>
              ) : (
                <PlayerTag key={key} text={player.playerName} className="w-full rounded-3xl"/>
              )
          )}
          </div>
          <div className="flex flex-col col-start-4 lg:p-7 2xl:p-15 3xl:p-20">
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
      <div className="flex flex-row w-full lg:hidden items-center justify-center space-x-10 max-sm:space-x-5 max-sm:px-10 py-5">
        <Button
          text={winner ? "Play Again" : "Reset"}
          handleClick={resetGameSession}
          className="w-45 font-bold"
        />
        <Button
          text={"Cell Rewind"}
          handleClick={() => toast.error("Feature not implemented yet")}
          className="w-45 font-bold"
        />
      </div>
    </div>
  );
}

export default Game;
