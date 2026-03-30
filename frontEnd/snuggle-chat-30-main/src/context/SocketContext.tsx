import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { CONFIG } from "@/config";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) {
      setSocketInstance((prev) => {
        if (prev) prev.disconnect();
        return null;
      });
      return;
    }

    const socket = io(CONFIG.SOCKET_URL, { withCredentials: true });
    setSocketInstance(socket);

    socket.on("connect", () => {
      socket.emit("join", user.id);
    });

    return () => {
      socket.disconnect();
      setSocketInstance(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket: socketInstance }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
