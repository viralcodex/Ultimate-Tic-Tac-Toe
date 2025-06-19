"use client";
import Header from "./components/header";
import LandingPage from "./components/landingPage";
import WelcomeText from "./components/welcomeText";
import * as src from "@/constants/constants";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full relative">
      <Header />
      <div className="flex flex-col w-full h-full align-middle justify-center items-center backdrop-blur-xs">
        <WelcomeText />
        <div className="flex flex-col w-full align-middle justify-center items-center px-10">
          <LandingPage title={src.PLACEHOLDER_NAME} />
        </div>
      </div>
    </div>
  );
}
