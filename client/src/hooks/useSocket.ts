import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = (userId?: string) => {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Runs only once the user is loaded
    if (!userId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL);

    // Sends the join event to the backend
    socketRef.current.emit("join", userId);

    console.log("Socket connected, joined room:", userId);

    return () => {
      socketRef.current.disconnect();
    };
  }, [userId]); // Re-runs if the userId has changed

  return socketRef.current;
};