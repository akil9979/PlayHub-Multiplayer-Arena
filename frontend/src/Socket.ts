import { io } from "socket.io-client";

const socketUrl =
  import.meta.env.VITE_SOCKET_URL?.trim() || "http://localhost:5000";

export const socket = io(socketUrl, {
  withCredentials: true,
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});