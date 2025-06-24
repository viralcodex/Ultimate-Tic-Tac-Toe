// socket.d.ts
import { Socket } from "socket.io-client";

// Extend the Socket interface
declare module "socket.io-client" {
  interface Socket {
    playerID: string; // Assuming playerID is a string, modify as needed
    roomCode: string | null; // Assuming roomCode is a string, modify as needed
  }
}
