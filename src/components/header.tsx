"use client";

import { useState } from "react";
import { Grid, Menu, X } from "lucide-react"; // or any other icon library

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const options = ["How to Play", "Leaderboard", "Account"];

  return (
    <div
      className="flex w-full items-center justify-between
        bg-amber-700
        rounded-b-lg
        shadow-[0px_3px_7px_rgba(0,0,0,0.5)]
        p-4
        text-xl
        min-3xl:p-6
        min-3xl:text-2xl
        z-10
      "
    >
      {/* Title (left) */}
      <h1 className="max-sm:hidden text-white font-bold">Super Tic Tac Toe</h1>
      <h1 className="max-sm:block sm:hidden text-white font-bold">
        <Grid size={24} />
      </h1>
      {/* Desktop nav items (right, hidden on small) */}
      <div className="hidden sm:flex gap-5">
        {options.map((option, index) => (
          <h1 key={index} className="text-white cursor-pointer">
            {option}
          </h1>
        ))}
      </div>

      {/* Mobile menu button (right, hidden on sm+) */}
      <div className="sm:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          className="
            absolute top-16 right-4
            bg-white/80
            backdrop-blur-md
            shadow-lg
            rounded-lg
            p-4
            border-amber-700 border-2
            sm:hidden
          "
        >
          {options.map((option, index) => (
            <h1 key={index} className="text-black cursor-pointer">
              {option}
            </h1>
          ))}
        </div>
      )}
    </div>
  );
}
