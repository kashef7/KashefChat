import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { getPendingRequestsReceived } from "@/api/friendship";
import { respondToRequest } from "@/api/friendship";
import FriendRequestCard from "@/components/FriendRequestCard";
import { Bell } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const data = await getPendingRequestsReceived();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = () => {
      loadRequests();
    };

    const handleResponded = () => {
      loadRequests();
    };

    socket.on("friendRequestReceived", handleNewRequest);
    socket.on("friendRequestResponded", handleResponded);

    return () => {
      socket.off("friendRequestReceived", handleNewRequest);
      socket.off("friendRequestResponded", handleResponded);
    };
  }, [socket, loadRequests]);

  const handleRespond = async (senderId: string, action: "accept" | "reject") => {
    try {
      await respondToRequest(senderId, action === "accept" ? "Accepted" : "Rejected");
      socket?.emit("friendRequestRespond", {
        senderId,
        responderName: user?.name,
        status: action === "accept" ? "Accepted" : "Rejected",
      });
      setRequests((prev) => prev.filter((r) => r.senderId !== senderId));
    } catch (err) {
      console.error(`Failed to ${action} request:`, err);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Notifications</h1>
      <p className="mb-6 text-sm text-muted-foreground">Stay updated with friend requests and messages</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 text-center">
          <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No pending notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <FriendRequestCard
              key={req.senderId}
              name={req.sender.name}
              email={req.sender.email}
              avatarUrl={req.sender.avatar}
              onAccept={() => handleRespond(req.senderId, "accept")}
              onReject={() => handleRespond(req.senderId, "reject")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
