import { useEffect, useState, useCallback } from "react";
import { socket } from "../Socket";

export type SocketConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "error";

export interface SocketStatusState {
  status: SocketConnectionStatus;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useSocketStatus(): SocketStatusState {
  const [status, setStatus] = useState<SocketConnectionStatus>(() => {
    if (socket.connected) return "connected";
    if (socket.active) return "connecting";
    return "disconnected";
  });
  const [error, setError] = useState<string | null>(null);

  const reconnect = useCallback(() => {
    setStatus("connecting");
    setError(null);
    if (!socket.connected) {
      socket.connect();
    }
  }, []);

  useEffect(() => {
    const handleConnect = () => {
      setStatus("connected");
      setError(null);
    };

    const handleDisconnect = (_reason: string) => {
      setStatus("disconnected");
    };

    const handleConnectError = (err: Error) => {
      setStatus("error");
      setError(err?.message || "Failed to connect to game server");
    };

    const handleReconnectAttempt = () => {
      setStatus("connecting");
    };

    // Initial check
    if (socket.connected) {
      setStatus("connected");
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    // Socket.IO Manager reconnection events
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleConnect);
    socket.io.on("reconnect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);

      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleConnect);
      socket.io.off("reconnect_error", handleConnectError);
    };
  }, []);

  return {
    status,
    isConnected: status === "connected",
    error,
    reconnect,
  };
}
