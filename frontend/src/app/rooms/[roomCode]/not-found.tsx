// app/rooms/[roomCode]/not-found.tsx
"use client";

import { useSocket } from "@/provider/socketProvider";
import useGameStore from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoomNotFound() {
  const router = useRouter();
  const socket = useSocket();
  const gameSession = useGameStore((state) => state.gameSession);

  //this effect will run when the component mounts
  //it will check if the gameSession has a roomCode
  //if it does, it will emit a rejoinRoom event to the socket
  //if the room is found, it will go back to the previous page
  //if the room is not found, it will redirect to the home page
  //if the gameSession does not have a roomCode, it will go back to the previous page
  useEffect(() => {
    const handleBack = () => {
      if (gameSession?.roomCode) {
        socket?.emit("rejoinRoom", gameSession.roomCode);

        socket?.once("roomJoined", () => {
          // Rejoin the room
          router.back();
        });
        socket?.once("roomNotFound", () => {
          // Room not found
          router.push("/");
        });
      } else {
        router.back();
      }
    };
    const t = setTimeout(handleBack, 4000);
    return () => clearTimeout(t);
  }, [gameSession?.roomCode, router, socket]);

  return (
    <div className="text-amber-800 w-full h-full flex flex-col items-center justify-center gap-y-10">
      <h1 className="text-3xl font-black mb-2">Room Not Found :C</h1>
      <p className="mb-4 text-gray-800 text-xl">
        Oops, that room doesn’t exist or has already expired.
      </p>
    </div>
  );
}
