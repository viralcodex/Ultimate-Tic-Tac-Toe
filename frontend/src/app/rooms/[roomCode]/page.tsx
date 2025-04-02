"use server";
import React from "react";
import Game from "./game";

export default async function HomePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  return <Game roomId={roomCode} />;
}
