import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { getPendingRequestsReceived } from "@/api/friendship";
import { respondToRequest } from "@/api/friendship";
import FriendRequestCard from "@/components/FriendRequestCard";
import { Bell, MessageCircle, X } from "lucide-react";

interface MessageNotification {
  id: string;
  senderName: string;
  content: string;
  receivedAt: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageNotifs, setMessageNotifs] = useState<MessageNotification[]>([]);

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

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = () => loadRequests();
    const handleResponded = () => loadRequests();

    // ── Incoming message notification ──────────────────────────────────────
    const handleReceiveMessage = (message: any) => {
      // Don't show a notif for messages the current user sent
      if (message.senderId === user?.id) return;

      setMessageNotifs((prev) => [
        {
          id: message.id,
          senderName: message.senderName,
          // Content is encrypted — show a generic label since we can't
          // decrypt here without the private key context from Chat.tsx
          content: "New encrypted message",
          receivedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);
    };
    // ───────────────────────────────────────────────────────────────────────

    socket.on("friendRequestReceived", handleNewRequest);
    socket.on("friendRequestResponded", handleResponded);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("friendRequestReceived", handleNewRequest);
      socket.off("friendRequestResponded", handleResponded);
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [socket, loadRequests, user?.id]);

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

  const dismissMessageNotif = (id: string) => {
    setMessageNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Notifications</h1>
      <p className="mb-6 text-sm text-muted-foreground">Stay updated with friend requests and messages</p>

      {/* Message Notifications */}
      {messageNotifs.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            New Messages
          </h2>
          <div className="space-y-2">
            {messageNotifs.map((notif) => (
              <div
                key={notif.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-accent/40 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {notif.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{notif.senderName}</p>
                    <p className="text-xs text-muted-foreground">{notif.content}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">{notif.receivedAt}</p>
                  </div>
                </div>
                <button
                  onClick={() => dismissMessageNotif(notif.id)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend Requests */}
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        <Bell className="h-4 w-4" />
        Friend Requests
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : requests.length === 0 && messageNotifs.length === 0 ? (
        <div className="py-12 text-center">
          <Bell className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No pending notifications</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-muted-foreground">No pending friend requests</p>
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