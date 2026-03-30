import { User, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  onAddFriend: () => void;
  isFriend?: boolean;
}

export default function UserCard({ id, name, email, avatarUrl, onAddFriend, isFriend }: UserCardProps) {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/user/${id}`)}
      className="flex items-center gap-3 rounded-xl bg-accent/50 px-4 py-3 cursor-pointer hover:bg-accent/70 transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </div>
      {!isFriend && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddFriend();
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add
        </button>
      )}
    </div>
  );
}
