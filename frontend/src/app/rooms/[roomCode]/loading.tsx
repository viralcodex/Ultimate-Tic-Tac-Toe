"use client";
import { LoaderCircleIcon } from "lucide-react";
import React from "react";

function LoadingGame() {
  return (
    <div className=" text-amber-800 w-full h-full flex flex-col items-center justify-center gap-y-10">
      <LoaderCircleIcon size={100} className="animate-spin" />
      <h1>Loading Game...</h1>
      </div>
  );
}

export default LoadingGame;
