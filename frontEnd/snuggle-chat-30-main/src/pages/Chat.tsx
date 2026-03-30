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

  const chatBoxRef = useRef<HTMLDivElement>(null);

  const decodeMsg = useCallback(
    async (msg: any): Promise<string> => {
      const privateKey = localStorage.getItem("privateKey");
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
      const decoded: DecodedMessage[] = [];
      for (const msg of reversed) {
        msg.encryptedKey = msg.keys?.find((k: any) => k.userId === user.id)?.encryptedKey;
        const content = await decodeMsg(msg);
        decoded.push({
          id: msg.id,
          content,
          isSent: msg.senderId === user.id,
          senderName: msg.senderId === user.id ? "You" : (friend?.user?.name ?? "Unknown"),
          timestamp: msg.sentAt,
        });

        // Mark as read
        if (msg.senderId !== user.id && !msg.isRead && socket) {
          socket.emit("markMessageAsRead", { messageId: msg.id, chatId });
        }
      }
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

  // Socket listeners
  useEffect(() => {
    if (!socket || !chatId || !user) return;

    socket.emit("joinChat", { chatId });

    const handleReceive = async (message: any) => {
      const isSent = message.senderId === user.id;
      message.encryptedKey = message.keys?.find((k: any) => k.userId === user.id)?.encryptedKey;
      const content = await decodeMsg(message);
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

    socket.on("receiveMessage", handleReceive);
    socket.on("messageDeleted", handleDeleted);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageDeleted", handleDeleted);
    };
  }, [socket, chatId, user, decodeMsg]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !user || !chatId) return;

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
      const decoded: DecodedMessage[] = [];
      for (const msg of reversed) {
        msg.encryptedKey = msg.keys?.find((k: any) => k.userId === user.id)?.encryptedKey;
        const content = await decodeMsg(msg);
        decoded.push({
          id: msg.id,
          content,
          isSent: msg.senderId === user.id,
          senderName: msg.senderId === user.id ? "You" : (friendData?.user?.name ?? "Unknown"),
          timestamp: msg.sentAt,
        });
      }
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
        <div>
          <p className="font-semibold text-foreground">{friendName}</p>
          <p className="text-xs text-muted-foreground">online</p>
        </div>
      </header>

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
                content={msg.content}
                isSent={msg.isSent}
                senderName={msg.senderName}
                timestamp={msg.timestamp}
                onContextMenu={
                  msg.isSent
                    ? (e) => {
                        e.preventDefault();
                        setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg.id });
                      }
                    : undefined
                }
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
            placeholder="Type your message..."
            className="flex-1 rounded-xl border border-input bg-accent/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={handleSend}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
