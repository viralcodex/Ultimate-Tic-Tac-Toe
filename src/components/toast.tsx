"use client"

import useGameStore from '@/store/store';
import React from 'react'

function Toast() {
    const currentPlayer = useGameStore((state) => state.currentPlayer);
  return (
    <div className='text-white bg-amber-800 opacity-80 p-2 rounded-lg w-40 text-xl 2xl:text-2xl flex flex-row align-middle justify-center z-10 absolute'>{`${currentPlayer}'s Turn`}</div>
  )
}

export default Toast