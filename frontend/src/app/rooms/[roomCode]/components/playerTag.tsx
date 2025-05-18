import React from "react";
import { twMerge } from "tailwind-merge";

const PlayerTag = (
  props: Readonly<{
    text: string | null | undefined;
    className?: string;
  }>
) => {
  return (
    <div
      className={twMerge(
        `bg-amber-700 flex font-black justify-center py-3 px-4 min-w-20 flex-wrap shadow-[0px_3px_7px_rgba(0,0,0,0.5)] text-xl`,
        props.className
      )}
    >
      {props.text}
    </div>
  );
};

export default PlayerTag;
