"use client";
import Button from "./components/button";
import Header from "./components/header";
import Grid from "./components/grid";
import useGameStore from "@/store/store";
import { useNavigationGuard } from "next-navigation-guard";

function Game(props: Readonly<{ roomId: string }>) {
  const socket = useGameStore((state) => state.socket);
  const setSocket = useGameStore((state) => state.setSocket);

 useNavigationGuard({
    enabled: true,
    confirm: () => {
      if (window.confirm("You have unsaved changes that will be lost.")) {
        // Disconnect the socket if it's connected
        if (socket && socket.connected) {
          socket.disconnect();
          setSocket(null); // Clear the socket from the store
        }
        return true; // Allow navigation
      }
      return false; // Prevent navigation
    },
  });

  const winner = useGameStore((state) => state.winner);
  const resetGame = useGameStore((state) => state.resetGame);
  return (
    <div className="flex flex-col w-full h-full align-middle justify-center relative">
      <Header />
      {/* Main content area */}
      <div className="flex flex-1 flex-col w-full h-full items-center justify-center relative">
        <Grid />
        {/* Desktop: Absolute buttons on the right, moves below when space is insufficient */}
        <div className="hidden lg:grid grid-col col-span-2 grid-cols-4 absolute w-full items-center justify-center">
          <div className="col-start-4 xl:p-12 lg:p-7 2xl:p-15 3xl:p-20 items-start justify-items-start flex flex-col">
            <Button
              text={winner ? "Play Again" : "Reset"}
              handleClick={resetGame}
              className="w-full mb-5"
            />

            <Button text={"Cell Rewind"} className="w-full" />
          </div>
        </div>
        {/* Mobile & small screens: Buttons move to bottom */}
      </div>
      <div className="flex flex-row lg:hidden items-center justify-center space-x-10 max-sm:space-x-5 pb-10">
        <Button
          text={winner ? "Play Again" : "Reset"}
          handleClick={resetGame}
          className="w-45"
        />
        <Button text={"Cell Rewind"} />
      </div>
    </div>
  );
}

export default Game;
