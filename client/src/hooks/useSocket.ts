import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (userId?: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    console.log("[useSocket] Initializing socket for userId:", userId);

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("[useSocket] Connected:", socketRef.current?.id);

      // Join user-specific room
      socketRef.current?.emit("join", userId);
      console.log("[useSocket] Joined room:", userId);
    });

    socketRef.current.on("disconnect", () => {
      console.log("[useSocket] Disconnected");
    });

    return () => {
      console.log("[useSocket] Cleaning up socket");
      socketRef.current?.disconnect();
    };
  }, [userId]);

  return socketRef.current;
};