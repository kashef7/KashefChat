import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserById } from "@/api/user";
import { sendFriendRequest } from "@/api/friendship";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { User, UserPlus, ArrowLeft, MessageCircle, Users, Mail } from "lucide-react";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!id) return;
    getUserById(id)
      .then(setProfileUser)
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddFriend = async () => {
    if (!profileUser) return;
    try {
      await sendFriendRequest(profileUser.email);
      socket?.emit("sendFriendRequest", {
        receiverEmail: profileUser.email,
        senderName: currentUser?.name,
      });
      setRequestSent(true);
    } catch (err) {
      console.error("Failed to send friend request:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">User Profile</h1>
        <div className="w-5" />
      </div>

      <div className="mb-6 flex flex-col items-center">
        <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
          {profileUser.avatar ? (
            <img src={profileUser.avatar} alt={profileUser.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <User className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground">{profileUser.name}</h2>
        <p className="text-sm text-muted-foreground">{profileUser.email}</p>
      </div>

      {/* Mutual Friends placeholder */}
      <div className="mb-6">
        <h3 className="mb-2 font-semibold text-foreground">Mutual Friends</h3>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-secondary">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleAddFriend}
        disabled={requestSent}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" />
        {requestSent ? "Request Sent" : "Add Friend"}
      </button>
    </div>
  );
}
