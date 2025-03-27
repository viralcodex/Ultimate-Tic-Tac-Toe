"use client";

import Button from "@/components/button";
import Grid from "@/components/grid";
import Header from "@/components/header";
import useGameStore from "@/store/store";

export default function Home() {
  const winner = useGameStore((state) => state.winner);
  return (
    <div className="flex flex-col w-full h-full align-middle justify-center">
      <Header />
      {/* Main content area */}
      <div className="flex flex-1 flex-col w-full h-full items-center justify-center min-h-[500px] relative">
        <Grid />
        {/* Desktop: Absolute buttons on the right, moves below when space is insufficient */}
        <div className="hidden lg:grid grid-col grid-cols-5 absolute w-full">
          <div className="col-start-5">
            <Button text={winner ? "Play Again" : "Reset"} />
            <div className="p-2" />
            <Button text={"Cell Rewind"} />
          </div>
        </div>
        {/* Mobile & small screens: Buttons move to bottom */}
      </div>
      <div className="flex lg:hidden items-center justify-center space-x-10 max-sm:space-x-5 pb-10">
        <Button text={winner ? "Play Again" : "Reset"} />
        <Button text={"Cell Rewind"} />
      </div>
    </div>
  );
}
