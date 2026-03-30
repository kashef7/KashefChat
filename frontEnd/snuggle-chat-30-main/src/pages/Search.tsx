import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { searchForUser } from "@/api/user";
import { sendFriendRequest } from "@/api/friendship";
import UserCard from "@/components/UserCard";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const users = await searchForUser(query);
      setResults(users.filter((u: any) => u.id !== user?.id));
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (email: string) => {
    try {
      await sendFriendRequest(email);
      socket?.emit("sendFriendRequest", {
        receiverEmail: email,
        senderName: user?.name,
      });
    } catch (err) {
      console.error("Failed to send friend request:", err);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <h1 className="mb-2 text-2xl font-bold text-foreground">Find People</h1>
      <p className="mb-6 text-sm text-muted-foreground">Search by name or email</p>

      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-input bg-accent/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={handleSearch}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((u: any) => (
            <UserCard
              key={u.id}
              id={u.id}
              name={u.name}
              email={u.email}
              avatarUrl={u.avatar}
              onAddFriend={() => handleAddFriend(u.email)}
            />
          ))}
        </div>
      ) : searched ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : null}
    </div>
  );
}
