"use client";

import { twMerge } from "tailwind-merge";
import OuterCell from "./outerCell";
import useGameStore from "@/store/store";

export default function Grid() {
  const allowedOuterCell = useGameStore((state) => state.allowedOuterCell);
  const winner = useGameStore((state) => state.winner);
  return (
    <div
      className={twMerge(
        `max-sm:w-90 sm:w-sm md:w-[440px] lg:w-lg xl:w-[560px] 2xl:w-[580px] 3xl:w-3xl aspect-square 
       rounded-lg bg-white/80 border-4 border-amber-700 
       backdrop-brightness-100 transition-all ease-in-out duration-300 relative z-5 p-7`,
        allowedOuterCell !== null
          ? `shadow-[0px_3px_7px_rgba(0,0,0,0.5)]`
          : `shadow-[0px_0px_15px_5px_rgba(255,0,0,0.5)]`
      )}
    >
      {winner ? (
        <div className="bg-amber-700 text-white max-sm:text-3xl text-4xl font-bold flex items-center justify-center transition-all ease-in-out duration-300 h-full w-full">
          {winner === "Draw" ? "It's a Draw!" : `Player ${winner} Wins!!!`}
        </div>
      ) : (
        <div className={twMerge(`grid grid-cols-3`)}>
          {Array.from({ length: 9 }).map((_, index) => (
            <OuterCell index={index} key={index} />
          ))}
        </div>
      )}
    </div>
  );
}
