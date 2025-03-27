import useGameStore from "@/store/store";
import React from "react";

function Button(props: Readonly<{ text: string }>) {
  return (
    <button
      className="flex justify-center align-middle
      bg-amber-700 font-bold rounded-lg
      shadow-[0px_3px_7px_rgba(0,0,0,0.5)] cursor-pointer
      hover:bg-amber-800 transition-all ease-in-out duration-300
      text-xl max-sm:w-35 max-sm:text-lg max-sm:px-2 md:text-xl md:py-3 md:px-6 3xl:w-65 3xl:text-3xl w-45 min-w-25 py-3 px-6"
      onClick={useGameStore((state) => state.resetGame)}
    >
      {props.text}
    </button>
  );
}

export default Button;
