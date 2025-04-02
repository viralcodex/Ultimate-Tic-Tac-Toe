"use client";

import { use, useEffect, useState } from "react";
import Button from "../rooms/[roomCode]/components/button";
import useGameStore from "@/store/store";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { Player } from "@/types/types";
export default function Modal(props: Readonly<{ title: string }>) {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [error, setError] = useState("");
  // const [roomCode, setRoomCode] = useState<string>("");
  const setSocket = useGameStore((state) => state.setSocket);
  const setGameSession = useGameStore((state) => state.setGameSession);
  const [modalOptionSelected, setModalOptionSelected] = useState<number>(-1);
  const roomCode = useGameStore((state) => state.gameSession?.roomCode || "");

  const setSocketObject = () => {
    const socket = io("http://localhost:4000", {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      timeout: 50000,
    });
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setSocket(socket);
    });

    socket.on("connect_error", (error) => {
      throw new Error(error.message);
    });

    return socket;
  };

  const setSocketAndJoinRoom = () => {
    const roomCode = useGameStore.getState().gameSession?.roomCode || "";
    console.log("Room code:", roomCode);
    if (roomCode.length !== 4) {
      setError("Room code must be 4 characters.");
      alert("Room code must be 4 characters.");
      return;
    }

    const socket = setSocketObject();

    joinRoom(socket, roomCode, "O");
  };

  const setSocketAndCreateRoom = () => {
    const socket = setSocketObject();
    socket.emit("createRoom", name);

    socket.on("roomCreated", (roomCode: string) => {
      console.log("Room created:", roomCode);
      setGameSession({
        roomCode,
        playerName: name,
      });
      // setRoomCode(roomCode);
      navigator.clipboard.writeText(roomCode);
      alert("Room Code copied to clipboard!");
      joinRoom(socket, roomCode, "X");
    });
  };

  const joinRoom = (
    socket: Socket,
    roomCode: string | null,
    player: Player
  ) => {
    socket.emit("joinRoom", roomCode, name);

    socket.on("roomJoined", (roomCode: string) => {
      console.log("Room joined:", roomCode);
      setGameSession({
        playerName: name,
        playerSymbol: player,
      });
      router.push(`/rooms/${roomCode}`);
    });

    socket.on("roomNotFound", (message: string) => {
      throw new Error(message);
    });
  };

  // useEffect(() => {
  //   if (gameSession?.roomCode && gameSession?.roomCode.length === 4) {
  //     router.push(`/rooms/${gameSession.roomCode}`);
  //   }
  // }, [gameSession, gameSession?.roomCode, router]);

  return (
    <div
      id="playerNameModal"
      className="z-999 flex flex-col w-full h-full items-center justify-center rounded-lg absolute bg-white/10 backdrop-blur-xs"
    >
      <div className="2xl:w-2xl lg:w-xl md:w-lg sm:w-md  shadow-[0px_3px_7px_rgba(0,0,0,0.5)] bg-white rounded-lg px-10 pb-5 relative">
        <div className="text-black font-black text-2xl 3xl:text-3xl text-center py-7">
          {!modalOptionSelected ? "Enter Room Code" : props.title}
        </div>
        {modalOptionSelected === -1 ? (
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              console.log(name);
              if (error) setError(""); // Clear error on input change
            }}
            required
            className={`text-black text-lg 3xl:text-3xl border-4 rounded-lg p-2 my-5 text-center w-full ${
              error
                ? "border-red-500 placeholder-red-500"
                : "border-amber-500 active:border-amber-900"
            }`}
            placeholder={error || "Enter your name"}
          />
        ) : (
          <input
            type="text"
            value={roomCode}
            maxLength={4}
            onChange={(e) => {
              const value = e.target.value.toUpperCase(); // Convert to uppercase if needed

              useGameStore.setState((state) => ({
                gameSession: { ...state.gameSession, roomCode: value },
              }));
            }}
            required
            className={`text-black text-lg 3xl:text-3xl border-4 rounded-lg p-2 my-5 text-center w-full ${
              error
                ? "border-red-500 placeholder-red-500"
                : "border-amber-500 active:border-amber-900"
            }`}
            placeholder={error || "Enter Room Code"}
          />
        )}
        {modalOptionSelected !== -1 ? (
          <div className="flex max-sm:flex-col flex-row w-full items-center justify-center text-lg relative py-5">
            <Button
              text="Create Room"
              className="text-sm max-sm:w-full max-sm:mb-1 max-sm:mx-0 mr-2"
              handleClick={() => setSocketAndCreateRoom()}
            />
            <Button
              text="Join Room"
              className="text-sm max-sm:w-full max-sm:mt-1 max-sm:mx-0 ml-2"
              handleClick={() => setSocketAndJoinRoom()}
            />
          </div>
        ) : (
          <div className="flex max-sm:flex-col flex-row w-full items-center justify-center text-lg relative py-5">
            <Button
              text="Play with Friend"
              className="text-sm max-sm:w-full max-sm:mb-1 max-sm:mx-0 mr-2"
              handleClick={() => {
                if (name.length === 0) {
                  setError("Please enter your name.");
                  return;
                }
                if (error) setError("");
                setModalOptionSelected(0);
              }}
            />
            <Button
              text="Play with AI"
              className="text-sm max-sm:w-full max-sm:mt-1 max-sm:mx-0 ml-2"
              handleClick={() => {
                if (name.length === 0) {
                  setError("Please enter your name.");
                  return;
                }
                if (error) setError("");
                setModalOptionSelected(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
