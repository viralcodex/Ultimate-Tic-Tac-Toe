"use client";

import useGameStore from "@/store/store";
import { Circle, X } from "lucide-react";
import React from "react";

export default function WinnerCell(
  props: Readonly<{ innerWinner: string; outerCell: number }>
) {
  const selectedCell = useGameStore((state) => state.selectedCell);
  return props.outerCell === selectedCell.outer ? (
    props.innerWinner === "X" ? (
      <X color="brown" className="h-full w-full" strokeWidth={3} />
    ) : (
      <Circle color="brown" className="h-full w-full" strokeWidth={3} />
    )
  ) : null;
}
