"use client";

import Modal from "./components/modal";

export default function Home() {
  return (
    <div className="flex flex-col w-full h-full align-middle justify-center relative">
      <Modal title="Enter Your Name" />
    </div>
  );
}
