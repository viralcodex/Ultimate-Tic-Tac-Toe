// socket.d.ts
import { Socket } from "socket.io-client";

// Extend the Socket interface
declare module "socket.io-client" {
  interface Socket {
    userID: string; // Assuming userID is a string, modify as needed
    roomCode: string | null; // Assuming roomCode is a string, modify as needed
  }
}
