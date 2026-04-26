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
  const [friendIsTyping, setFriendIsTyping] = useState(false);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) {
          setIsReconnecting(true);
          socket.connect();
        } else {
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

    const handleConnect = () => {
      socket.emit("joinChat", { chatId });
      setIsReconnecting(false);
    };

    const handleDisconnect = () => {
      if (document.visibilityState === "visible") {
        setIsReconnecting(true);
      }
    };

    // ─── Typing indicator ────────────────────────────────────────────────────
    const handleTyping = ({ userId }: { userId: string }) => {
      if (userId !== user.id) {
        setFriendIsTyping(true);
        // Auto-clear after 3s in case stopTyping event is missed
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setFriendIsTyping(false), 3000);
      }
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      if (userId !== user.id) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setFriendIsTyping(false);
      }
    };
    // ────────────────────────────────────────────────────────────────────────

    socket.on("receiveMessage", handleReceive);
    socket.on("messageDeleted", handleDeleted);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageDeleted", handleDeleted);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, chatId, user, decodeMsg]);

  // ─── Input change with typing emit ──────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    socket?.emit("typing", { chatId, userId: user?.id });

    // Emit stopTyping after 2s of no keystrokes
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit("stopTyping", { chatId, userId: user?.id });
    }, 2000);
  };
  // ────────────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !chatId) return;

    // Guard: don't try to emit on a dead socket
    if (!socket?.connected) {
      setIsReconnecting(true);
      socket?.connect();
      socket?.once("connect", () => {
        socket.emit("joinChat", { chatId });
        setIsReconnecting(false);
      });
      return;
    }

    // Stop typing indicator immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit("stopTyping", { chatId, userId: user?.id });

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
            {friendIsTyping ? (
              <span className="animate-pulse text-primary">typing...</span>
            ) : isReconnecting ? (
              "Reconnecting..."
            ) : (
              "online"
            )}
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

            {/* Typing indicator bubble */}
            {friendIsTyping && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                  {friendName.charAt(0).toUpperCase()}
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-accent px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                </div>
              </div>
            )}
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
            onChange={handleInputChange}
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