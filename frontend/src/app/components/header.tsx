"use client";

import { useState } from "react";
import { Grid, Menu, X } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const options = ["How to Play", "Leaderboard", "Account"];

  return (
    <div
      className="
        flex 
        justify-between
        items-center
        w-full
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
      {/* Left side: title or icon */}
      <div className="flex items-center">
        {/* Title on larger screens */}
        <h1 className="hidden sm:block text-white font-bold">
          Super Tic Tac Toe
        </h1>

        {/* Icon on small screens */}
        <h1 className="sm:hidden text-white font-bold">
          <Grid size={24} />
        </h1>
      </div>

      {/* Right side: desktop nav + mobile menu */}
      <div className="flex items-center">
        {/* Desktop nav items (hidden on small screens) */}
        <div className="hidden sm:flex gap-5 mr-4">
          {options.map((option, index) => (
            <h1 key={index} className="text-white cursor-pointer">
              {option}
            </h1>
          ))}
        </div>

        {/* Mobile menu button + dropdown (shown on small screens) */}
        <div className="sm:hidden relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          {menuOpen && (
            <div
              className="
                absolute right-0 top-15
                bg-white/80
                backdrop-blur-md
                shadow-xl
                rounded-lg
                p-4
                border-amber-700 border-2
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
      </div>
    </div>
  );
}
