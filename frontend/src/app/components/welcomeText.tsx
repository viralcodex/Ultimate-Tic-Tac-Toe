import React from "react";
import Icons from "./icons";

const WelcomeText = () => {
  return (
    <div className=" text-black text-center font-black text-3xl pb-20 px-10 flex flex-row items-center justify-center relative">
      <Icons/>
      <h1 className="relative">Welcome to Ultimate Tic Tac Toe!</h1>
    </div>
  );
};

export default WelcomeText;
