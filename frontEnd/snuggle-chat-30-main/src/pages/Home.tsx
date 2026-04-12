import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getFriends } from "@/api/friendship";
import { startChat } from "@/api/chat";
import ChatRow from "@/components/ChatRow";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadFriends = useCallback(async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (err) {
      console.error("Failed to load friends:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  const handleStartChat = async (friendId: string) => {
    try {
      const chat = await startChat(friendId);
      navigate(`/chat/${chat.id}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
    }
  };

  const filteredFriends = friends.filter((f) => {
    const friend = f.senderId === user?.id ? f.receiver : f.sender;
    const term = search.toLowerCase();
    return (
      friend.name.toLowerCase().includes(term) ||
      friend.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">KashefChat</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-accent transition-colors hover:bg-secondary"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-foreground" />
            )}
          </button>
          <button
            onClick={() => navigate("/notifications")}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent transition-colors hover:bg-secondary"
          >
            <Bell className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats..."
          className="w-full rounded-xl border border-input bg-accent/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Recent Chats */}
      <h2 className="mb-3 text-lg font-semibold text-foreground">Recent Chats</h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredFriends.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {search ? "No chats found" : "No friends yet. Add some friends to start chatting!"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredFriends.map((friendship) => {
            const friend =
              friendship.senderId === user?.id
                ? friendship.receiver
                : friendship.sender;
            return (
              <ChatRow
                key={friendship.id || friend.id}
                name={friend.name}
                email={friend.email}
                avatarUrl={friend.avatar}
                onClick={() => handleStartChat(friend.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
