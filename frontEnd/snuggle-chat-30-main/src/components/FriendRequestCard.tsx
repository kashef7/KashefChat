import { User, Check, X } from "lucide-react";

interface FriendRequestCardProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function FriendRequestCard({
  name,
  email,
  avatarUrl,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-accent/50 px-4 py-3">
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
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={onReject}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
