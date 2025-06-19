import React from "react";
import { twMerge } from "tailwind-merge";

function Button(
  props: Readonly<{
    text?: string;
    icon?: React.ReactNode;
    className?: string;
    isLoading?: boolean;
    handleClick?: () => void;
  }>
) {
  return (
    <button
      className={twMerge(
        `flex justify-center align-middle
      bg-amber-700 font-bold rounded-lg
      shadow-[0px_3px_7px_rgba(0,0,0,0.5)] cursor-pointer
      hover:bg-amber-800 transition-all ease-in-out duration-300
      text-xl max-sm:w-45 max-sm:text-lg max-sm:px-4 sm:text-lg sm:px-5 md:text-xl md:py-3 md:px-6 3xl:text-2xl 3xl:py-5 py-3 px-2`,
        props.className
      )}
      onClick={props.handleClick}
      disabled={props.isLoading}
    >
      {props.icon ? (
        <span className="animate-spin">{props.icon}</span>
      ) : (
        props.text
      )}
    </button>
  );
}

export default Button;
