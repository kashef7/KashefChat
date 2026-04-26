import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { fetchMessages } from "@/api/chat";
import { decryptMessage } from "@/crypto/messageEncryption";
import { importRsaPublicKey } from "@/crypto/messageEncryption";
import MessageBubble from "@/components/MessageBubble";
import { ArrowLeft, Send, ChevronUp } from "lucide-react";

interface DecodedMessage {
  id: string;
  content: string;
  isSent: boolean;
  senderName: string;
  timestamp: string;
}

export default function Chat() {
  const { id: chatId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [input, setInput] = useState("");
  const [friendName, setFriendName] = useState("Loading...");
  const [friendData, setFriendData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  }, []);

  const decodeMsg = useCallback(
    async (msg: any, privateKey: string | null): Promise<string> => {
      const encryptedKey = msg.keys?.find((k: any) => k.userId === user?.id)?.encryptedKey || msg.encryptedKey;
      if (!privateKey || !encryptedKey) return "🔒 [Encrypted]";
      try {
        return await decryptMessage(msg.content, msg.iv, encryptedKey, privateKey);
      } catch {
        return "🔒 [Decryption Failed]";
      }
    },
    [user?.id]
  );

  const loadMessages = useCallback(async () => {
    if (!chatId || !user) return;
    try {
      const chat = await fetchMessages(chatId);
      const friend = chat.members.find((m: any) => m.userId !== user.id);
      setFriendData(friend);
      if (friend) setFriendName(friend.user.name);

      setNextCursor(chat.pagination.nextCursor);
      setHasNextPage(chat.pagination.hasNextPage);

      const reversed = [...chat.messages].reverse();
      const privateKey = localStorage.getItem("privateKey");

      const decodedPromises = reversed.map(async (msg) => {
        msg.encryptedKey = msg.keys?.find((k: any) => k.userId === user.id)?.encryptedKey;
        const content = await decodeMsg(msg, privateKey);

        if (msg.senderId !== user.id && !msg.isRead && socket) {
          socket.emit("markMessageAsRead", { messageId: msg.id, chatId });
        }

        return {
          id: msg.id,
          content,
          isSent: msg.senderId === user.id,
          senderName: msg.senderId === user.id ? "You" : (friend?.user?.name ?? "Unknown"),
          timestamp: msg.sentAt,
        };
      });

      const decoded = await Promise.all(decodedPromises);
      setMessages(decoded);
    } catch (err) {
      console.error("Error loading chat:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [chatId, user, decodeMsg, socket, navigate]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [loading]);

  // Socket listeners + visibility reconnect fix
  useEffect(() => {
    if (!socket || !chatId || !user) return;

    socket.emit("joinChat", { chatId });

    // ─── Mobile background/foreground fix ───────────────────────────────────
    // When the user swipes away and comes back, the browser suspends the tab
    // and the WebSocket silently dies. We detect the tab becoming visible again
    // and either reconnect or re-join the room.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) {
          setIsReconnecting(true);
          socket.connect();
        } else {
          // Socket is alive but the server may have evicted us from the room
          socket.emit("joinChat", { chatId });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // ────────────────────────────────────────────────────────────────────────

    const handleReceive = async (message: any) => {
      const isSent = message.senderId === user.id;
      message.encryptedKey = message.keys?.find((k: any) => k.userId === user.id)?.encryptedKey;
      const privateKey = localStorage.getItem("privateKey");
      const content = await decodeMsg(message, privateKey);
      setMessages((prev) => [
        ...prev,
        {
          id: message.id,
          content,
          isSent,
          senderName: isSent ? "You" : message.senderName,
          timestamp: message.sentAt,
        },
      ]);
      if (!isSent) {
        socket.emit("markMessageAsRead", { messageId: message.id, chatId });
      }
      setTimeout(() => {
        if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      }, 50);
    };

    const handleDeleted = (data: any) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.id));
    };

    // Re-join the room and clear reconnecting state after every reconnect
    const handleConnect = () => {
      socket.emit("joinChat", { chatId });
      setIsReconnecting(false);
    };

    const handleDisconnect = () => {
      // Only show reconnecting if the tab is still visible (user is watching)
      if (document.visibilityState === "visible") {
        setIsReconnecting(true);
      }
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageDeleted", handleDeleted);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageDeleted", handleDeleted);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, chatId, user, decodeMsg]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !chatId) return;

    // ─── Guard: don't try to emit on a dead socket ───────────────────────────
    if (!socket?.connected) {
      setIsReconnecting(true);
      socket?.connect();
      // Re-join and retry the send once connected
      socket?.once("connect", () => {
        socket.emit("joinChat", { chatId });
        // The user will need to press send again — avoids double-send complexity
        setIsReconnecting(false);
      });
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    const members: { userId: string; publicKeyPem: string }[] = [];
    if (user.publicKey) members.push({ userId: user.id, publicKeyPem: user.publicKey });
    if (friendData?.user?.publicKey) members.push({ userId: friendData.userId, publicKeyPem: friendData.user.publicKey });

    const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(text));
    const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
    const toBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

    const keys = await Promise.all(
      members.map(async ({ userId, publicKeyPem }) => {
        const rsaKey = await importRsaPublicKey(publicKeyPem);
        const encryptedKey = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, rsaKey, rawAesKey);
        return { userId, encryptedKey: toBase64(encryptedKey) };
      })
    );

    socket?.emit("sendMessage", {
      chatId,
      content: toBase64(ciphertext),
      iv: toBase64(iv.buffer),
      keys,
      senderId: user.id,
      senderName: user.name,
    });

    setInput("");
  };

  const loadOlderMessages = async () => {
    if (loadingMore || !hasNextPage || !nextCursor || !chatId || !user) return;
    setLoadingMore(true);
    try {
      const scrollBefore = chatBoxRef.current?.scrollHeight || 0;
      const chat = await fetchMessages(chatId, nextCursor);
      setNextCursor(chat.pagination.nextCursor);
      setHasNextPage(chat.pagination.hasNextPage);

      const reversed = [...chat.messages].reverse();
      const privateKey = localStorage.getItem("privateKey");

      const decodedPromises = reversed.map(async (msg) => {
        msg.encryptedKey = msg.keys?.find((k: any) => k.userId === user.id)?.encryptedKey;
        const content = await decodeMsg(msg, privateKey);
        return {
          id: msg.id,
          content,
          isSent: msg.senderId === user.id,
          senderName: msg.senderId === user.id ? "You" : (friendData?.user?.name ?? "Unknown"),
          timestamp: msg.sentAt,
        };
      });

      const decoded = await Promise.all(decodedPromises);
      setMessages((prev) => [...decoded, ...prev]);
      setTimeout(() => {
        if (chatBoxRef.current) {
          chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight - scrollBefore;
        }
      }, 50);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = (messageId: string) => {
    socket?.emit("deleteMessage", { messageId, chatId, senderId: user?.id });
    setContextMenu(null);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={() => navigate("/")} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
          {friendName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">{friendName}</p>
          <p className="text-xs text-muted-foreground">
            {isReconnecting ? "Reconnecting..." : "online"}
          </p>
        </div>
      </header>

      {/* Reconnecting banner */}
      {isReconnecting && (
        <div className="flex items-center justify-center gap-2 bg-yellow-500/10 px-4 py-2 text-xs text-yellow-600 dark:text-yellow-400">
          <div className="h-3 w-3 animate-spin rounded-full border border-yellow-500 border-t-transparent" />
          Reconnecting… messages will send once connected
        </div>
      )}

      {/* Messages */}
      <div ref={chatBoxRef} className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
        {hasNextPage && (
          <button
            onClick={loadOlderMessages}
            disabled={loadingMore}
            className="mx-auto mb-4 flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
          >
            <ChevronUp className="h-3 w-3" />
            {loadingMore ? "Loading..." : "Load older messages"}
          </button>
        )}

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet. Say hello!</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                id={msg.id}
                content={msg.content}
                isSent={msg.isSent}
                senderName={msg.senderName}
                timestamp={msg.timestamp}
                onContextMenu={msg.isSent ? handleContextMenu : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 rounded-lg border border-border bg-popover shadow-lg"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleDelete(contextMenu.messageId)}
              className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-accent"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isReconnecting ? "Reconnecting..." : "Type your message..."}
            disabled={isReconnecting}
            className="flex-1 rounded-xl border border-input bg-accent/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSend}
            disabled={isReconnecting}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}