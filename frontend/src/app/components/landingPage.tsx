"use client";

import React, { useState } from "react";
import Button from "../rooms/[roomCode]/components/button";
import useGameStore from "@/store/store";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { Player, PlayerInfo } from "@/types/types";
import { toast } from "react-hot-toast";
import { Loader2Icon } from "lucide-react";
import { useSocket } from "@/provider/socketProvider";
import { ROOM_CREATED_SUCCESS, ROOM_CODE_COPIED, ROOM_CODE_LENGTH, ROOM_LENGTH_ERROR, ROOM_JOINED_SUCCESS, TITLE_ROOM_CODE, PLACEHOLDER_NAME, PLACEHOLDER_ROOM_CODE, BUTTON_CREATE_ROOM, BUTTON_JOIN_ROOM, BUTTON_PLAY_WITH_FRIEND, NAME_ERROR, BUTTON_PLAY_WITH_AI, PLAY_AI } from "@/constants/constants";

export default function LandingPage(props: Readonly<{ title: string }>) {
  const router = useRouter();
  const socket = useSocket();
  const [name, setName] = useState<string>("");
  const [error, setError] = useState("");
  const [modalOptionSelected, setModalOptionSelected] = useState<number>(-1);
  const [isCreateLoading, setIsCreateLoading] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const roomCode = useGameStore((state) => state.gameSession?.roomCode || "");
  const setIsInRoom = useGameStore((state) => state.setIsInRoom);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const setRecoveryStartedAt = useGameStore(
    (state) => state.setRecoveryStartedAt
  );
  const setRecoveryTimeoutId = useGameStore(
    (state) => state.setRecoveryTimeoutId
  );

  const setSocketAndCreateRoom = () => {
    if (!socket) return;
    setIsCreateLoading(true);
    if (!socket.connected) socket.connect();
    socket.emit("createRoom", name);

    socket.once("roomCreated", (roomCode: string) => {
      console.log(ROOM_CREATED_SUCCESS, roomCode);
      navigator.clipboard.writeText(roomCode);
      toast.remove();
      toast.success(ROOM_CODE_COPIED);
      joinRoom(socket, roomCode, "X");
    });
  };

  const setSocketAndJoinRoom = () => {
    if (!socket) return;
    setIsJoinLoading(true);

    const roomCode = useGameStore.getState().gameSession?.roomCode || "";
    console.log("Room code:", roomCode);
    if (roomCode.length !== ROOM_CODE_LENGTH) {
      toast.remove();
      toast.error(ROOM_LENGTH_ERROR);
      setIsJoinLoading(false);
      return;
    }
    joinRoom(socket, roomCode, "O");
  };

  const joinRoom = (
    socket: Socket,
    roomCode: string | null,
    player: Player
  ) => {
    if (!socket) return;
    const oldRoomCode = useGameStore.getState().gameSession?.roomCode || "";

    console.log("old, new", oldRoomCode, roomCode);

    if (oldRoomCode && oldRoomCode !== roomCode) { // If the user is already in a room and tries to join a new one
      const timeoutId = useGameStore.getState().recoveryTimeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
        setRecoveryTimeoutId(null);
        console.log("Cleared recovery timeout on navigation cancel");
      }
      socket.emit("newRoomJoined", oldRoomCode, name);
      socket.once("oldRoomDeleted", (oldRoom: string) => {
        console.log("Old room deleted", oldRoom);
        setGameSession({
          roomCode: roomCode,
          players: {
            [socket.userID]: {
              playerName: name,
              playerSymbol: player,
            },
          },
        });
      });
    }

    socket.emit("joinRoom", roomCode, name);
    socket.once("roomJoined", (roomCode: string, playerName: string) => {
      console.log(ROOM_JOINED_SUCCESS, roomCode, playerName);
      setGameSession({
        roomCode: roomCode,
        players: {
          [socket.userID]: {
            playerName: playerName,
            playerSymbol: player,
          },
        }
      });
      socket.on("sendCurrentPlayers", (players: Record<string, PlayerInfo>) => {
        console.log("current players in the room", players);
        toast.remove();
        setGameSession((prev) => ({
          ...prev,
          players: players, // hard replace
        }));
      });
      socket.roomCode = roomCode;
      setRecoveryStartedAt(null);
      setIsInRoom(true);
      const timeoutId = useGameStore.getState().recoveryTimeoutId;
      if (timeoutId) {
        clearTimeout(timeoutId);
        setRecoveryTimeoutId(null);
        console.log("Cleared recovery timeout on room join");
      }
      router.push(`/rooms/${roomCode}`);
    });

    socket.once("roomNotFound", (message: string) => {
      toast.remove();
      toast.error(message);
      setIsJoinLoading(false);
      setIsInRoom(false);
    });
  };

  return (
    <div className="2xl:w-2xl lg:w-xl md:w-xl sm:w-lg max-sm:w-[400px] shadow-[0px_3px_7px_rgba(0,0,0,0.5)] bg-white rounded-lg px-10 pb-5 mx-auto mt-[-20]">
      <div className="text-black font-black text-2xl 3xl:text-3xl text-center pt-7 pb-1">
        {!modalOptionSelected ? TITLE_ROOM_CODE : props.title}
      </div>
      {modalOptionSelected === -1 ? (
        <input
          type="text"
          value={name}
          minLength={3}
          maxLength={10}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(""); // Clear error on input change
          }}
          required
          className={`text-black text-lg 3xl:text-3xl border-4 rounded-lg p-2 my-5 text-center w-full ${
            error
              ? "border-red-500 placeholder-red-500"
              : "border-amber-500 active:border-amber-900"
          }`}
          placeholder={PLACEHOLDER_NAME}
        />
      ) : (
        <input
          type="text"
          value={roomCode}
          maxLength={ROOM_CODE_LENGTH}
          minLength={ROOM_CODE_LENGTH}
          onChange={(e) => {
            setGameSession({
              roomCode: e.target.value,
            })
          }}
          required
          className={`text-black text-lg 3xl:text-3xl border-4 rounded-lg p-2 my-5 text-center w-full ${
            error
              ? "border-red-500 placeholder-red-500"
              : "border-amber-500 active:border-amber-900"
          }`}
          placeholder={PLACEHOLDER_ROOM_CODE}
        />
      )}
      {modalOptionSelected !== -1 ? (
        <div className="flex max-sm:flex-col flex-row w-full items-center justify-center text-lg relative py-5">
          <Button
            text={BUTTON_CREATE_ROOM}
            className="text-sm max-sm:w-full max-sm:mb-2 max-sm:mx-0 mr-2 w-full"
            icon={isCreateLoading ? <Loader2Icon /> : null}
            handleClick={() => setSocketAndCreateRoom()}
            isLoading={isCreateLoading}
          />
          <Button
            text={BUTTON_JOIN_ROOM}
            className="text-sm max-sm:w-full max-sm:mt-2 max-sm:mx-0 ml-2 w-full"
            icon={isJoinLoading ? <Loader2Icon /> : null}
            handleClick={() => setSocketAndJoinRoom()}
            isLoading={isJoinLoading}
          />
        </div>
      ) : (
        <div className="flex max-sm:flex-col flex-row w-full items-center justify-center text-lg relative py-5">
          <Button
            text={BUTTON_PLAY_WITH_FRIEND}
            className="text-sm max-sm:w-full md:px-4 max-sm:mb-2 max-sm:mx-0 mr-2 w-full"
            handleClick={() => {
              if (name.length === 0) {
                setError(NAME_ERROR);
                toast.remove();
                toast.error(NAME_ERROR);
                return;
              }
              if (error) setError("");
              setModalOptionSelected(0);
            }}
          />
          <Button
            text={BUTTON_PLAY_WITH_AI}
            className="text-sm max-sm:w-full max-sm:mt-2 max-sm:mx-0 ml-2 w-full"
            handleClick={() => {
              if (name.length === 0) {
                setError(NAME_ERROR);
                toast.remove();
                toast.error(NAME_ERROR);
                return;
              }
              if (error) setError("");
              toast.remove();
              toast.error(PLAY_AI);
            }}
          />
        </div>
      )}
    </div>
  );
}
