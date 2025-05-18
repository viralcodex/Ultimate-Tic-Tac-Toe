import React from "react";
import Button from "./button";
import { X } from "lucide-react";

function HowToPlay() {
  const handleClick = () => {
    // Logic to close the modal
    const modal = document.getElementById("howToPlay");
    if (modal) {
      modal.classList.add("hidden");
    }
    console.log("Modal closed");
  };
  return (
    <div className="w-full rounded-lg bg-white/80 border-4 border-amber-600 transition-all ease-in-out duration-300 p-5">
      <div className="flex flex-row items-center justify-between align-middle">
        <h2 className="text-lg font-bold text-black">How to Play</h2>
        <Button
          icon={<X size={24} strokeWidth={4} />}
          handleClick={handleClick}
        />
      </div>
      <ul className="list-disc list-inside text-black mt-2 gap-y-3">
        <li>The game is played on a 3x3 grid of smaller tic-tac-toe boards.</li>
        <li>
          Players take turns placing their mark (X or O) on one of the smaller
          boards. Starts with X.
        </li>
        <li>
          The position of your move determines which smaller board your opponent
          must play in next.
        </li>
        <li>
          To win a smaller board, you must get three of your marks in a row
          (horizontally, vertically, or diagonally).
        </li>
        <li>
          To win the game, you must win three smaller boards in a row
          (horizontally, vertically, or diagonally).
        </li>
        <li>
          If a smaller board is already won or full, the opponent can play in
          any other available board.
        </li>
        <li>
          The game ends when a player wins the main board or all smaller boards
          are full.
        </li>
      </ul>
    </div>
  );
}

export default HowToPlay;
