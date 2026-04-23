import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    console.log("[useSocket] Creating socket for user:", userId);

    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("[useSocket] Connected:", newSocket.id);
      newSocket.emit("join", userId);
      console.log("[useSocket] Sent join event for user:", userId);
    });

    newSocket.on("disconnect", () => {
      console.log("[useSocket] Disconnected:", newSocket.id);
    });

    setSocket(newSocket);

    return () => {
      console.log("[useSocket] Cleaning up socket for user:", userId);
      newSocket.disconnect();
      setSocket(null);
    };
  }, [userId]);

  return socket;
};