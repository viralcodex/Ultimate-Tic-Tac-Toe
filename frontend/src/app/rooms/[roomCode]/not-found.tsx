// app/rooms/[roomCode]/not-found.tsx
"use client";

import { useSocket } from "@/provider/socketProvider";
import useGameStore from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoomNotFound() {
  const router = useRouter();
  const socket = useSocket();
  const gameSession = useGameStore((state) => state.gameSession);
  const [isHit, setIsHit] = useState(false);
  const [seconds, setSeconds] = useState(4);
  //this effect will run when the component mounts
  //it will check if the gameSession has a roomCode
  //if it does, it will emit a rejoinRoom event to the socket
  //if the room is found, it will go back to the previous page
  //if the room is not found, it will redirect to the home page
  //if the gameSession does not have a roomCode, it will go back to the previous page
  useEffect(() => {
  let fallbackTimeout: NodeJS.Timeout;

  if (gameSession?.roomCode && socket) {
    socket.emit("rejoinRoom", gameSession.roomCode);

    const handleRoomJoined = () => {
      clearTimeout(fallbackTimeout);
      router.back();
    };

    const handleRoomNotFound = () => {
      clearTimeout(fallbackTimeout);
      router.push("/");
    };

    socket.once("roomJoined", handleRoomJoined);
    socket.once("roomNotFound", handleRoomNotFound);

    // fallback after 1.5s in case neither event arrives
    fallbackTimeout = setTimeout(() => {
      router.push("/");
    }, 1500);
  } else {
    fallbackTimeout = setTimeout(() => {
      router.back();
    }, 1500);
  }

  return () => {
    clearTimeout(fallbackTimeout);
    setIsHit(false);
    setSeconds(6);
    socket?.off("roomJoined");
    socket?.off("roomNotFound");
  };
}, [gameSession, router, socket]);

  return (
    <div className="text-amber-800 w-full h-full flex flex-col items-center justify-center gap-y-10">
      <h1 className="text-3xl font-black mb-2">Room Not Found :\</h1>
      <p className="mb-4 text-gray-800 text-xl">
        Oops, that room doesn’t exist or has already expired.
      </p>
      <p className="text-gray-800 text-lg">
        Redirecting you to the home page...
      </p>
    </div>
  );
}
