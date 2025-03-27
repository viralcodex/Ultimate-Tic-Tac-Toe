"use client";

import { twMerge } from "tailwind-merge";
import InnerCell from "./innerCell";
import useGameStore from "@/store/store";
import { Circle, Minus, X } from "lucide-react";

export default function OuterCell(props: Readonly<{ index: number }>) {
  const setSelectedCell = useGameStore((state) => state.setSelectedCell);
  const selectedCellHistory = useGameStore(
    (state) => state.selectedCellHistory
  );
  const allowedOuterCell = useGameStore((state) => state.allowedOuterCell);
  const setAllowedOuterCell = useGameStore(
    (state) => state.setAllowedOuterCell
  );
  const innerWinners = useGameStore((state) => state.innerWinners); // Updated to use the mapping

  /*
   * 1. If the game has not started and any outer cell is won or active after being complete, then all of the outer cells should be clickable
   * 2. If all the outer cells are clickable OR the active cell is equal to allowedOuterCell, then the outer cell is clickable
   */
  const areAllClickable = allowedOuterCell === null;
  const isClickable = areAllClickable || allowedOuterCell === props.index;
  const isGridVisible =
    selectedCellHistory.includes(props.index) ||
    allowedOuterCell === props.index;

  const handleClick = () => {
    if (!isClickable || innerWinners[props.index]) return; // If the outer cell is not clickable or already won, then return
    console.log("Outer Cell Clicked", props.index);
    setSelectedCell(props.index, null);
    setAllowedOuterCell(props.index);
  };

  return (
    <div
      className={twMerge(
        `flex items-center justify-center rounded-lg aspect-square border-black border-2`,
        isClickable && !innerWinners[props.index]
          ? areAllClickable
            ? `transition-all hover:bg-white ease-in-out duration-300 cursor-pointer`
            : `transition-all hover:bg-white bg-white/80 ease-in-out duration-300 cursor-pointer border-4 border-red-500`
          : `cursor-not-allowed`
      )}
      onClick={handleClick}
      key={props.index}
    >
      {innerWinners[props.index] ? (
        // Use the innerWinner mapping to determine the winner for this outerCell
        innerWinners[props.index] === "X" ? (
          <X className="h-full w-full text-red-500" strokeWidth={3} />
        ) : innerWinners[props.index] === "O" ? (
          <Circle
            className="h-full w-full text-green-500 p-2"
            strokeWidth={3}
          />
        ) : (
          <Minus className="h-full w-full text-blue-700" strokeWidth={3} />
        )
      ) : (
        isGridVisible && (
          <div
            className="grid grid-cols-3 aspect-square
                      w-full p-2 transition-all ease-in-out duration-300"
          >
            {Array.from({ length: 9 }).map((_, index2) => (
              <InnerCell
                outerCell={props.index}
                innerCell={index2}
                key={index2}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
