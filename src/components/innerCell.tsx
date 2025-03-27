"use client";

import useGameStore from "@/store/store";
import { Circle, X } from "lucide-react";
import React from "react";
import { twMerge } from "tailwind-merge";

export default function InnerCell(
  props: Readonly<{ outerCell: number; innerCell: number }>
) {
  const innerWinners = useGameStore((state) => state.innerWinners);
  const allowedOuterCell = useGameStore((state) => state.allowedOuterCell);
  const board = useGameStore((state) => state.board);
  const makeMove = useGameStore((state) => state.makeMove);
  const boardValue = board[props.outerCell][props.innerCell];

  /*
    * Check if the inner cell is clickable
    * 1. If the inner cell is already filled, it should not be clickable OR
    * 2. If the outer cell is already won, it should not be clickable OR
    * 3. If the outer cell is not allowed to be clicked, it should not be clickable AND
    * 4. If the outer cell is allowed to be clicked (when the allowedOuterCell is null), it should be clickable
  */
  const isInnerCellClickable =
    boardValue !== null ||
    innerWinners[props.outerCell] ||
    (allowedOuterCell !== null && allowedOuterCell !== props.outerCell);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (isInnerCellClickable) return;
    makeMove(props.outerCell, props.innerCell);
  };

  return (
    <div
      className={twMerge(
        "flex items-center justify-center border border-black rounded-lg aspect-square font-black text-black",
       !isInnerCellClickable
          ? " hover:bg-amber-600/30 hover:text-white transition-all ease-in-out duration-300 cursor-pointer"
          : null
      )}
      onClick={handleClick}
    >
      {boardValue === "X" ? (
        <X className="h-full w-full text-red-500" strokeWidth={3} />
      ) : boardValue !== null ? (
        <Circle className="h-full w-full text-green-500 p-1" strokeWidth={3} />
      ) : null}
    </div>
  );
}
