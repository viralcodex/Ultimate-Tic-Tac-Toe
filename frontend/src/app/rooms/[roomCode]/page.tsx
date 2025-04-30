import React from "react";
import Game from "./game";
import Header from "./components/header";

export default async function HomePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const { roomCode } = await params;
  return (
    <div className="flex flex-col w-full h-full">
      <Header />
      <div className=" flex flex-col flex-1">
        <Game roomCode={roomCode} />
      </div>
    </div>
  );
}
