import React from "react";
import { twMerge } from "tailwind-merge";

function Option(props: Readonly<{ text: string; className?: string }>) {
  const handleClick = () => {
    if (props.text === "How to Play") {
      const element = document.getElementById("howToPlay");
      if (element) {
        element.classList.remove("hidden");
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <h1
      id={props.text}
      className={twMerge(
        "cursor-pointer transition-all ease-in-out duration-300",
        props.className
      )}
      onClick={handleClick}
    >
      {props.text}
    </h1>
  );
}

export default Option;
