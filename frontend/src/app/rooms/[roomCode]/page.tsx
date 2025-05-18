"use server";
import React from "react";
import Game from "./game";
import Header from "./components/header";
import { notFound } from "next/navigation";
import { roomCodeExists } from "@/app/utils/utils";

export default async function HomePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;

  const isRoomCodeValid: boolean = await roomCodeExists(roomCode);

  if (!isRoomCodeValid) {
    return notFound();
  }

  return (
    <div className="flex flex-col w-full h-full">
      <Header />
      <div className=" flex flex-col flex-1">
        <Game roomCode={roomCode} />
      </div>
    </div>
  );
}
